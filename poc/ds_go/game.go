package main

import (
	"bytes"
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"sync"

	"github.com/a-h/templ"
)

type Poker struct {
	mu      sync.Mutex
	counter int

	players   []string
	channels  map[string]chan string
	connected map[string]bool
}

func NewPoker() *Poker {
	return &Poker{
		channels:  make(map[string]chan string),
		connected: make(map[string]bool),
	}
}

func (p *Poker) Add(delta int) int {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.counter = p.counter + delta
	return p.counter
}

func (p *Poker) AddPlayer(nick string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if _, exists := p.channels[nick]; exists {
		return
	}

	p.players = append(p.players, nick)
	p.channels[nick] = make(chan string, 16)
}

func (p *Poker) Connect(nick string) (<-chan string, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()

	ch, ok := p.channels[nick]
	if ok {
		p.connected[nick] = true
	}
	return ch, ok
}

func (p *Poker) Disconnect(nick string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	delete(p.connected, nick)
}

func (p *Poker) BroadcastCounter() {
	p.mu.Lock()
	defer p.mu.Unlock()

	fragment := counter(p.counter)
	err := p.broadcast(context.Background(), fragment)
	if err != nil {
		slog.Error("broadcasting counter", slog.String("err", err.Error()))
	}
}

func (p *Poker) BroadcastPlayerList() {
	p.mu.Lock()
	defer p.mu.Unlock()

	err := p.broadcast(context.Background(), playerList(p.players))
	if err != nil {
		slog.Error("broadcast player list", slog.String("err", err.Error()))
	}
}
func (p *Poker) broadcast(ctx context.Context, cmp templ.Component) error {
	s, err := render(ctx, cmp)
	if err != nil {
		return fmt.Errorf("trying to render before broadcast: %w", err)
	}

	return p.broadcastRaw(ctx, s)
}

func (p *Poker) broadcastRaw(ctx context.Context, fragment string) error {
	for nick, ch := range p.channels {
		if !p.connected[nick] {
			continue
		}
		select {
		case <-ctx.Done():
			return fmt.Errorf("broadcasting, %w", ctx.Err())
		case ch <- fragment:
		default:
			slog.Warn("channel full, dropping update", slog.String("nick", nick))
		}
	}

	return nil
}

type PokerState struct {
	Counter int
	Players []string
}

func (p *Poker) State() PokerState {
	p.mu.Lock()
	defer p.mu.Unlock()
	cp := make([]string, len(p.players))
	copy(cp, p.players)

	return PokerState{
		Counter: p.counter,
		Players: cp,
	}
}

func (p *Poker) renderPlayerList() string {
	var buf bytes.Buffer
	_ = playerList(p.players).Render(context.Background(), &buf)
	return buf.String()
}

func render(ctx context.Context, c templ.Component) (string, error) {
	var buf bytes.Buffer
	err := c.Render(ctx, &buf)
	if err != nil {
		return "", fmt.Errorf("rendering component: %w", err)
	}

	return buf.String(), nil
}

func (p *Poker) HasPlayer(nick string) bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	_, ok := p.channels[nick]
	return ok
}

func handleGame(p *Poker) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		nick := r.URL.Query().Get("nick")
		if nick == "" {
			http.Redirect(w, r, "/", http.StatusSeeOther)
			return
		}

		if !p.HasPlayer(nick) {
			http.Redirect(w, r, "/", http.StatusSeeOther)
			return
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		state := p.State()
		if err := gamePage(nick, state.Players, state.Counter).Render(r.Context(), w); err != nil {
			slog.Error("render game", slog.String("err", err.Error()))
		}
	})
}
