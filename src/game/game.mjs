export class Game {
  constructor() {
    this.players = [];
    this.votes = {};
    this.clients = [];
    this.avatars = {};
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

  addClient(res) {
    this.clients.push(res);
    this.debug("SSE CLIENT CONNECTED total=", this.clients.length);
  }

  removeClient(res) {
    this.clients = this.clients.filter((c) => c !== res);
    this.debug("SSE CLIENT DISCONNECTED total=", this.clients.length);
  }

  broadcast() {
    console.log("BROADCAST to clients:", this.clients.length);

    for (const client of this.clients) {
      client.patchElements(this.renderGameState());
    }
  }

  renderGameState() {
    return `<div id="game-state" data-merge="outerHTML" class="item d-flex flex-column justify-content-center align-items-center" style="width:90px;">${this.players.map((p) => `<div class="d-flex fw-semibold align-items-center justify-content-center poker-card-question text-white fs-2">${this.votes[p] ?? "?"}</div><p class="text-white text-center my-2 fs-5">${p}</p>`).join("")}</div>`;
  }
}
