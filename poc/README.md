# Planning Poker POC - shared behavior

This document covers behavior and verification common to both implementations:

- `poc/ds_js` (Node.js)
- `poc/ds_go` (Go)

Implementation-specific internals and toolchains are in:

- `poc/ds_js/README.md`
- `poc/ds_go/README.md`

## Shared routes and behavior

Both apps expose the same endpoints and user flow:

- `GET /`
  - renders join page
- `POST /join`
  - expects `nick` form value
  - registers player
  - redirects to `/game?nick=<encoded>` with `303 See Other`
- `GET /game?nick=<nick>`
  - renders game page for known player
  - redirects to `/` when player is unknown
- `GET /game/updates?nick=<nick>`
  - opens SSE stream for live HTML fragment updates
- `POST /game/plus`
  - increments counter by `+1`
- `POST /game/minus`
  - decrements counter by `-1`

Shared runtime model:

- in-memory state only
- one shared game room
- updates broadcast to connected players

## Shared manual verification

1. Start either implementation (see its own README).
2. Open `http://localhost:8080` in two tabs.
3. Join as different users (for example `alice`, `bob`).
4. Confirm both tabs show the same player list.
5. Click `+1` or `-1` in one tab.
6. Confirm counter changes in both tabs.

## Shared curl checks

Run after starting either server:

```bash
curl -i http://localhost:8080/
curl -i -X POST -d 'nick=alice' http://localhost:8080/join
curl -i 'http://localhost:8080/game?nick=alice'
```

Expected:

- `/` -> `200` HTML
- `/join` -> `303` to `/game?nick=alice`
- `/game?nick=alice` -> `200` HTML

