import express from "express";
import session from "express-session";
import { engine } from "express-handlebars";
import { login } from "./controllers/authController.js";
import { attachRole, isAuthenticated } from "./middleware/requireAuth.js";
import { getFilters, getIssues, groupByFeature, splitFeaturesByEstimationStatus, calculateTotals, getIssuesWithJql } from "./services/jiraService.js";
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/node";
import { v4 as uuidv4 } from "uuid";

const app = express();
const sessions = {};

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
        req.session.redirectAfterLogin = `/session/${sessionId}`;
        return res.redirect("/");
    }

    const session = sessions[sessionId];

    if (!session) {
        return res.status(404).send("Session not found");
    }

    if (!session.players.find(p => p.accountId === user.accountId)) {
        session.players.push({
            accountId: user.accountId,
            name: user.userName,
            avatar: user.avatar,
        });
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
        css: "/css/gamePage.css",
    });
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

    res.sendStatus(200);
});

app.post("/create-session", (req, res) => {
    const { user } = req.session;

    if (!user) {
        return res.status(401).send("Unauthorized");
    }

    const sessionId = uuidv4();

    sessions[sessionId] = {
        projectKey: user.projectKey,
        createdBy: user.userName,
        moderator: user.accountId,
        players: [],
        activeTask: null,
        cards: [1, 2, 3, 5, 8, 13, 21],
    };

    res.json({
        link: `/session/${sessionId}`,
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
    const { user } = req.session;

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

    return res.render("game", {
        userName: user.userName,
        avatar: user.avatar,
        cards: session.cards,
        players: [],
        css: "/css/gamePage.css",
    });
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
