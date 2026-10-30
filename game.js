'use strict';
// Settlers Online - pure game rules (no I/O). JSON-serializable state.

const RES = ['lumber', 'brick', 'wool', 'grain', 'ore'];
const COSTS = {
  road: { lumber: 1, brick: 1 },
  settlement: { lumber: 1, brick: 1, wool: 1, grain: 1 },
  city: { grain: 2, ore: 3 },
  dev: { wool: 1, grain: 1, ore: 1 },
};
const TILE_RES = { forest: 'lumber', hills: 'brick', pasture: 'wool', fields: 'grain', mountains: 'ore', desert: null };
const LIMITS = { road: 15, settlement: 5, city: 4 };
const COLORS = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6'];
const DEV_TYPES = ['knight', 'roadbuilding', 'yearofplenty', 'monopoly', 'vp'];
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const WIN_VP = 10;

class GameError extends Error {}
const err = (m) => new GameError(m);

function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const emptyHand = () => ({ lumber: 0, brick: 0, wool: 0, grain: 0, ore: 0 });
const handTotal = (h) => RES.reduce((s, r) => s + (h[r] || 0), 0);

// ---------------------------------------------------------------- board
function generateBoard(rng = Math.random) {
  const coords = [];
  for (let r = -2; r <= 2; r++) for (let q = -2; q <= 2; q++) if (Math.abs(q + r) <= 2) coords.push({ q, r });
  const types = shuffle([
    ...Array(4).fill('forest'), ...Array(4).fill('fields'), ...Array(4).fill('pasture'),
    ...Array(3).fill('hills'), ...Array(3).fill('mountains'), 'desert',
  ], rng);
  const tiles = coords.map((c, i) => ({
    id: i, q: c.q, r: c.r, type: types[i], number: null,
    x: Math.sqrt(3) * (c.q + c.r / 2), y: 1.5 * c.r, vertices: [],
  }));
  const byCoord = new Map(tiles.map((t) => [t.q + ',' + t.r, t]));
  const nbrTiles = (t) => DIRS.map(([dq, dr]) => byCoord.get((t.q + dq) + ',' + (t.r + dr))).filter(Boolean);
  const nums = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  const land = tiles.filter((t) => t.type !== 'desert');
  const hot = (t) => t.number === 6 || t.number === 8;
  for (let attempt = 0; attempt < 5000; attempt++) {
    const sh = shuffle(nums, rng);
    land.forEach((t, i) => (t.number = sh[i]));
    if (land.every((t) => !hot(t) || nbrTiles(t).every((n) => !hot(n)))) break;
  }
  const key = (x, y) => Math.round(x * 1000) / 1000 + ',' + Math.round(y * 1000) / 1000;
  const vmap = new Map(), vertices = [], edges = [], emap = new Map();
  for (const t of tiles) {
    const ids = [];
    for (let i = 0; i < 6; i++) {
      const ang = ((60 * i - 90) * Math.PI) / 180;
      const x = t.x + Math.cos(ang), y = t.y + Math.sin(ang);
      const k = key(x, y);
      let v = vmap.get(k);
      if (!v) { v = { id: vertices.length, x, y, tiles: [], edges: [], neighbors: [] }; vmap.set(k, v); vertices.push(v); }
      v.tiles.push(t.id);
      ids.push(v.id);
    }
    t.vertices = ids;
    for (let i = 0; i < 6; i++) {
      const a = ids[i], b = ids[(i + 1) % 6];
      const ek = Math.min(a, b) + '-' + Math.max(a, b);
      let e = emap.get(ek);
      if (!e) {
        e = { id: edges.length, a: Math.min(a, b), b: Math.max(a, b), tiles: [] };
        emap.set(ek, e); edges.push(e);
        vertices[a].edges.push(e.id); vertices[b].edges.push(e.id);
        vertices[a].neighbors.push(b); vertices[b].neighbors.push(a);
      }
      e.tiles.push(t.id);
    }
  }
  // ports: walk the coastline
  const coastal = edges.filter((e) => e.tiles.length === 1);
  const coastAt = new Map();
  for (const e of coastal) for (const v of [e.a, e.b]) { if (!coastAt.has(v)) coastAt.set(v, []); coastAt.get(v).push(e); }
  const ordered = [];
  let cur = coastal[0], from = cur.a;
  do {
    ordered.push(cur);
    const to = cur.a === from ? cur.b : cur.a;
    const next = coastAt.get(to).find((e) => e !== cur);
    from = to; cur = next;
  } while (cur !== coastal[0]);
  const idx = [0, 3, 6, 10, 13, 16, 20, 23, 26];
  const ptypes = shuffle(['any', 'any', 'any', 'any', ...RES], rng);
  const ports = idx.map((i, k) => ({ id: k, type: ptypes[k], edge: ordered[i].id, vertices: [ordered[i].a, ordered[i].b] }));
  const desert = tiles.find((t) => t.type === 'desert');
  return { tiles, vertices, edges, ports, robber: desert.id };
}

