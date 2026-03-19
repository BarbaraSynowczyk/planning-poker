import express from "express";
import { engine } from "express-handlebars";
import { login } from "./controllers/authController.js";

const app = express();

app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    layoutsDir: "./src/views/layouts",
    partialsDir: "./src/views/partials",
    defaultLayout: "main",
  }),
);
app.set("view engine", "hbs");
app.set("views", "./src/views");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("main", {
    title: "Join Planning Poker",
    name: "Planning Poker",
    content: "Collaborative planning poker tool for agile teams using Jira.",
    css: "/css/mainPage.css",
    error: null,
  });
});

app.get("/clear-error", (req, res) => {
  res.send(`
        <div id="loginError"></div>
    `);
});

app.post("/login", login);

app.listen(8080);
