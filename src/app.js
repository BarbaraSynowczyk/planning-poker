import express from "express";
import session from "express-session";
import { engine } from "express-handlebars";
import { login } from "./controllers/authController.js";
import { attachRole, isAuthenticated } from "./middleware/requireAuth.js";
import { getFilters, getIssues, groupByFeature, splitFeaturesByEstimationStatus, calculateTotals, getIssuesWithJql } from "./services/jiraService.js";
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/node";
import { v4 as uuidv4 } from "uuid";
import { formatDate, timeAgo } from "./utils/dataHelpers.js";
import { broadcast, render } from "./utils/sse.js";
import handlebars from "handlebars";
import { updateStoryPoints } from "./services/jiraService.js";

const app = express();
const sessions = {};

handlebars.registerHelper("range", (from, to) => {
    const arr = [];
    for (let i = to; i >= from; i--) {
        arr.push(i);
    }
    return arr;
});

app.engine(
    "hbs",
    engine({
        extname: ".hbs",
        layoutsDir: "./src/views/layouts",
        partialsDir: "./src/views/partials",
        defaultLayout: "main",
        helpers: {
            json: (v) => JSON.stringify(v),
            encode: (v) => encodeURIComponent(v),
            formatDate,
            timeAgo,
            formatTime: (ms) => {
                const seconds = Math.floor(ms / 1000);
                const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
                const secs = String(seconds % 60).padStart(2, "0");
                return `${mins}:${secs}`;
            },
            eq: (a, b) => a === b,
            multiply: (a, b) => {
                if (!b) return 0;
                return (a / b) * 100;
            },
            and: (a, b) => a && b
        },
    }),
);
app.set("view engine", "hbs");
app.set("views", "./src/views");


app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
    session({
        secret: "super-secret-key",
        resave: false,
        saveUninitialized: false,
    }),
);



app.get("/session/:id", (req, res) => {
    const { user } = req.session;
    const sessionId = req.params.id;

    if (!user) {
        req.session.redirectAfterLogin = req.originalUrl;
        return res.redirect("/");
    }

    const session = sessions[sessionId];

    if (!session) {
        return res.status(404).send("Session not found");
    }

    const isModerator = session.moderator === user.accountId;

    res.render("game", {
        sessionId,
        userName: user.userName,
        avatar: user.avatar,
        isModerator,
        players: session.players,
        activeTask: session.activeTask,
        cards: session.cards,
        timerEnd: session.timerEnd,
        css: "/css/gamePage.css",
        script: "/js/game.js"
    });

});

app.get("/join/:id", (req, res) => {
    const sessionId = req.params.id;
    req.session.user = null;

    req.session.redirectAfterLogin = `/session/${sessionId}`;

    return res.redirect("/");
});

app.post("/session/:id/active-task", (req, res) => {
    const { user } = req.session;
    const sessionId = req.params.id;

    const session = sessions[sessionId];

    if (!session) {
        return res.status(404).send("Session not found");
    }

    if (session.moderator !== user.accountId) {
        return res.status(403).send("Only moderator can change task");
    }

    session.activeTask = req.body.task;

    broadcast(session);

    res.sendStatus(200);
});


app.get("/session/:id/events", (req, res) => {
    const sessionId = req.params.id;
    const session = sessions[sessionId];
    const { user } = req.session;

    if (!session || !user) {
        return res.status(404).end();
    }

    const exists = session.players.find(p => p.accountId === user.accountId);

    if (!exists) {
        session.players.push({
            accountId: user.accountId,
            name: user.userName,
            avatar: user.avatar,
        });

        broadcast(session);
    }

    const sse = new ServerSentEventGenerator(req, res);
    session.clients.push(sse);

    sse.patchElements(render(session, sse.user));

    req.on("close", () => {
        session.clients = session.clients.filter(c => c !== sse);
    });
});

app.post("/session/:id/save-estimate", async (req, res) => {
    const session = sessions[req.params.id];
    const user = req.session.user;

    if (!session || !user) {
        return res.sendStatus(404);
    }

    if (session.moderator !== user.accountId) {
        return res.status(403).send("Only moderator");
    }

    const { value } = req.body;

    if (!session.activeTask) {
        return res.status(400).send("No active task");
    }

    try {
        await updateStoryPoints(
            user.domain,
            user.auth,
            session.activeTask.key,
            value
        );

        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Jira update failed");
    }
});

