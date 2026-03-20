export class Game {
  constructor() {
    this.players = [];
    this.votes = {};
    this.clients = [];
  }

  debug(...args) {
    console.log(new Date().toISOString(), ...args);
  }

  addPlayer(name) {
    if (name && !this.players.includes(name)) {
      this.players.push(name);
      this.debug("PLAYER ADDED:", name);
      this.broadcast();
    }
  }

  vote(player, value) {
    this.votes[player] = value;
    this.broadcast();
  }

  plus() {
    this.counter++;
    this.debug("PLUS counter=", this.counter);
    this.broadcast();
  }

  minus() {
    this.counter--;
    this.debug("MINUS counter=", this.counter);
    this.broadcast();
  }

  addClient(res) {
    this.clients.push(res);
    this.debug("SSE CLIENT CONNECTED total=", this.clients.length);
  }

  removeClient(res) {
    this.clients = this.clients.filter((c) => c !== res);
    this.debug("SSE CLIENT DISCONNECTED total=", this.clients.length);
  }

  broadcast() {
    const html = this.renderGameState();

    const payload = html
      .split("\n")
      .map((line) => `data: ${line}`)
      .join("\n");

    const message = `event: patch
${payload}

`;

    for (const client of this.clients) {
      client.write(message);
    }
  }

  renderGameState() {
    return `<div id="game-state" data-merge="outerHTML" class="item d-flex flex-column justify-content-center align-items-center" style="width:90px;">

            ${this.players
              .map(
                (p) => `
            <div class="d-flex fw-semibold align-items-center justify-content-center poker-card-question text-white fs-2">
            ${this.votes[p] ?? "?"}
            </div>
            
            <p class="text-white text-center my-2 fs-5">${p}</p>
            `,
              )
              .join("")}
        
        </div>`;
  }
}