// ---------------------------------------------------------------- game
class Game {
  constructor(opts = {}) {
    this.rng = opts.rng || Math.random;
    this.minPlayers = opts.minPlayers || 2;
    this.maxPlayers = 4;
    this.phase = 'lobby'; // lobby | setup | playing | ended
    this.host = null;
    this.players = [];
    this.board = null;
    this.buildings = {}; // vertexId -> {owner, type}
    this.roads = {}; // edgeId -> owner
    this.bank = { lumber: 19, brick: 19, wool: 19, grain: 19, ore: 19 };
    this.deck = [];
    this.robber = null;
    this.current = 0;
    this.setup = null; // {order, idx, step, last}
    this.turn = null; // {phase: roll|discard|robber|steal|main, dice, devPlayed, freeRoads, discard:{}, after, number}
    this.trade = null;
    this.longestHolder = null;
    this.armyHolder = null;
    this.winner = null;
    this.log = [];
    this.turnCount = 0;
    this.version = 0;
  }

  toJSON() { const o = { ...this }; delete o.rng; return o; }
  static fromJSON(o, opts = {}) { const g = new Game(opts); Object.assign(g, o); g.rng = opts.rng || Math.random; return g; }

  addLog(msg) { this.log.push({ n: this.log.length, msg }); if (this.log.length > 300) this.log.shift(); }
  pidx(name) { return this.players.findIndex((p) => p.name.toLowerCase() === String(name).toLowerCase()); }

  // ---------------- lobby
  addPlayer(name, token) {
    if (this.phase !== 'lobby') throw err('Game already started');
    if (this.players.length >= this.maxPlayers) throw err('Room is full');
    if (this.pidx(name) >= 0) throw err('Name already taken');
    this.players.push({
      name, token, color: null, connected: true, resources: emptyHand(), dev: [], boughtThisTurn: [],
      knights: 0, devPlayed: [],
    });
    if (!this.host) this.host = name;
    this.assignColors();
    this.addLog(`${name} joined`);
    return this.players.length - 1;
  }
  removePlayer(name) {
    if (this.phase !== 'lobby') return;
    const i = this.pidx(name); if (i < 0) return;
    this.players.splice(i, 1);
    if (this.host === name) this.host = this.players[0] ? this.players[0].name : null;
    this.assignColors();
  }
  assignColors() { this.players.forEach((p, i) => (p.color = COLORS[i])); }

  // ---------------- actions
  act(pi, a) {
    try {
      if (!a || typeof a.type !== 'string') throw err('Bad action');
      const fn = this['do_' + a.type];
      if (typeof fn !== 'function') throw err('Unknown action');
      if (pi < 0 || pi >= this.players.length) throw err('Not in game');
      fn.call(this, pi, a);
      this.afterAction();
      this.version++;
      return { ok: true };
    } catch (e) {
      if (e instanceof GameError) return { ok: false, error: e.message };
      throw e;
    }
  }

  afterAction() {
    if (this.phase === 'setup' || this.phase === 'playing') {
      this.updateLongest();
      this.updateArmy();
      if (this.phase === 'playing' && this.victoryPoints(this.current, true) >= WIN_VP) {
        this.phase = 'ended';
        this.winner = this.current;
        this.trade = null;
        this.addLog(`🏆 ${this.players[this.current].name} wins with ${this.victoryPoints(this.current, true)} points!`);
      }
    }
  }

