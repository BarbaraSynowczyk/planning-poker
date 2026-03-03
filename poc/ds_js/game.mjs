class Poker {
  constructor() {
    this.counter = 0;
    this.players = [];
    this.listenersByNick = new Map();
    this.connectedNicks = new Set();
  }

  add(delta) {
    this.counter += delta;
    return this.counter;
  }

  addPlayer(nick) {
    if (this.listenersByNick.has(nick)) {
      return;
    }
    this.players.push(nick);
    this.listenersByNick.set(nick, new Set());
  }

  hasPlayer(nick) {
    return this.listenersByNick.has(nick);
  }

  connect(nick) {
    if (!this.listenersByNick.has(nick)) {
      return null;
    }
    this.connectedNicks.add(nick);
    return nick;
  }

  disconnect(nick) {
    this.connectedNicks.delete(nick);
  }

  state() {
    return {
      counter: this.counter,
      players: [...this.players],
    };
  }

  broadcastCounter() {
    this._broadcast(renderCounter(this.counter));
  }

  broadcastPlayerList() {
    this._broadcast(renderPlayerList(this.players));
  }

  _broadcast(fragment) {
    for (const nick of this.connectedNicks) {
      const listeners = this.listenersByNick.get(nick);
      if (!listeners || listeners.size === 0) {
        continue;
      }
      for (const listener of listeners) {
        listener(fragment);
      }
    }
  }

  addListener(nick, fn) {
    const listeners = this.listenersByNick.get(nick);
    if (!listeners) {
      return;
    }
    listeners.add(fn);
  }

  removeListener(nick, fn) {
    const listeners = this.listenersByNick.get(nick);
    if (!listeners) {
      return;
    }
    listeners.delete(fn);
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
