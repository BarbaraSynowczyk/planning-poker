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
	mu      sync.RWMutex
	counter int

	players         []string
	updatesByNick   map[string]chan string
	connectedByNick map[string]bool
}

func NewPoker() *Poker {
	return &Poker{
		updatesByNick:   make(map[string]chan string),
		connectedByNick: make(map[string]bool),
	}
}

func (p *Poker) Add(delta int) int {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.counter += delta
	return p.counter
}

func (p *Poker) AddPlayer(nick string) {
	p.mu.Lock()
	defer p.mu.Unlock()

	if _, exists := p.updatesByNick[nick]; exists {
		return
	}

	p.players = append(p.players, nick)
	p.updatesByNick[nick] = make(chan string, 16)
}

func (p *Poker) Connect(nick string) (<-chan string, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()

	ch, ok := p.updatesByNick[nick]
	if ok {
		p.connectedByNick[nick] = true
	}
	return ch, ok
}

func (p *Poker) Disconnect(nick string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	delete(p.connectedByNick, nick)
}

func (p *Poker) BroadcastCounter() {
	fragment, err := render(context.Background(), counter(p.snapshotCounter()))
	if err != nil {
		slog.Error("broadcast counter", slog.String("err", err.Error()))
		return
	}
	if err := p.broadcastRaw(context.Background(), fragment); err != nil {
		slog.Error("broadcast counter", slog.String("err", err.Error()))
	}
}

func (p *Poker) BroadcastPlayerList() {
	fragment, err := render(context.Background(), playerList(p.snapshotPlayers()))
	if err != nil {
		slog.Error("broadcast player list", slog.String("err", err.Error()))
		return
	}
	if err := p.broadcastRaw(context.Background(), fragment); err != nil {
		slog.Error("broadcast player list", slog.String("err", err.Error()))
	}
}

func (p *Poker) broadcastRaw(ctx context.Context, fragment string) error {
	recipients := p.snapshotRecipients()

	for _, r := range recipients {
		select {
		case <-ctx.Done():
			return fmt.Errorf("broadcast canceled: %w", ctx.Err())
		case r.ch <- fragment:
		default:
			slog.Warn("channel full, dropping update", slog.String("nick", r.nick))
		}
	}

	return nil
}

type PokerState struct {
	Counter int
	Players []string
}

func (p *Poker) State() PokerState {
	p.mu.RLock()
	defer p.mu.RUnlock()

	cp := make([]string, len(p.players))
	copy(cp, p.players)

	return PokerState{
		Counter: p.counter,
		Players: cp,
	}
}

func render(ctx context.Context, c templ.Component) (string, error) {
	var buf bytes.Buffer
	if err := c.Render(ctx, &buf); err != nil {
		return "", fmt.Errorf("rendering component: %w", err)
	}
	return buf.String(), nil
}

func (p *Poker) snapshotCounter() int {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.counter
}

func (p *Poker) snapshotPlayers() []string {
	p.mu.RLock()
	defer p.mu.RUnlock()
	players := make([]string, len(p.players))
	copy(players, p.players)
	return players
}

type recipient struct {
	nick string
	ch   chan string
}

func (p *Poker) snapshotRecipients() []recipient {
	p.mu.RLock()
	defer p.mu.RUnlock()
	recipients := make([]recipient, 0, len(p.connectedByNick))
	for nick := range p.connectedByNick {
		ch, ok := p.updatesByNick[nick]
		if ok {
			recipients = append(recipients, recipient{nick: nick, ch: ch})
		}
	}
	return recipients
}

func (p *Poker) HasPlayer(nick string) bool {
	p.mu.RLock()
	defer p.mu.RUnlock()
	_, ok := p.updatesByNick[nick]
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