  do_start(pi) {
    if (this.phase !== 'lobby') throw err('Already started');
    if (this.players[pi].name !== this.host) throw err('Only the host can start');
    if (this.players.length < this.minPlayers) throw err(`Need at least ${this.minPlayers} players`);
    this.players = shuffle(this.players, this.rng);
    this.assignColors();
    this.board = generateBoard(this.rng);
    this.robber = this.board.robber;
    this.deck = shuffle([
      ...Array(14).fill('knight'), ...Array(5).fill('vp'), ...Array(2).fill('roadbuilding'),
      ...Array(2).fill('yearofplenty'), ...Array(2).fill('monopoly'),
    ], this.rng);
    const n = this.players.length;
    const order = [...Array(n).keys()];
    this.setup = { order: [...order, ...order.slice().reverse()], idx: 0, step: 'settlement', last: null };
    this.phase = 'setup';
    this.current = this.setup.order[0];
    this.addLog(`Game started. Turn order: ${this.players.map((p) => p.name).join(', ')}`);
  }

  do_rematch(pi) {
    if (this.phase !== 'ended') throw err('Game not finished');
    if (this.players[pi].name !== this.host) throw err('Only the host can start a rematch');
    const keep = this.players.map((p) => ({ name: p.name, token: p.token, connected: p.connected }));
    const host = this.host;
    const fresh = new Game({ rng: this.rng, minPlayers: this.minPlayers });
    Object.assign(this, fresh);
    this.rng = fresh.rng;
    keep.forEach((k) => { this.addPlayer(k.name, k.token); this.players[this.players.length - 1].connected = k.connected; });
    this.host = host;
    delete this.roadLengths; delete this.lastSteal;
    this.addLog('Back to the lobby for a rematch');
  }

  // --- helpers
  count(pi, type) { let c = 0; for (const b of Object.values(this.buildings)) if (b.owner === pi && b.type === type) c++; return c; }
  roadCount(pi) { let c = 0; for (const o of Object.values(this.roads)) if (o === pi) c++; return c; }
  has(pi, cost) { const h = this.players[pi].resources; return Object.keys(cost).every((r) => h[r] >= cost[r]); }
  pay(pi, cost) { const h = this.players[pi].resources; for (const r of Object.keys(cost)) { h[r] -= cost[r]; this.bank[r] += cost[r]; } }
  give(pi, res, n) { this.players[pi].resources[res] += n; this.bank[res] -= n; }
  resCount(pi) { return handTotal(this.players[pi].resources); }
  nm(pi) { return this.players[pi].name; }

  vertexLegalForSettlement(v) {
    if (v == null || !this.board.vertices[v]) return false;
    if (this.buildings[v]) return false;
    return this.board.vertices[v].neighbors.every((n) => !this.buildings[n]);
  }
  vertexHasOwnRoad(pi, v) { return this.board.vertices[v].edges.some((e) => this.roads[e] === pi); }
  edgeLegalForRoad(pi, e) {
    const edge = this.board.edges[e];
    if (!edge || this.roads[e] !== undefined) return false;
    return [edge.a, edge.b].some((v) => {
      const b = this.buildings[v];
      if (b) return b.owner === pi;
      return this.board.vertices[v].edges.some((o) => o !== e && this.roads[o] === pi);
    });
  }
  legalSettlements(pi) {
    return this.board.vertices.filter((v) => this.vertexLegalForSettlement(v.id) && this.vertexHasOwnRoad(pi, v.id)).map((v) => v.id);
  }
  legalSetupSettlements() { return this.board.vertices.filter((v) => this.vertexLegalForSettlement(v.id)).map((v) => v.id); }
  legalCities(pi) { return Object.entries(this.buildings).filter(([, b]) => b.owner === pi && b.type === 'settlement').map(([v]) => +v); }
  legalRoads(pi) { return this.board.edges.filter((e) => this.edgeLegalForRoad(pi, e.id)).map((e) => e.id); }
  legalSetupRoads() {
    const v = this.board.vertices[this.setup.last];
    return v.edges.filter((e) => this.roads[e] === undefined);
  }

  portsOf(pi) {
    const out = new Set();
    for (const p of this.board.ports) if (p.vertices.some((v) => this.buildings[v] && this.buildings[v].owner === pi)) out.add(p.type);
    return out;
  }
  tradeRatio(pi, res) {
    const ports = this.portsOf(pi);
    if (ports.has(res)) return 2;
    if (ports.has('any')) return 3;
    return 4;
  }

  requireTurn(pi) { if (this.phase !== 'playing') throw err('Game is not in progress'); if (pi !== this.current) throw err('Not your turn'); }
  requireMain(pi) {
    this.requireTurn(pi);
    if (this.turn.phase !== 'main') throw err(this.turn.phase === 'roll' ? 'Roll the dice first' : 'Resolve the robber first');
    if (this.turn.freeRoads > 0) throw err('Place your free roads first');
  }

