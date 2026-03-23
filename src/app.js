import express from "express";
import session from "express-session";
import { engine } from "express-handlebars";
import { login } from "./controllers/authController.js";
import { attachRole, isAuthenticated } from "./middleware/requireAuth.js";
import { getFilters, getIssues, groupByFeature, mapFeatures, calculateTotals, getIssuesWithJql } from "./services/jiraService.js";

const app = express();

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

        const featuresArray = mapFeatures(features);
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
        cards: [1, 2, 3, 5, 8, 13, 21],
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
    const featuresArray = mapFeatures(features);

    const totals = calculateTotals(featuresArray);

    res.render("partials/moderator/kanban/kanban", {
        layout: false,
        features: featuresArray,
        ...totals,
    });
});

//##########################################################

app.listen(8080);
