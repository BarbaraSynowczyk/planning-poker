import express from "express";
import session from "express-session";
import { engine } from "express-handlebars";
import { login } from "./controllers/authController.js";
import { attachRole, isAuthenticated } from "./middleware/requireAuth.js";
import { logger, requestLogger } from "./middleware/logger.js";
import { getFilters, getIssues, groupByFeature, splitFeaturesByEstimationStatus, calculateTotals, getIssuesWithJql } from "./services/jiraService.js";
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/node";
import { v4 as uuidv4 } from "uuid";
import { formatDate, timeAgo } from "./utils/dataHelpers.js";
import { broadcast, render } from "./utils/sse.js";
import handlebars from "handlebars";
import { updateStoryPoints } from "./services/jiraService.js";
import dotenv from "dotenv";

dotenv.config();

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

app.use(requestLogger);


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

    const tasksToEstimate = session.tasks.filter(
        task => !task.storyPoints && (!task.labels || task.labels.length === 0)
    );

    const tasksEstimated = session.tasks.filter(
        task => task.storyPoints
    );

    res.render("game", {
        sessionId,
        jiraDomain: user.domain,
        userName: user.userName,
        avatar: user.avatar,
        isModerator,
        players: session.players,
        activeTask: session.activeTask,
        tasks: session.tasks,
        tasksToEstimate,
        tasksEstimated,
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

    const task = session.tasks.find(
        task => task.key === req.body.taskKey
    );

    if (!task) {
        return res.status(404).send("Task not found");
    }

    session.activeTask = task;

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
    sse.sessionUser = user;

    session.clients.push(sse);

    sse.patchElements(render(session, sse.sessionUser));

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

        const task = session.tasks.find(
            task => task.key === session.activeTask.key
        );

        if (task) {
            task.storyPoints = Number(value);
        }

        broadcast(session);

        res.sendStatus(200);
    } catch (err) {
        logger.error(
            {
                requestId: req.requestId,
                err,
            },
            "Jira update failed",
        );
        res.status(500).send("Jira update failed");
    }
});