  // --- building
  do_buildSettlement(pi, { vertex }) {
    if (this.phase === 'setup') {
      if (pi !== this.current) throw err('Not your turn');
      if (this.setup.step !== 'settlement') throw err('Place a road now');
      if (!this.vertexLegalForSettlement(vertex)) throw err('Cannot build there (distance rule)');
      this.buildings[vertex] = { owner: pi, type: 'settlement' };
      this.setup.last = vertex;
      this.setup.step = 'road';
      if (this.setup.idx >= this.players.length) {
        const got = [];
        for (const tid of this.board.vertices[vertex].tiles) {
          const res = TILE_RES[this.board.tiles[tid].type];
          if (res && this.bank[res] > 0) { this.give(pi, res, 1); got.push(res); }
        }
        this.addLog(`${this.nm(pi)} placed a second settlement${got.length ? ' and received ' + got.join(', ') : ''}`);
      } else this.addLog(`${this.nm(pi)} placed a settlement`);
      return;
    }
    this.requireMain(pi);
    if (this.count(pi, 'settlement') >= LIMITS.settlement) throw err('No settlements left');
    if (!this.vertexLegalForSettlement(vertex)) throw err('Cannot build there (distance rule)');
    if (!this.vertexHasOwnRoad(pi, vertex)) throw err('Must connect to your road');
    if (!this.has(pi, COSTS.settlement)) throw err('Not enough resources');
    this.pay(pi, COSTS.settlement);
    this.buildings[vertex] = { owner: pi, type: 'settlement' };
    this.addLog(`${this.nm(pi)} built a settlement`);
  }

  do_buildCity(pi, { vertex }) {
    this.requireMain(pi);
    const b = this.buildings[vertex];
    if (!b || b.owner !== pi || b.type !== 'settlement') throw err('Need one of your settlements');
    if (this.count(pi, 'city') >= LIMITS.city) throw err('No cities left');
    if (!this.has(pi, COSTS.city)) throw err('Not enough resources');
    this.pay(pi, COSTS.city);
    b.type = 'city';
    this.addLog(`${this.nm(pi)} upgraded to a city`);
  }

  do_buildRoad(pi, { edge }) {
    if (this.phase === 'setup') {
      if (pi !== this.current) throw err('Not your turn');
      if (this.setup.step !== 'road') throw err('Place a settlement first');
      if (!this.legalSetupRoads().includes(edge)) throw err('Road must touch your new settlement');
      this.roads[edge] = pi;
      this.addLog(`${this.nm(pi)} placed a road`);
      this.setup.idx++;
      this.setup.step = 'settlement';
      this.setup.last = null;
      if (this.setup.idx >= this.setup.order.length) {
        this.phase = 'playing';
        this.current = 0;
        this.turn = this.newTurn();
        this.addLog(`Setup complete. ${this.nm(0)} rolls first.`);
      } else this.current = this.setup.order[this.setup.idx];
      return;
    }
    this.requireTurn(pi);
    const free = this.turn.freeRoads > 0;
    if (!free) this.requireMain(pi);
    else if (this.turn.phase !== 'main' && this.turn.phase !== 'roll') throw err('Not now');
    if (this.roadCount(pi) >= LIMITS.road) throw err('No roads left');
    if (!this.edgeLegalForRoad(pi, edge)) throw err('Cannot build a road there');
    if (!free) {
      if (!this.has(pi, COSTS.road)) throw err('Not enough resources');
      this.pay(pi, COSTS.road);
    }
    this.roads[edge] = pi;
    this.addLog(`${this.nm(pi)} built a road${free ? ' (free)' : ''}`);
    if (free) {
      this.turn.freeRoads--;
      if (this.roadCount(pi) >= LIMITS.road || this.legalRoads(pi).length === 0) this.turn.freeRoads = 0;
    }
  }

