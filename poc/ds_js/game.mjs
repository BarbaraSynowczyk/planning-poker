class Poker {
  constructor() {
    this.counter = 0;
    this.players = [];
    this.channels = new Map();
    this.connected = new Map();
  }

  add(delta) {
    this.counter += delta;
    return this.counter;
  }

  addPlayer(nick) {
    if (this.channels.has(nick)) {
      return;
    }
    this.players.push(nick);
    this.channels.set(nick, []);
  }

  hasPlayer(nick) {
    return this.channels.has(nick);
  }

  connect(nick) {
    if (!this.channels.has(nick)) {
      return null;
    }
    this.connected.set(nick, true);
    return nick;
  }

  disconnect(nick) {
    this.connected.delete(nick);
  }

  state() {
    return {
      counter: this.counter,
      players: [...this.players],
    };
  }

  broadcastCounter() {
    const fragment = renderCounter(this.counter);
    this._broadcast(fragment);
  }

  broadcastPlayerList() {
    const fragment = renderPlayerList(this.players);
    this._broadcast(fragment);
  }

  _broadcast(fragment) {
    for (const [nick] of this.channels) {
      if (!this.connected.get(nick)) {
        continue;
      }
      const listeners = this.channels.get(nick);
      for (const listener of listeners) {
        console.log('Broadcasting to a listener for ' + nick)
        listener(fragment);
      }
    }
  }

  addListener(nick, fn) {
    const listeners = this.channels.get(nick);
    if (listeners) {
      listeners.push(fn);
    }
  }

  removeListener(nick, fn) {
    const listeners = this.channels.get(nick);
    if (listeners) {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) {
        listeners.splice(idx, 1);
      }
    }
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPlayerList(players) {
  const items = players.map((p) => `<li>${escapeHtml(p)}</li>`).join("");
  return `<ul id="player-list">${items}</ul>`;
}

function renderCounter(cnt) {
  return `<div id="counter">Current counter: <b>${cnt}</b></div>`;
}

export { Poker, renderPlayerList, renderCounter, escapeHtml };

