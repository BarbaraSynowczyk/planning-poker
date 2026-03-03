package main

//go:generate go run github.com/a-h/templ/cmd/templ@v0.3.1001 generate

import (
	"errors"
	"log"
	"log/slog"
	"net"
	"net/http"
	"strings"
)

func main() {
	p := NewPoker()

	mux := http.NewServeMux()
	mux.Handle("GET /", http.HandlerFunc(handleIndex))
	mux.Handle("POST /join", handlePostJoin(p))
	mux.Handle("GET /game", handleGame(p))
	mux.Handle("GET /game/updates", handleGameUpdates(p))
	mux.Handle("POST /game/plus", handleCounter(p, 1))
	mux.Handle("POST /game/minus", handleCounter(p, -1))

	srv := http.Server{
		Handler: mux,
	}

	l, err := net.Listen("tcp", ":8080")
	if err != nil {
		log.Fatalf("listen on addr: %q, %s", ":8080", err)
	}

	url := l.Addr().String()
	if strings.HasPrefix(url, "[::]:") {
		port := strings.TrimPrefix(url, "[::]:")
		url = "http://localhost:" + port
	}

	slog.Info("listening", slog.String("on", url))

	err = srv.Serve(l)
	if !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}

func handleCounter(p *Poker, delta int) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p.Add(delta)
		p.BroadcastCounter()
	})
}
