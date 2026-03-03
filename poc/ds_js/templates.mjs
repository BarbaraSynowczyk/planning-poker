import { escapeHtml, renderPlayerList, renderCounter } from "./game.mjs";

function indexPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Planning Poker</title>
  <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@main/bundles/datastar.js"></script>
</head>
<body>
  <main>
    <h1>Planning Poker</h1>
    <form method="post" action="/join">
      <label for="nick">Nickname:</label>
      <input type="text" id="nick" name="nick" required>
      <button type="submit">Join</button>
    </form>
  </main>
</body>
</html>`;
}

function gamePage(nick, players, count) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Planning Poker - Game</title>
  <script type="module" src="https://cdn.jsdelivr.net/gh/starfederation/datastar@main/bundles/datastar.js"></script>
</head>
<body>
  <main data-init="@get('/game/updates?nick=${escapeHtml(nick)}')">
    <h1>Game</h1>
    <h2>Players</h2>
    ${renderPlayerList(players)}
    ${renderCounter(count)}
    <div id="game-content">
      <button data-on:click="@post('/game/plus')">+1</button>
      <button data-on:click="@post('/game/minus')">-1</button>
    </div>
  </main>
</body>
</html>`;
}

export { indexPage, gamePage };