  // --- dice
  newTurn() {
    return { phase: 'roll', dice: null, devPlayed: false, freeRoads: 0, discard: {}, after: 'main' };
  }
  do_roll(pi) {
    this.requireTurn(pi);
    if (this.turn.phase !== 'roll') throw err('Already rolled');
    if (this.turn.freeRoads > 0) throw err('Place your free roads first');
    const d1 = 1 + Math.floor(this.rng() * 6), d2 = 1 + Math.floor(this.rng() * 6);
    this.turn.dice = [d1, d2];
    const total = d1 + d2;
    this.addLog(`${this.nm(pi)} rolled ${d1} + ${d2} = ${total}`);
    if (total === 7) {
      this.turn.after = 'main';
      this.beginSeven();
    } else {
      this.distribute(total);
      this.turn.phase = 'main';
    }
  }
  beginSeven() {
    this.turn.discard = {};
    this.players.forEach((p, i) => {
      const n = this.resCount(i);
      if (n > 7) this.turn.discard[i] = Math.floor(n / 2);
    });
    this.turn.phase = Object.keys(this.turn.discard).length ? 'discard' : 'robber';
    if (this.turn.phase === 'discard') this.addLog('Players with more than 7 cards must discard half');
  }
  distribute(total) {
    const owed = this.players.map(() => emptyHand());
    for (const t of this.board.tiles) {
      if (t.number !== total || t.id === this.robber) continue;
      const res = TILE_RES[t.type];
      for (const v of t.vertices) {
        const b = this.buildings[v];
        if (b) owed[b.owner][res] += b.type === 'city' ? 2 : 1;
      }
    }
    const msgs = [];
    for (const res of RES) {
      const need = owed.reduce((s, o) => s + o[res], 0);
      if (!need) continue;
      const takers = owed.map((o, i) => (o[res] ? i : -1)).filter((i) => i >= 0);
      if (this.bank[res] >= need) takers.forEach((i) => { this.give(i, res, owed[i][res]); msgs.push(`${this.nm(i)} +${owed[i][res]} ${res}`); });
      else if (takers.length === 1) {
        const n = this.bank[res];
        if (n > 0) { this.give(takers[0], res, n); msgs.push(`${this.nm(takers[0])} +${n} ${res}`); }
        else msgs.push(`bank out of ${res}`);
      } else msgs.push(`bank can't cover ${res}; nobody gets it`);
    }
    if (msgs.length) this.addLog(msgs.join(', '));
    else this.addLog('No resources produced');
  }

  do_discard(pi, { cards }) {
    if (this.phase !== 'playing' || this.turn.phase !== 'discard') throw err('Nothing to discard');
    const need = this.turn.discard[pi];
    if (!need) throw err('You do not need to discard');
    cards = cards || {};
    let sum = 0;
    for (const r of RES) {
      const n = cards[r] || 0;
      if (!Number.isInteger(n) || n < 0) throw err('Bad card count');
      if (n > this.players[pi].resources[r]) throw err('You do not have those cards');
      sum += n;
    }
    if (sum !== need) throw err(`Discard exactly ${need} cards`);
    for (const r of RES) { const n = cards[r] || 0; this.players[pi].resources[r] -= n; this.bank[r] += n; }
    delete this.turn.discard[pi];
    this.addLog(`${this.nm(pi)} discarded ${need} cards`);
    if (!Object.keys(this.turn.discard).length) this.turn.phase = 'robber';
  }

  do_moveRobber(pi, { tile }) {
    this.requireTurn(pi);
    if (this.turn.phase !== 'robber') throw err('Cannot move the robber now');
    if (!this.board.tiles[tile]) throw err('No such tile');
    if (tile === this.robber) throw err('Robber must move to a different tile');
    this.robber = tile;
    this.addLog(`${this.nm(pi)} moved the robber`);
    const victims = new Set();
    for (const v of this.board.tiles[tile].vertices) {
      const b = this.buildings[v];
      if (b && b.owner !== pi && this.resCount(b.owner) > 0) victims.add(b.owner);
    }
    if (victims.size === 0) this.turn.phase = this.turn.after;
    else if (victims.size === 1) { this.stealFrom(pi, [...victims][0]); this.turn.phase = this.turn.after; }
    else this.turn.phase = 'steal';
  }
  stealTargets() {
    const out = new Set();
    for (const v of this.board.tiles[this.robber].vertices) {
      const b = this.buildings[v];
      if (b && b.owner !== this.current && this.resCount(b.owner) > 0) out.add(b.owner);
    }
    return [...out];
  }
  stealFrom(pi, victim) {
    const cards = [];
    for (const r of RES) for (let i = 0; i < this.players[victim].resources[r]; i++) cards.push(r);
    if (!cards.length) return;
    const r = cards[Math.floor(this.rng() * cards.length)];
    this.players[victim].resources[r]--;
    this.players[pi].resources[r]++;
    this.addLog(`${this.nm(pi)} stole a card from ${this.nm(victim)}`);
    this.lastSteal = { thief: pi, victim, res: r };
  }
  do_steal(pi, { victim }) {
    this.requireTurn(pi);
    if (this.turn.phase !== 'steal') throw err('Nothing to steal');
    if (!this.stealTargets().includes(victim)) throw err('Cannot steal from that player');
    this.stealFrom(pi, victim);
    this.turn.phase = this.turn.after;
  }

