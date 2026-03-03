import http from "node:http";
import { URL } from "node:url";
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk";
import { Poker } from "./game.mjs";
import { indexPage, gamePage } from "./templates.mjs";

const poker = new Poker();

function parseFormBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(new URLSearchParams(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  if (method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(indexPage());
    return;
  }

  if (method === "POST" && url.pathname === "/join") {
    await handlePostJoin(req, res);
    return;
  }

  if (method === "GET" && url.pathname === "/game") {
    handleGame(req, res, url);
    return;
  }

  if (method === "GET" && url.pathname === "/game/updates") {
    handleGameUpdates(req, res, url);
    return;
  }

  if (method === "POST" && url.pathname === "/game/plus") {
    poker.add(1);
    poker.broadcastCounter();
    res.writeHead(204);
    res.end();
    return;
  }

  if (method === "POST" && url.pathname === "/game/minus") {
    poker.add(-1);
    poker.broadcastCounter();
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
}

async function handlePostJoin(req, res) {
  const params = await parseFormBody(req);
  const nick = (params.get("nick") || "").trim();

  if (!nick) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("nick is required");
    return;
  }

  poker.addPlayer(nick);
  console.log(`player joined: ${nick}`);
  poker.broadcastPlayerList();

  res.writeHead(303, { Location: `/game?nick=${encodeURIComponent(nick)}` });
  res.end();
}

function handleGame(req, res, url) {
  const nick = url.searchParams.get("nick") || "";

  if (!nick || !poker.hasPlayer(nick)) {
    res.writeHead(303, { Location: "/" });
    res.end();
    return;
  }

  const state = poker.state();
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(gamePage(nick, state.players, state.counter));
}

function handleGameUpdates(req, res, url) {
  const nick = url.searchParams.get("nick") || "";

  if (!nick) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("nick is required");
    return;
  }

  if (!poker.hasPlayer(nick)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("unknown player");
    return;
  }

  ServerSentEventGenerator.stream(req, res, (sse) => {
    poker.connect(nick);

    const listener = (fragment) => {
      sse.patchElements(fragment);
    };

    poker.addListener(nick, listener);

    return new Promise((resolve) => {
      req.on("close", () => {
        console.log(`player disconnected: ${nick}`);
        poker.removeListener(nick, listener);
        poker.disconnect(nick);
        resolve();
      });
    });
  }, { keepalive: true });
}

const server = http.createServer(route);

server.listen(8080, () => {
  console.log(`listening on http://localhost:8080`);
});