app.get("/jira-attachment/:id", async (req, res) => {
    const { user } = req.session;

    if (!user) {
        return res.sendStatus(401);
    }

    try {
        const response = await fetch(
            `https://${user.domain}/rest/api/3/attachment/content/${req.params.id}`,
            {
                headers: {
                    Authorization: `Basic ${user.auth}`,
                },
            }
        );

        if (!response.ok) {
            return res.sendStatus(response.status);
        }

        res.set(
            "Content-Type",
            response.headers.get("content-type") || "application/octet-stream"
        );

        const buffer = await response.arrayBuffer();

        res.send(Buffer.from(buffer));
    } catch (err) {
        logger.error(
            {
                requestId: req.requestId,
                err,
            },
            "Jira attachment fetch failed",
        );

        res.sendStatus(500);
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


app.post("/create-session", async (req, res) => {
    const { user } = req.session;
    const jql = req.session.currentJql || "ALL";
    const { taskKey } = req.body;
    const sessionId = uuidv4();

    if (req.session.currentSessionId) {
        const session = sessions[req.session.currentSessionId];

        if (session) {
            const task = session.tasks.find(
                task => task.key === taskKey
            );

            if (task) {
                session.activeTask = task;
                broadcast(session);
            }
            res.set("datastar-selector", "#session-link-wrapper");
            res.set("datastar-mode", "inner");

           return res.render("partials/moderator/sessionLink", {
               layout: false,
               sessionLink: `${req.protocol}://${req.get("host")}/join/${req.session.currentSessionId}`,
               task,
           });
        }
    }

     const tasks = await getIssuesWithJql(
            user.domain,
            user.auth,
            jql || "ALL",
            user.projectKey
     );

    sessions[sessionId] = {
        projectKey: user.projectKey,
        createdBy: user.userName,
        moderator: user.accountId,
        players: [],
        activeTask: tasks.find(task => task.key === taskKey) || null,
        tasks: tasks,
        cards: [1, 2, 3, 5, 8, 13, 21, "coffee", "question"],
        clients: [],
        votes: {},
        isVoting: false,
        revealed: false,
        timerEnd: null,
        remaining: null,
    };

    req.session.currentSessionId = sessionId;

    res.set("datastar-selector", "#session-link-wrapper");
    res.set("datastar-mode", "inner");

    res.render("partials/moderator/sessionLink", {
        layout: false,
        sessionLink: `${req.protocol}://${req.get("host")}/join/${sessionId}`,
    });

});


app.get("/", (req, res) => {
  res.render("main", {
    title: "Join Planning Poker",
    name: "Planning Poker",
    content: "Collaborative planning poker tool for agile teams using Jira.",
    jiraDefaultDomain: process.env.LOGIN_FORM_JIRA_DEFAULT_DOMAIN,
    css: "/css/mainPage.css",
    error: null,
  });
});

app.post("/login", login);

app.get("/game", isAuthenticated, async (req, res) => {

    const { user, currentSessionId } = req.session;

    if (currentSessionId && sessions[currentSessionId]) {
        return res.redirect(`/session/${currentSessionId}`);
    }

    const filters = await getFilters(user.domain, user.auth);
    const tasks = await getIssues(user.domain, user.auth, user.projectKey);

    const features = groupByFeature(tasks);
    const featuresArray = splitFeaturesByEstimationStatus(features);

    const itemsPerPage = 3;
    const page = 1;
    const totalPages = Math.ceil(featuresArray.length / itemsPerPage);
    const paginatedFeatures = featuresArray.slice(0, itemsPerPage);

    const totals = calculateTotals(featuresArray);

    return res.render("moderator", {
        userName: user.userName,
        avatar: user.avatar,
        filters,
        features: paginatedFeatures,
        page,
        totalPages,
        ...totals,
        jql: `project = ${user.projectKey}`,
        css: "/css/moderatorPage.css",
        script: "/js/moderator.js",
    });
});


// ####################### GEN BY AI ########################

app.get("/task-preview/:taskKey", (req, res) => {
    const { user } = req.session;
    const { taskKey } = req.params;

    if (!user || !req.session.currentSessionId) {
        return res.sendStatus(404);
    }

    const session = sessions[req.session.currentSessionId];

    if (!session) {
        return res.sendStatus(404);
    }

    const task = session.tasks.find(task => task.key === taskKey);

    if (!task) {
        return res.sendStatus(404);
    }

    res.set("datastar-selector", "#ticketPreview");
    res.set("datastar-mode", "inner");

    res.render("partials/moderator/ticketPreview", {
        layout: false,
        task,
    });
});


app.post("/filter", async (req, res) => {
    const { user } = req.session;
    const jql = req.body?.jql || "ALL";
    const page = Number(req.body?.page) || 1;
    req.session.currentJql = jql;

    const tasks = await getIssuesWithJql(
        user.domain,
        user.auth,
        jql,
        user.projectKey
    );

    if (req.session.currentSessionId) {
        const session = sessions[req.session.currentSessionId];

        if (session) {
            session.tasks = tasks;
        }
    }

    const features = groupByFeature(tasks);
    const featuresArray = splitFeaturesByEstimationStatus(features);

    const itemsPerPage = 3;
    const totalPages = Math.ceil(featuresArray.length / itemsPerPage);

    const start = (page - 1) * itemsPerPage;
    const paginatedFeatures = featuresArray.slice(start, start + itemsPerPage);

    const totals = calculateTotals(featuresArray);

    console.log("PAGINATION:", page, totalPages);

    res.render("partials/moderator/kanban/kanban", {
        layout: false,
        features: paginatedFeatures,
        ...totals,
        jql,
        page,
        totalPages,
    });
});

//##########################################################

app.listen(8080);