  // --- dev cards
  do_buyDev(pi) {
    this.requireMain(pi);
    if (!this.deck.length) throw err('Development deck is empty');
    if (!this.has(pi, COSTS.dev)) throw err('Not enough resources');
    this.pay(pi, COSTS.dev);
    const c = this.deck.pop();
    this.players[pi].dev.push(c);
    this.players[pi].boughtThisTurn.push(c);
    this.addLog(`${this.nm(pi)} bought a development card`);
  }
  canPlay(pi, type) {
    const p = this.players[pi];
    const have = p.dev.filter((c) => c === type).length - p.boughtThisTurn.filter((c) => c === type).length;
    return have > 0;
  }
  takeDev(pi, type) {
    this.requireTurn(pi);
    if (this.turn.phase !== 'main' && this.turn.phase !== 'roll') throw err('Cannot play a card now');
    if (this.turn.freeRoads > 0) throw err('Place your free roads first');
    if (this.turn.devPlayed) throw err('Only one development card per turn');
    if (!this.canPlay(pi, type)) throw err('You cannot play that card now');
    const p = this.players[pi];
    p.dev.splice(p.dev.indexOf(type), 1);
    p.devPlayed.push(type);
    this.turn.devPlayed = true;
  }
  do_playKnight(pi) {
    this.takeDev(pi, 'knight');
    this.players[pi].knights++;
    this.turn.after = this.turn.phase; // roll or main
    this.turn.phase = 'robber';
    this.addLog(`${this.nm(pi)} played a Knight`);
  }
  do_playRoadBuilding(pi) {
    this.takeDev(pi, 'roadbuilding');
    this.addLog(`${this.nm(pi)} played Road Building`);
    this.turn.freeRoads = Math.min(2, LIMITS.road - this.roadCount(pi));
    if (this.legalRoads(pi).length === 0) this.turn.freeRoads = 0;
  }
  do_playYearOfPlenty(pi, { a, b }) {
    if (!RES.includes(a) || !RES.includes(b)) throw err('Pick two resources');
    this.requireTurn(pi);
    if (this.turn.devPlayed) throw err('Only one development card per turn');
    if (!this.canPlay(pi, 'yearofplenty')) throw err('You cannot play that card now');
    const need = emptyHand(); need[a]++; need[b]++;
    if (!RES.every((r) => this.bank[r] >= need[r])) throw err('Bank does not have those resources');
    this.takeDev(pi, 'yearofplenty');
    this.give(pi, a, 1); this.give(pi, b, 1);
    this.addLog(`${this.nm(pi)} played Year of Plenty and took ${a} + ${b}`);
  }
  do_playMonopoly(pi, { resource }) {
    if (!RES.includes(resource)) throw err('Pick a resource');
    this.takeDev(pi, 'monopoly');
    let total = 0;
    this.players.forEach((p, i) => { if (i !== pi) { total += p.resources[resource]; p.resources[resource] = 0; } });
    this.players[pi].resources[resource] += total;
    this.addLog(`${this.nm(pi)} played Monopoly on ${resource} and took ${total}`);
  }

