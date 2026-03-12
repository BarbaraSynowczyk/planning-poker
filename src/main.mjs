import http from "node:http";
import { mainPage, gamePage } from "./views/templates.mjs";
import { Game } from "./game/game.mjs";
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk/node";

import fs from "node:fs";
import path from "node:path";

const game = new Game();

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

        game.addPlayer(userName);
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
    const avatar = game.avatars[userName];

    game.addPlayer(userName);

    const gameState = game.renderGameState();

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(gamePage(userName, avatar, gameState));

    return;
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
    ServerSentEventGenerator.stream(req, res, (stream) => {
      game.addClient(stream);

      stream.patchElements(game.renderGameState());




      req.on("close", () => {
        game.removeClient(stream);
        stream.close()
      });

    },{
      keepalive:true,
    });

    return;
  }
});

server.listen(8080, () => {
  console.log("Server running at http://localhost:8080");
});