app.post("/session/:id/start", (req, res) => {
    const session = sessions[req.params.id];

    if (session.moderator !== req.session.user.accountId) {
        return res.status(403).send("Only moderator");
    }

    if (session.timerEnd) {
        return res.sendStatus(200);
    }

    session.votes = {};
    session.isVoting = true;
    session.revealed = false;

    session.timerEnd = Date.now() + 60000;

    broadcast(session);
    res.sendStatus(200);
});


app.post("/session/:id/stop", (req, res) => {
    const session = sessions[req.params.id];

    if (session.moderator !== req.session.user.accountId) {
        return res.status(403).send("Only moderator");
    }

    if (!session.timerEnd) return res.sendStatus(200);

    session.remaining = session.timerEnd - Date.now();

    session.timerEnd = null;

    session.isVoting = false;

    broadcast(session);
    res.sendStatus(200);
});

// ################################### GEN BY AI ###############################

app.post("/session/:id/vote", (req, res) => {
    const session = sessions[req.params.id];
    const user = req.session.user;

    if (!session || !user) {
        return res.sendStatus(404);
    }
    if (!session.isVoting) {
        return res.sendStatus(403);
    }

    const value = req.query.value;

    session.votes[user.accountId] = value;

    broadcast(session);
    res.sendStatus(200);
});

app.post("/session/:id/reveal", (req, res) => {
    const session = sessions[req.params.id];
    const user = req.session.user;

    if (!session || !user) {
        return res.sendStatus(404);
    }

    if (session.moderator !== user.accountId) {
        return res.status(403).send("Only moderator");
    }

    session.revealed = true;

    broadcast(session);
    res.sendStatus(200);
});

// ############################################################################


app.post("/create-session", (req, res) => {
    const { user } = req.session;
    const sessionId = uuidv4();

    sessions[sessionId] = {
        projectKey: user.projectKey,
        createdBy: user.userName,
        moderator: user.accountId,
        players: [],
        activeTask: null,
        cards: [1, 2, 3, 5, 8, 13, 21],
        clients: [],
        votes: {},
        isVoting: false,
        revealed: false,
        timerEnd: null,
        remaining: null,
    };

    req.session.currentSessionId = sessionId;

    res.json({
        link: `/join/${sessionId}`,
    });

});


app.get("/", (req, res) => {
  res.render("main", {
    title: "Join Planning Poker",
    name: "Planning Poker",
    content: "Collaborative planning poker tool for agile teams using Jira.",
    css: "/css/mainPage.css",
    error: null,
  });
});

app.post("/login", login);


app.get("/game", isAuthenticated, attachRole, async (req, res) => {
    const { user, currentSessionId } = req.session;

    if (currentSessionId && sessions[currentSessionId]) {
        return res.redirect(`/session/${currentSessionId}`);
    }

    if (req.userRole === "moderator") {
        const filters = await getFilters(user.domain, user.auth);
        const tasks = await getIssues(user.domain, user.auth, user.projectKey);

        const features = groupByFeature(tasks);
        const featuresArray = splitFeaturesByEstimationStatus(features);
        const totals = calculateTotals(featuresArray);

        return res.render("moderator", {
            userName: user.userName,
            avatar: user.avatar,
            filters,
            features: featuresArray,
            ...totals,
            jql: `project = ${user.projectKey}`,
            css: "/css/moderatorPage.css",
            script: "/js/moderator.js",
        });
    }

    return res.send("No session");
});


// ####################### GEN BY AI ########################
app.post("/filter", async (req, res) => {
    const { user } = req.session;
    const jql = req.body?.jql || "ALL";

    const tasks = await getIssuesWithJql(
        user.domain,
        user.auth,
        jql,
        user.projectKey
    );

    const features = groupByFeature(tasks);
    const featuresArray = splitFeaturesByEstimationStatus(features);

    const totals = calculateTotals(featuresArray);

    res.render("partials/moderator/kanban/kanban", {
        layout: false,
        features: featuresArray,
        ...totals,
    });
});

//##########################################################

app.listen(8080);