  // --- trading
  do_bankTrade(pi, { give, get, count }) {
    this.requireMain(pi);
    if (!RES.includes(give) || !RES.includes(get) || give === get) throw err('Pick two different resources');
    count = count == null ? 1 : count;
    if (!Number.isInteger(count) || count < 1 || count > 10) throw err('Bad amount');
    const ratio = this.tradeRatio(pi, give);
    if (this.players[pi].resources[give] < ratio * count) throw err(`You need ${ratio * count} ${give}`);
    if (this.bank[get] < count) throw err('Bank does not have enough');
    this.players[pi].resources[give] -= ratio * count; this.bank[give] += ratio * count;
    this.give(pi, get, count);
    this.addLog(`${this.nm(pi)} traded ${ratio * count} ${give} for ${count} ${get} with the bank`);
  }
  cleanHand(h) {
    const out = emptyHand();
    for (const r of RES) {
      const n = (h && h[r]) || 0;
      if (!Number.isInteger(n) || n < 0 || n > 19) throw err('Bad trade amounts');
      out[r] = n;
    }
    return out;
  }
  do_offerTrade(pi, { give, get, to }) {
    this.requireMain(pi);
    give = this.cleanHand(give); get = this.cleanHand(get);
    if (!handTotal(give) || !handTotal(get)) throw err('Offer must include cards on both sides');
    if (RES.some((r) => give[r] && get[r])) throw err('Cannot trade a resource for the same resource');
    if (!this.has(pi, give)) throw err('You do not have those cards');
    if (to != null && (!Number.isInteger(to) || to === pi || !this.players[to])) throw err('Bad trade partner');
    this.trade = { id: (this.trade ? this.trade.id : 0) + 1, from: pi, give, get, to: to == null ? null : to, rejected: [] };
    this.addLog(`${this.nm(pi)} offered a trade`);
  }
  do_respondTrade(pi, { accept }) {
    const t = this.trade;
    if (this.phase !== 'playing' || !t) throw err('No open trade');
    if (pi === t.from) throw err('That is your own offer');
    if (t.to != null && t.to !== pi) throw err('Offer is not for you');
    if (!accept) {
      if (!t.rejected.includes(pi)) t.rejected.push(pi);
      return;
    }
    if (!this.has(t.from, t.give)) { this.trade = null; throw err('Offerer no longer has those cards'); }
    if (!this.has(pi, t.get)) throw err('You do not have the requested cards');
    for (const r of RES) {
      this.players[t.from].resources[r] += t.get[r] - t.give[r];
      this.players[pi].resources[r] += t.give[r] - t.get[r];
    }
    this.addLog(`${this.nm(pi)} accepted ${this.nm(t.from)}'s trade`);
    this.trade = null;
  }
  do_cancelTrade(pi) {
    if (!this.trade || this.trade.from !== pi) throw err('No offer to cancel');
    this.trade = null;
  }

  do_endTurn(pi) {
    this.requireMain(pi);
    const p = this.players[pi];
    p.boughtThisTurn = [];
    this.trade = null;
    this.current = (this.current + 1) % this.players.length;
    this.turn = this.newTurn();
    this.turnCount++;
    this.addLog(`${this.nm(this.current)}'s turn`);
  }

  // ---------------- scoring
  roadLength(pi) {
    const adj = new Map();
    for (const [eid, owner] of Object.entries(this.roads)) {
      if (owner !== pi) continue;
      const e = this.board.edges[eid];
      for (const v of [e.a, e.b]) { if (!adj.has(v)) adj.set(v, []); adj.get(v).push(e); }
    }
    let best = 0;
    const blocked = (v) => this.buildings[v] && this.buildings[v].owner !== pi;
    const used = new Set();
    const dfs = (v, len) => {
      if (len > best) best = len;
      for (const e of adj.get(v) || []) {
        if (used.has(e.id)) continue;
        const o = e.a === v ? e.b : e.a;
        used.add(e.id);
        if (blocked(o)) { if (len + 1 > best) best = len + 1; } else dfs(o, len + 1);
        used.delete(e.id);
      }
    };
    for (const v of adj.keys()) dfs(v, 0);
    return best;
  }
  updateLongest() {
    const lens = this.players.map((_, i) => this.roadLength(i));
    this.roadLengths = lens;
    const max = Math.max(...lens);
    const prev = this.longestHolder;
    if (max < 5) this.longestHolder = null;
    else {
      const cands = lens.map((l, i) => (l === max ? i : -1)).filter((i) => i >= 0);
      if (prev != null && cands.includes(prev)) { /* keep */ }
      else if (cands.length === 1) this.longestHolder = cands[0];
      else this.longestHolder = null;
    }
    if (prev !== this.longestHolder) {
      if (this.longestHolder != null) this.addLog(`${this.nm(this.longestHolder)} has the Longest Road (${max})`);
      else if (prev != null) this.addLog('Longest Road is now unclaimed');
    }
  }
  updateArmy() {
    const prev = this.armyHolder;
    let holder = prev;
    const cur = holder != null ? this.players[holder].knights : 2;
    let best = cur, bi = holder;
    this.players.forEach((p, i) => { if (p.knights >= 3 && p.knights > best) { best = p.knights; bi = i; } });
    holder = bi;
    if (holder !== prev) { this.armyHolder = holder; this.addLog(`${this.nm(holder)} has the Largest Army (${best})`); }
  }
  publicVP(pi) {
    let vp = 0;
    for (const b of Object.values(this.buildings)) if (b.owner === pi) vp += b.type === 'city' ? 2 : 1;
    if (this.longestHolder === pi) vp += 2;
    if (this.armyHolder === pi) vp += 2;
    return vp;
  }
  victoryPoints(pi, includeHidden) {
    return this.publicVP(pi) + (includeHidden ? this.players[pi].dev.filter((c) => c === 'vp').length : 0);
  }

