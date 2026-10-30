'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');
const { Game } = require('./game');

const PORT = process.env.PORT != null && process.env.PORT !== '' ? +process.env.PORT : 3457;
const MIN_PLAYERS = +process.env.MIN_PLAYERS || 2;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'rooms.json');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 20000 });
app.use(express.static(path.join(__dirname, 'public')));
app.get('/healthz', (_req, res) => res.json({ ok: true, rooms: rooms.size }));

/** @type {Map<string,{game:Game,touched:number}>} */
const rooms = new Map();

function loadRooms() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    for (const [code, r] of Object.entries(raw)) {
      const g = Game.fromJSON(r.game, { minPlayers: MIN_PLAYERS });
      g.players.forEach((p) => (p.connected = false));
      rooms.set(code, { game: g, touched: r.touched });
    }
    console.log(`Loaded ${rooms.size} rooms`);
  } catch (e) { /* none */ }
}
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      const out = {};
      for (const [c, r] of rooms) out[c] = { game: r.game, touched: r.touched };
      fs.writeFileSync(DATA_FILE + '.tmp', JSON.stringify(out));
      fs.renameSync(DATA_FILE + '.tmp', DATA_FILE);
    } catch (e) { console.error('save failed', e.message); }
  }, 1000);
}
setInterval(() => {
  const cutoff = Date.now() - 24 * 3600 * 1000;
  for (const [c, r] of rooms) if (r.touched < cutoff) rooms.delete(c);
}, 3600 * 1000).unref();

function newCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (;;) {
    let c = '';
    for (let i = 0; i < 4; i++) c += letters[crypto.randomInt(letters.length)];
    if (!rooms.has(c)) return c;
  }
}
const cleanName = (n) => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 16);

function broadcast(code) {
  const room = rooms.get(code);
  if (!room) return;
  const g = room.game;
  const sockets = [...(io.sockets.adapter.rooms.get(code) || [])].map((id) => io.sockets.sockets.get(id)).filter(Boolean);
  const live = new Set(sockets.map((s) => (s.data.name || '').toLowerCase()));
  g.players.forEach((p) => (p.connected = live.has(p.name.toLowerCase())));
  for (const s of sockets) {
    const pi = g.pidx(s.data.name);
    s.emit('state', { code, ...g.viewFor(pi) });
  }
  room.touched = Date.now();
  scheduleSave();
}

io.on('connection', (socket) => {
  socket.data = {};
  const bind = (code, name) => { socket.join(code); socket.data.code = code; socket.data.name = name; };

  socket.on('create', (req, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    const name = cleanName(req && req.name);
    if (!name) return cb({ ok: false, error: 'Enter a name' });
    const code = newCode();
    const game = new Game({ minPlayers: MIN_PLAYERS });
    const token = crypto.randomBytes(12).toString('hex');
    try { game.addPlayer(name, token); } catch (e) { return cb({ ok: false, error: e.message }); }
    rooms.set(code, { game, touched: Date.now() });
    bind(code, name);
    cb({ ok: true, code, name, token });
    broadcast(code);
  });

  socket.on('join', (req, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    const code = String((req && req.code) || '').toUpperCase().trim();
    const name = cleanName(req && req.name);
    const room = rooms.get(code);
    if (!room) return cb({ ok: false, error: 'Room not found' });
    if (!name) return cb({ ok: false, error: 'Enter a name' });
    const g = room.game;
    const pi = g.pidx(name);
    if (pi >= 0) {
      const p = g.players[pi];
      // refresh the live connection state first
      const live = [...(io.sockets.adapter.rooms.get(code) || [])].some((id) => {
        const s = io.sockets.sockets.get(id); return s && s !== socket && (s.data.name || '').toLowerCase() === name.toLowerCase();
      });
      const tokenOk = req.token && req.token === p.token;
      if (!tokenOk && live) return cb({ ok: false, error: 'That name is taken by a connected player' });
      bind(code, p.name);
      cb({ ok: true, code, name: p.name, token: p.token });
      return broadcast(code);
    }
    const token = crypto.randomBytes(12).toString('hex');
    try { g.addPlayer(name, token); } catch (e) { return cb({ ok: false, error: e.message + (g.phase !== 'lobby' ? ' — join with the name you used before to reconnect' : '') }); }
    bind(code, name);
    cb({ ok: true, code, name, token });
    broadcast(code);
  });

  socket.on('act', (a, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    const room = rooms.get(socket.data.code);
    if (!room) return cb({ ok: false, error: 'Not in a room' });
    const g = room.game;
    const pi = g.pidx(socket.data.name);
    let res;
    if (a && a.type === 'leave') {
      g.removePlayer(socket.data.name);
      const code = socket.data.code;
      socket.leave(code); socket.data = {};
      if (!g.players.length) rooms.delete(code); else broadcast(code);
      return cb({ ok: true });
    }
    if (a && a.type === 'kick') {
      if (g.phase !== 'lobby' || pi < 0 || g.players[pi].name !== g.host) return cb({ ok: false, error: 'Only the host can kick in the lobby' });
      const target = g.players[a.index];
      if (!target || target.name === g.host) return cb({ ok: false, error: 'Cannot kick that player' });
      for (const id of io.sockets.adapter.rooms.get(socket.data.code) || []) {
        const s = io.sockets.sockets.get(id);
        if (s && s.data.name === target.name) { s.leave(socket.data.code); s.data = {}; s.emit('kicked'); }
      }
      g.removePlayer(target.name);
      broadcast(socket.data.code);
      return cb({ ok: true });
    }
    try { res = g.act(pi, a); } catch (e) { console.error(e); res = { ok: false, error: 'Server error' }; }
    cb(res);
    if (res.ok) broadcast(socket.data.code);
  });

  socket.on('disconnect', () => {
    const code = socket.data && socket.data.code;
    if (code && rooms.has(code)) setTimeout(() => broadcast(code), 50);
  });
});

loadRooms();
server.listen(PORT, '0.0.0.0', () => console.log(`Settlers Online listening on :${PORT} (min players ${MIN_PLAYERS})`));
module.exports = { app, server, io, rooms };
