# Planning Poker POC - Node.js internals

Shared behavior, routes, and browser/curl verification are documented in `poc/README.md`.

## Runtime requirements

- Node.js `>= 20.0.0`
- npm `>= 9.0.0`
- internet access for DataStar CDN (`jsdelivr`)

Version check:

```bash
node -v
npm -v
```

## Install and run

From `poc/ds_js`:

```bash
npm install
npm start
```

Optional autoreload:

```bash
npm run dev
```

## Local checks (JS-specific)

```bash
npm run smoke
```

## Internals

- `main.mjs`
  - HTTP server and route dispatch.
  - Form parsing and join redirect handling.
  - SSE stream wiring via `@starfederation/datastar-sdk`.
- `game.mjs`
  - In-memory game state (`counter`, players).
  - Connected listener registry and fan-out broadcasting.
  - HTML fragment renderers for counter and player list.
- `templates.mjs`
  - Server-rendered HTML pages (`/`, `/game`).
  - DataStar attributes used for SSE init and POST actions.

## Technical notes

- State is process-local and resets on restart.
- Single shared room/game instance.
- Broadcast drops are not backpressured per listener queue.
- No persistence/auth/session layer by design.