  // ---------------- views
  viewFor(pi) {
    const reveal = this.phase === 'ended';
    const me = pi >= 0 ? this.players[pi] : null;
    const view = {
      phase: this.phase, host: this.host, you: pi, version: this.version, minPlayers: this.minPlayers,
      current: this.current, winner: this.winner, bank: this.bank, deckSize: this.deck.length,
      players: this.players.map((p, i) => ({
        name: p.name, color: p.color, connected: p.connected, index: i,
        resCount: handTotal(p.resources), devCount: p.dev.length, knights: p.knights,
        vp: this.phase === 'lobby' ? 0 : this.victoryPoints(i, reveal || i === pi),
        publicVP: this.phase === 'lobby' ? 0 : this.publicVP(i),
        roadLength: this.board ? (this.roadLengths ? this.roadLengths[i] || 0 : 0) : 0,
        pieces: this.board ? {
          settlement: LIMITS.settlement - this.count(i, 'settlement'),
          city: LIMITS.city - this.count(i, 'city'),
          road: LIMITS.road - this.roadCount(i),
        } : null,
        hasLongest: this.longestHolder === i, hasArmy: this.armyHolder === i,
        ...(reveal ? { resources: p.resources, dev: p.dev } : {}),
      })),
      log: this.log.slice(-60),
    };
    if (this.board) {
      view.board = this.board;
      view.buildings = this.buildings;
      view.roads = this.roads;
      view.robber = this.robber;
      view.setup = this.setup ? { step: this.setup.step, last: this.setup.last, round: this.setup.idx >= this.players.length ? 2 : 1 } : null;
      view.turn = this.turn ? {
        phase: this.turn.phase, dice: this.turn.dice, devPlayed: this.turn.devPlayed, freeRoads: this.turn.freeRoads,
        discard: this.turn.discard,
      } : null;
      view.trade = this.trade;
      view.lastSteal = this.lastSteal && this.lastSteal.thief === pi ? this.lastSteal : null;
    }
    if (me) {
      view.me = {
        resources: me.resources,
        dev: me.dev,
        playable: Object.fromEntries(DEV_TYPES.map((t) => [t, this.canPlay(pi, t)])),
        ratios: this.board ? Object.fromEntries(RES.map((r) => [r, this.tradeRatio(pi, r)])) : null,
      };
      view.legal = this.legalFor(pi);
    }
    return view;
  }
  legalFor(pi) {
    const L = { settlements: [], cities: [], roads: [], robber: [], steal: [] };
    if (!this.board || pi !== this.current) return L;
    if (this.phase === 'setup') {
      if (this.setup.step === 'settlement') L.settlements = this.legalSetupSettlements();
      else L.roads = this.legalSetupRoads();
    } else if (this.phase === 'playing') {
      const t = this.turn;
      if (t.freeRoads > 0) L.roads = this.legalRoads(pi);
      else if (t.phase === 'main') {
        if (this.count(pi, 'settlement') < LIMITS.settlement) L.settlements = this.legalSettlements(pi);
        if (this.count(pi, 'city') < LIMITS.city) L.cities = this.legalCities(pi);
        if (this.roadCount(pi) < LIMITS.road) L.roads = this.legalRoads(pi);
      } else if (t.phase === 'robber') L.robber = this.board.tiles.filter((x) => x.id !== this.robber).map((x) => x.id);
      else if (t.phase === 'steal') L.steal = this.stealTargets();
    }
    return L;
  }
}

module.exports = { Game, generateBoard, RES, COSTS, TILE_RES, LIMITS, DEV_TYPES, WIN_VP, emptyHand, handTotal, shuffle };
