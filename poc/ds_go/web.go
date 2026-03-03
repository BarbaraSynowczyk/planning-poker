package main

import (
	"log/slog"
	"net/http"
	"net/url"
	"strings"

	"github.com/starfederation/datastar-go/datastar"
)

func handleGameUpdates(p *Poker) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nick := r.URL.Query().Get("nick")
		if nick == "" {
			http.Error(w, "nick is required", http.StatusBadRequest)
			return
		}

		updates, ok := p.Connect(nick)
		if !ok {
			http.Error(w, "unknown player", http.StatusNotFound)
			return
		}
		defer p.Disconnect(nick)

		sse := datastar.NewSSE(w, r)

		for {
			select {
			case <-r.Context().Done():
				slog.Info("player disconnected", slog.String("nick", nick))
				return
			case fragment, open := <-updates:
				if !open {
					return
				}
				if err := sse.PatchElements(fragment); err != nil {
					slog.Error("send update", slog.String("nick", nick), slog.String("err", err.Error()))
					return
				}
			}
		}
	})
}

func handlePostJoin(p *Poker) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			slog.Error("parse form", slog.String("err", err.Error()))
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		nick := strings.TrimSpace(r.FormValue("nick"))
		if nick == "" {
			http.Error(w, "nick is required", http.StatusBadRequest)
			return
		}

		p.AddPlayer(nick)
		slog.Info("player joined", slog.String("nick", nick))
		p.BroadcastPlayerList()

		http.Redirect(w, r, "/game?nick="+url.QueryEscape(nick), http.StatusSeeOther)
	})
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := indexPage().Render(r.Context(), w); err != nil {
		slog.Error("render index", slog.String("err", err.Error()))
	}
}
