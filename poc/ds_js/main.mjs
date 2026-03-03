import http from "node:http";
import { URL } from "node:url";
import { ServerSentEventGenerator } from "@starfederation/datastar-sdk";
import { Poker } from "./game.mjs";
import { indexPage, gamePage } from "./templates.mjs";

const HOST = "localhost";
const PORT = Number(process.env.PORT || 8080);
const CONTENT_TYPE_HTML = "text/html; charset=utf-8";
const CONTENT_TYPE_TEXT = "text/plain; charset=utf-8";

const poker = new Poker();

function parseFormBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(new URLSearchParams(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": CONTENT_TYPE_TEXT });
  res.end(body);
}

function noContent(res) {
  res.writeHead(204);
  res.end();
}

function redirect(res, location) {
  res.writeHead(303, { Location: location });
  res.end();
}

async function route(req, res) {
  try {
    const host = req.headers.host || `${HOST}:${PORT}`;
    const url = new URL(req.url || "/", `http://${host}`);
    const method = req.method || "GET";

    if (method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "Content-Type": CONTENT_TYPE_HTML });
      res.end(indexPage());
      return;
    }

    if (method === "POST" && url.pathname === "/join") {
      await handlePostJoin(req, res);
      return;
    }

    if (method === "GET" && url.pathname === "/game") {
      handleGame(res, url);
      return;
    }

    if (method === "GET" && url.pathname === "/game/updates") {
      handleGameUpdates(req, res, url);
      return;
    }

    if (method === "POST" && url.pathname === "/game/plus") {
      poker.add(1);
      poker.broadcastCounter();
      noContent(res);
      return;
    }

    if (method === "POST" && url.pathname === "/game/minus") {
      poker.add(-1);
      poker.broadcastCounter();
      noContent(res);
      return;
    }

    sendText(res, 404, "Not Found");
  } catch (error) {
    console.error("request failed", error);
    if (!res.headersSent) {
      sendText(res, 500, "Internal Server Error");
      return;
    }
    res.end();
  }
}

async function handlePostJoin(req, res) {
  const params = await parseFormBody(req);
  const nick = (params.get("nick") || "").trim();

  if (!nick) {
    sendText(res, 400, "nick is required");
    return;
  }

  poker.addPlayer(nick);
  poker.broadcastPlayerList();

  redirect(res, `/game?nick=${encodeURIComponent(nick)}`);
}

function handleGame(res, url) {
  const nick = url.searchParams.get("nick") || "";

  if (!nick || !poker.hasPlayer(nick)) {
    redirect(res, "/");
    return;
  }

  const state = poker.state();
  res.writeHead(200, { "Content-Type": CONTENT_TYPE_HTML });
  res.end(gamePage(nick, state.players, state.counter));
}

function handleGameUpdates(req, res, url) {
  const nick = url.searchParams.get("nick") || "";

  if (!nick) {
    sendText(res, 400, "nick is required");
    return;
  }

  if (!poker.hasPlayer(nick)) {
    sendText(res, 404, "unknown player");
    return;
  }

  ServerSentEventGenerator.stream(
    req,
    res,
    (sse) => {
      poker.connect(nick);

      const listener = (fragment) => {
        sse.patchElements(fragment);
      };

      poker.addListener(nick, listener);

      return new Promise((resolve) => {
        req.on("close", () => {
          poker.removeListener(nick, listener);
          poker.disconnect(nick);
          resolve();
        });
      });
    },
    { keepalive: true },
  );
}

const server = http.createServer(route);

server.listen(PORT, () => {
  console.log(`listening on http://${HOST}:${PORT}`);
});

