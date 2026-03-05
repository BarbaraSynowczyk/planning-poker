package main

import (
	"ds_go/views"
	"fmt"
	"log"
	"net/http"
	"sync"
)

var (
	players  []string
	counter  int
	channels []chan string
	mu       sync.Mutex
)

func main() {

	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/join", handleJoin)
	http.HandleFunc("/game", handleGame)

	http.HandleFunc("/game/plus", handlePlus)
	http.HandleFunc("/game/minus", handleMinus)

	http.HandleFunc("/game/updates", handleUpdates)

	log.Println("Server started :8080")
	http.ListenAndServe(":8080", nil)
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	views.IndexPage().Render(r.Context(), w)
}

func handleJoin(w http.ResponseWriter, r *http.Request) {

	r.ParseForm()
	userName := r.FormValue("userName")

	mu.Lock()
	players = append(players, userName)
	html := renderGameState()
	mu.Unlock()

	broadcast(html)

	http.Redirect(w, r, "/game?userName="+userName, http.StatusSeeOther)
}

func handleGame(w http.ResponseWriter, r *http.Request) {

	userName := r.URL.Query().Get("userName")

	if userName == "" {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	views.GamePage(userName, players, counter).Render(r.Context(), w)
}

func renderGameState() string {

	html := `<div id="game-state">`

	html += `<ul>`
	for _, p := range players {
		html += "<li>" + p + "</li>"
	}
	html += `</ul>`

	html += `<button onclick="plus()">+1</button>`
	html += `<button onclick="minus()">-1</button>`

	html += fmt.Sprintf(`<div id="counter">Counter: %d</div>`, counter)

	html += `</div>`

	return html
}

func handlePlus(w http.ResponseWriter, r *http.Request) {

	mu.Lock()
	counter++
	html := renderGameState()
	mu.Unlock()

	broadcast(html)

	fmt.Fprint(w, html)
}

func handleMinus(w http.ResponseWriter, r *http.Request) {

	mu.Lock()
	counter--
	html := renderGameState()
	mu.Unlock()

	broadcast(html)

	fmt.Fprint(w, html)
}

func handleUpdates(w http.ResponseWriter, r *http.Request) {

	ch := make(chan string)

	mu.Lock()
	channels = append(channels, ch)
	mu.Unlock()

	log.Println("Client connected")

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, _ := w.(http.Flusher)

	ctx := r.Context()

	for {

		select {

		case <-ctx.Done():

			mu.Lock()
			for i, c := range channels {
				if c == ch {
					channels = append(channels[:i], channels[i+1:]...)
					break
				}
			}
			mu.Unlock()

			log.Println("Client disconnected")
			return

		case msg := <-ch:

			fmt.Fprintf(w, "data: %s\n\n", msg)
			flusher.Flush()
		}
	}
}

func broadcast(html string) {

	mu.Lock()
	defer mu.Unlock()

	for _, ch := range channels {
		ch <- html
	}
}
