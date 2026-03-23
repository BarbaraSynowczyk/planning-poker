import http from "node:http";
import { moderatorPage } from "./views/moderator.mjs";
import { mainPage } from "./views/mainPage.mjs";
import { gamePage } from "./views/gamePage.mjs";

import { Game } from "./game/game.mjs";
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/node";

import fs from "node:fs";
import path from "node:path";

const game = new Game();
const sessions = {};

//############################## MODERATOR PAGE ###################################

async function isModerator(projectKey, accountId, domain, auth) {
  const r = await fetch(`https://${domain}/rest/api/3/project/${projectKey}`, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });

  const data = await r.json();
  console.log(data.lead);
  console.log(accountId);

  return data.lead?.accountId === accountId;
}
//###############################################################################
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname.startsWith("/css/") || url.pathname.startsWith("/images/")) {
    const filePath = path.join("public", url.pathname);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const ext = path.extname(filePath);

      const types = {
        ".css": "text/css",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
      };

      res.writeHead(200, {
        "Content-Type": types[ext] || "application/octet-stream",
      });

      res.end(data);
    });

    return;
  }

  // LOGIN PAGE
  if (url.pathname === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(mainPage());
    return;
  }

  // LOGIN REQUEST
  if (url.pathname === "/login" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => (body += chunk));

    req.on("end", async () => {
      const params = new URLSearchParams(body);

      const email = params.get("email");
      const token = params.get("token");
      const domain = params.get("domain");

      const auth = Buffer.from(`${email}:${token}`).toString("base64");

      try {
        const response = await fetch(`https://${domain}/rest/api/3/myself`, {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(mainPage("Invalid email or API token"));
            return;
          }

          if (response.status === 404) {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(mainPage("Domain not found"));
            return;
          }

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(mainPage("Cannot connect to Jira. Check your domain"));
          return;
        }

        const data = await response.json();

        const userName = data.displayName;
        const avatar = data.avatarUrls["24x24"];
        const accountId = data.accountId;
        const filters = await getFilters();

        // ############################# GETTING TASKS, GEN BY AI ##############################

        const projectResponse = await fetch(
          `https://${domain}/rest/api/3/project/search`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              Accept: "application/json",
            },
          },
        );

        const projectData = await projectResponse.json();
        const projects = projectData.values.map((p) => ({
          key: p.key,
          name: p.name,
        }));
        const allTasks = [];

        sessions[userName] = {
          userName,
          avatar,
          accountId,
          domain,
          auth,
          filters,
          projects,
          tasks: allTasks,
          allTasks: allTasks,
        };

        for (const p of projects) {
          try {
            const issues = await getIssues(p.key);

            const tasks = issues.map((i) => ({
              project: p.name,
              key: i.key,
              name: i.fields.summary,
              status: i.fields.status?.name,
              storyPoints: i.fields.customfield_10016,
              assignee: i.fields.assignee?.displayName,
              reporter: i.fields.reporter?.displayName,
              labels: i.fields.labels,
              description: i.renderedFields?.description || "",
              created: i.fields.created,
              updated: i.fields.updated,
              feature: i.fields.parent?.fields?.summary ?? "No Feature",
              featureKey: i.fields.parent?.key ?? null,
              comments:
                i.renderedFields?.comment?.comments.map((c) => ({
                  author: c.author.displayName,
                  avatar: Object.values(c.author.avatarUrls)[0],
                  text: c.body || "",

                  created: c.created,
                })) ?? [],
            }));

            console.log(...tasks);
            allTasks.push(...tasks);
          } catch (err) {
            console.error(`Error fetching issues for ${p.key}:`, err);
          }
        }

        async function getIssues(projectKey) {
          const jql = encodeURIComponent(`project=${projectKey}`);

          const r = await fetch(
            `https://${domain}/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=summary,status,assignee,reporter,labels,description,created,updated,comment,customfield_10016,parent&expand=renderedFields`,
            {
              headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
              },
            },
          );

          const data = await r.json();
          return data.issues ?? [];
        }

        // ########################################################################

        // ############################## GETTING FILTERS ##############################

        async function getFilters() {
          const r = await fetch(`https://${domain}/rest/api/3/filter/search`, {
            headers: {
              Authorization: `Basic ${auth}`,
              Accept: "application/json",
            },
          });

          const data = await r.json();
          const filters = data.values ?? [];

          const fullFilters = [];

          for (const f of filters) {
            const fr = await fetch(
              `https://${domain}/rest/api/3/filter/${f.id}`,
              {
                headers: {
                  Authorization: `Basic ${auth}`,
                  Accept: "application/json",
                },
              },
            );

            const fd = await fr.json();

            fullFilters.push({
              id: fd.id,
              name: fd.name,
              jql: fd.jql,
              owner: fd.owner?.displayName,
            });
          }

          return fullFilters;
        }

        //################################################################################

        game.addPlayer(userName);
        game.avatars[userName] = avatar;

        res.writeHead(302, {
          Location: `/game?userName=${encodeURIComponent(userName)}`,
        });

        res.end();
      } catch (error) {
        console.error(error);

        res.writeHead(500, { "Content-Type": "text/html" });
        res.end(mainPage("Cannot connect to Jira. Check your domain."));
      }
    });

    return;
  }

  // GAME PAGE
  if (url.pathname === "/game" && req.method === "GET") {
    const userName = url.searchParams.get("userName");
    const session = sessions[userName];

    if (!session) {
      res.writeHead(302, { Location: "/" });
      res.end();
      return;
    }

    const { avatar, accountId, domain, auth, filters, projects, tasks } =
      session;

    const projectKey = projects[0].key;

    if (!projectKey) {
      res.end("No Jira projects found");
      return;
    }

    const moderator = await isModerator(projectKey, accountId, domain, auth);

    game.addPlayer(userName);

    const gameState = game.renderGameState();

    res.writeHead(200, { "Content-Type": "text/html" });

    if (moderator) {
      res.end(moderatorPage(userName, avatar, filters, tasks));
    } else {
      res.end(gamePage(userName, avatar, gameState));
    }

    return;
  }

  // FILTER TASKS BY JQL
  if (url.pathname === "/filter" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => (body += chunk));

    req.on("end", async () => {
      const { userName, jql } = JSON.parse(body);

      const session = sessions[userName];

      if (!session) {
        res.writeHead(400);
        res.end("No session");
        return;
      }

      if (!jql || jql === "ALL") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          moderatorPage(
            userName,
            session.avatar,
            session.filters,
            session.allTasks,
          ),
        );
        return;
      }

      const { domain, auth } = session;

      const encodedJql = encodeURIComponent(jql);

      const r = await fetch(
        `https://${domain}/rest/api/3/search/jql?jql=${encodedJql}&maxResults=100&fields=summary,labels,description,created,updated,comment,customfield_10016,parent&expand=renderedFields`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
        },
      );

      const data = await r.json();

      console.log("STATUS:", r.status);
      console.log("FILTER RESPONSE:", data);

      if (!data.issues) {
        console.error("JIRA ERROR:", data);
        return;
      }

      const tasks = data.issues.map((i) => ({
        key: i.key,
        name: i.fields.summary,
        storyPoints: i.fields.customfield_10016,
        labels: i.fields.labels,
        description: i.renderedFields?.description || "",
        created: i.fields.created,
        updated: i.fields.updated,
        feature: i.fields.parent?.fields?.summary ?? "No Feature",
        featureKey: i.fields.parent?.key ?? null,
        comments:
          i.renderedFields?.comment?.comments.map((c) => ({
            author: c.author.displayName,
            avatar: c.author.avatarUrls["24x24"],
            text: c.body || "",
            created: c.created,
          })) ?? [],
      }));

      session.tasks = tasks;

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(moderatorPage(userName, session.avatar, session.filters, tasks));
    });
  }

  // VOTE
  if (url.pathname === "/game/vote" && req.method === "POST") {
    const player = url.searchParams.get("player");
    const value = url.searchParams.get("value");

    game.vote(player, value);

    const html = game.renderGameState();

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);

    return;
  }

  if (url.pathname === "/game/updates") {
    ServerSentEventGenerator.stream(
      req,
      res,
      (stream) => {
        game.addClient(stream);

        stream.patchElements(game.renderGameState());

        req.on("close", () => {
          game.removeClient(stream);
          stream.close();
        });
      },
      {
        keepalive: true,
      },
    );

    return;
  }
});

server.listen(8080, () => {
  console.log("Server running at http://localhost:8080");
});
