# Planning Poker POC - Go internals

Shared behavior, routes, and browser/curl verification are documented in `poc/README.md`.

## Runtime requirements

- Go `>= 1.22`
- internet access for DataStar CDN (`jsdelivr`)

Version check:

```bash
go version
```

## Install and run

From `poc/ds_go`:

```bash
go mod tidy
CGO_ENABLED=0 go generate ./...
CGO_ENABLED=0 go run .
```

## Local checks (Go-specific)

```bash
CGO_ENABLED=0 go test ./...
```

## Internals

- `main.go`
  - HTTP route wiring and server startup.
  - Counter mutation handlers for `+1` and `-1`.
- `web.go`
  - Form handling for join flow.
  - SSE stream loop using `datastar-go`.
  - Redirect and response shaping for web routes.
- `game.go`
  - Concurrency-safe in-memory state guarded by `sync.RWMutex`.
  - Snapshot-based fan-out to connected players.
  - Counter/player fragment rendering for SSE patches.
- `templates.templ`
  - Source templates for index and game pages.
- `templates_templ.go`
  - Generated template output; regenerated via `go generate ./...`.

## Technical notes

- State is process-local and resets on restart.
- Single shared room/game instance.
- Per-client update channels have bounded buffers.
- No persistence/auth/session layer by design.
