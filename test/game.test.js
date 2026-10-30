'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { Game, generateBoard, RES, emptyHand } = require('../game');
const { playGame } = require('./fuzz');

function mk(n = 3) {
  const g = new Game();
  for (let i = 0; i < n; i++) g.addPlayer('P' + i, 't' + i);
  assert.ok(g.act(0, { type: 'start' }).ok);
  return g;
}
// jump to playing phase with empty board
function playing(n = 3) {
  const g = mk(n);
  g.buildings = {}; g.roads = {};
  g.phase = 'playing'; g.current = 0; g.turn = g.newTurn(); g.setup = null;
  return g;
}
const give = (g, pi, h) => { for (const r of Object.keys(h)) g.give(pi, r, h[r]); };
const dice = (g, a, b) => { const seq = [(a - 1) / 6 + 0.01, (b - 1) / 6 + 0.01]; let i = 0; g.rng = () => seq[i++ % 2]; };
// find a path of n connected edges starting from a vertex
function chain(g, start, len) {
  const seen = new Set([start]); const edges = [];
  const go = (v) => {
    if (edges.length === len) return v;
    for (const id of g.board.vertices[v].edges) {
      const e = g.board.edges[id]; const o = e.a === v ? e.b : e.a;
      if (seen.has(o)) continue;
      seen.add(o); edges.push(id);
      const r = go(o); if (r != null) return r;
      seen.delete(o); edges.pop();
    }
    return null;
  };
  const end = go(start);
  assert.notEqual(end, null);
  return { edges, end };
}

test('board: 19 tiles, correct resource & number distribution, 9 ports', () => {
  for (let k = 0; k < 50; k++) {
    const b = generateBoard();
    assert.equal(b.tiles.length, 19);
    assert.equal(b.vertices.length, 54);
    assert.equal(b.edges.length, 72);
    assert.equal(b.ports.length, 9);
    const types = {}; b.tiles.forEach((t) => (types[t.type] = (types[t.type] || 0) + 1));
    assert.deepEqual(types, { forest: 4, fields: 4, pasture: 4, hills: 3, mountains: 3, desert: 1 });
    const nums = b.tiles.filter((t) => t.number).map((t) => t.number).sort((a, b) => a - b);
    assert.deepEqual(nums, [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]);
    assert.equal(b.tiles[b.robber].type, 'desert');
    assert.equal(b.ports.filter((p) => p.type === 'any').length, 4);
    for (const r of RES) assert.equal(b.ports.filter((p) => p.type === r).length, 1);
    // no adjacent 6/8
    for (const e of b.edges) if (e.tiles.length === 2) {
      const [x, y] = e.tiles.map((i) => b.tiles[i].number);
      assert.ok(!([6, 8].includes(x) && [6, 8].includes(y)));
    }
    // ports on coast edges, port vertices distinct
    const used = new Set();
    for (const p of b.ports) { assert.equal(b.edges[p.edge].tiles.length, 1); p.vertices.forEach((v) => { assert.ok(!used.has(v)); used.add(v); }); }
  }
});

test('setup: snake order, road adjacency, second settlement pays out', () => {
  const g = mk(3);
  assert.deepEqual(g.setup.order.length, 6);
  assert.equal(g.setup.order[2], g.setup.order[3]);
  const first = g.current;
  assert.equal(g.act((first + 1) % 3, { type: 'buildSettlement', vertex: 0 }).ok, false);
  const v0 = g.legalSetupSettlements()[0];
  assert.ok(g.act(first, { type: 'buildSettlement', vertex: v0 }).ok);
  assert.equal(g.act(first, { type: 'buildSettlement', vertex: 1 }).ok, false); // must road now
  const far = g.board.edges.find((e) => e.a !== v0 && e.b !== v0).id;
  assert.equal(g.act(first, { type: 'buildRoad', edge: far }).ok, false);
  assert.ok(g.act(first, { type: 'buildRoad', edge: g.board.vertices[v0].edges[0] }).ok);
  assert.notEqual(g.current, first);
  // complete setup with bots
  while (g.phase === 'setup') {
    const c = g.current;
    if (g.setup.step === 'settlement') assert.ok(g.act(c, { type: 'buildSettlement', vertex: g.legalSetupSettlements()[0] }).ok);
    else assert.ok(g.act(c, { type: 'buildRoad', edge: g.legalSetupRoads()[0] }).ok);
  }
  assert.equal(g.phase, 'playing');
  assert.equal(g.current, 0);
  // each player has 2 settlements and 2 roads
  for (let i = 0; i < 3; i++) { assert.equal(g.count(i, 'settlement'), 2); assert.equal(g.roadCount(i), 2); }
  // starting resources = tiles adjacent to the second settlement
  const total = g.players.reduce((s, p) => s + RES.reduce((a, r) => a + p.resources[r], 0), 0);
  assert.ok(total > 0 && total <= 18);
});

test('distance rule and road connection requirement', () => {
  const g = playing();
  const v = g.board.vertices[10];
  g.buildings[10] = { owner: 0, type: 'settlement' };
  give(g, 0, { lumber: 5, brick: 5, wool: 5, grain: 5 });
  g.turn.phase = 'main';
  const nb = v.neighbors[0];
  g.roads[v.edges[0]] = 0;
  assert.equal(g.act(0, { type: 'buildSettlement', vertex: nb }).ok, false, 'adjacent vertex blocked');
  // two steps away along the road
  const ch = chain(g, 10, 2);
  g.roads = {}; ch.edges.forEach((e) => (g.roads[e] = 0));
  assert.ok(g.act(0, { type: 'buildSettlement', vertex: ch.end }).ok);
  // unconnected spot
  const far = g.board.vertices.find((x) => !g.buildings[x.id] && x.neighbors.every((n) => !g.buildings[n]) && !g.vertexHasOwnRoad(0, x.id));
  assert.equal(g.act(0, { type: 'buildSettlement', vertex: far.id }).ok, false);
});

test('cost checks for road, settlement, city, dev card', () => {
  const g = playing();
  g.turn.phase = 'main';
  g.buildings[10] = { owner: 0, type: 'settlement' };
  const e = g.board.vertices[10].edges[0];
  assert.equal(g.act(0, { type: 'buildRoad', edge: e }).ok, false);
  give(g, 0, { lumber: 1, brick: 1 });
  assert.ok(g.act(0, { type: 'buildRoad', edge: e }).ok);
  assert.equal(g.players[0].resources.lumber, 0);
  assert.equal(g.bank.lumber, 19);
  assert.equal(g.act(0, { type: 'buildCity', vertex: 10 }).ok, false);
  give(g, 0, { grain: 2, ore: 3 });
  assert.ok(g.act(0, { type: 'buildCity', vertex: 10 }).ok);
  assert.equal(g.buildings[10].type, 'city');
  assert.equal(g.publicVP(0), 2);
  assert.equal(g.act(0, { type: 'buyDev' }).ok, false);
  give(g, 0, { wool: 1, grain: 1, ore: 1 });
  assert.ok(g.act(0, { type: 'buyDev' }).ok);
  assert.equal(g.players[0].dev.length, 1);
  assert.equal(g.deck.length, 24);
});

test('must roll before building; only current player acts', () => {
  const g = playing();
  give(g, 0, { lumber: 1, brick: 1 });
  assert.equal(g.act(0, { type: 'buildRoad', edge: 0 }).ok, false);
  assert.equal(g.act(1, { type: 'roll' }).ok, false);
  dice(g, 2, 3);
  assert.ok(g.act(0, { type: 'roll' }).ok);
  assert.equal(g.act(0, { type: 'roll' }).ok, false);
});

test('dice distribution: settlements 1, cities 2, robber blocks', () => {
  const g = playing();
  const tile = g.board.tiles.find((t) => t.number === 8 || t.number === 6) || g.board.tiles.find((t) => t.number);
  const res = { forest: 'lumber', hills: 'brick', pasture: 'wool', fields: 'grain', mountains: 'ore' }[tile.type];
  g.buildings[tile.vertices[0]] = { owner: 0, type: 'settlement' };
  g.buildings[tile.vertices[2]] = { owner: 1, type: 'city' };
  // move robber elsewhere
  g.robber = g.board.tiles.find((t) => t.id !== tile.id).id;
  const total = tile.number;
  const a = Math.min(6, total - 1), b = total - a;
  dice(g, a, b);
  const before0 = g.players[0].resources[res], before1 = g.players[1].resources[res];
  assert.ok(g.act(0, { type: 'roll' }).ok);
  assert.equal(g.turn.dice[0] + g.turn.dice[1], total);
  assert.equal(g.players[0].resources[res] - before0, 1 + other(g, tile, 0, res));
  assert.equal(g.players[1].resources[res] - before1, 2 + other(g, tile, 1, res));
  // robber blocks
  const g2 = playing();
  g2.buildings[tile.vertices[0]] = { owner: 0, type: 'settlement' };
  g2.robber = tile.id;
  dice(g2, a, b);
  g2.act(0, { type: 'roll' });
  assert.equal(RES.reduce((s, r) => s + g2.players[0].resources[r], 0), 0);
});
// other tiles with the same number may also pay these vertices
function other(g, tile, pi, res) { return countOther(g, tile, pi, res); }
function countOther(g, tile, pi, res) {
  let n = 0;
  const map = { forest: 'lumber', hills: 'brick', pasture: 'wool', fields: 'grain', mountains: 'ore' };
  for (const t of g.board.tiles) {
    if (t.id === tile.id || t.number !== tile.number || t.id === g.robber || map[t.type] !== res) continue;
    for (const v of t.vertices) { const b = g.buildings[v]; if (b && b.owner === pi) n += b.type === 'city' ? 2 : 1; }
  }
  return n;
}

test('bank shortage: nobody gets resource if multiple players and not enough', () => {
  const g = playing();
  const tile = g.board.tiles.find((t) => t.number && t.type === 'forest');
  g.robber = g.board.tiles.find((t) => t.type === 'desert').id;
  g.buildings[tile.vertices[0]] = { owner: 0, type: 'settlement' };
  g.buildings[tile.vertices[2]] = { owner: 1, type: 'settlement' };
  g.bank.lumber = 1;
  g.distribute(tile.number);
  const others = g.board.tiles.filter((t) => t.id !== tile.id && t.number === tile.number && t.type === 'forest').length;
  if (!others) assert.equal(g.players[0].resources.lumber + g.players[1].resources.lumber, 0);
  // single taker gets what is left
  g.buildings = {}; g.buildings[tile.vertices[0]] = { owner: 0, type: 'city' };
  g.bank.lumber = 1;
  g.distribute(tile.number);
  assert.ok(g.players[0].resources.lumber >= 1);
});

test('rolling 7: discard half if >7, then move robber, then steal', () => {
  const g = playing(3);
  give(g, 1, { lumber: 4, brick: 4 }); // 8 -> discard 4
  give(g, 2, { lumber: 7 }); // 7 -> no discard
  const tile = g.board.tiles.find((t) => t.id !== g.robber);
  g.buildings[tile.vertices[0]] = { owner: 1, type: 'settlement' };
  g.buildings[tile.vertices[3]] = { owner: 2, type: 'settlement' };
  dice(g, 3, 4);
  assert.ok(g.act(0, { type: 'roll' }).ok);
  assert.equal(g.turn.phase, 'discard');
  assert.deepEqual(g.turn.discard, { 1: 4 });
  assert.equal(g.act(1, { type: 'discard', cards: { lumber: 1 } }).ok, false);
  assert.equal(g.act(1, { type: 'discard', cards: { lumber: 5 } }).ok, false);
  assert.equal(g.act(0, { type: 'moveRobber', tile: tile.id }).ok, false, 'must wait for discard');
  assert.ok(g.act(1, { type: 'discard', cards: { lumber: 2, brick: 2 } }).ok);
  assert.equal(g.turn.phase, 'robber');
  assert.equal(g.act(0, { type: 'moveRobber', tile: g.robber }).ok, false);
  assert.ok(g.act(0, { type: 'moveRobber', tile: tile.id }).ok);
  assert.equal(g.turn.phase, 'steal');
  assert.equal(g.robber, tile.id);
  assert.equal(g.act(0, { type: 'steal', victim: 0 }).ok, false);
  const before = RES.reduce((s, r) => s + g.players[0].resources[r], 0);
  assert.ok(g.act(0, { type: 'steal', victim: 2 }).ok);
  assert.equal(RES.reduce((s, r) => s + g.players[0].resources[r], 0), before + 1);
  assert.equal(g.turn.phase, 'main');
});

test('bank trades 4:1, 3:1 and 2:1 ports', () => {
  const g = playing();
  g.turn.phase = 'main';
  give(g, 0, { lumber: 8 });
  assert.equal(g.act(0, { type: 'bankTrade', give: 'lumber', get: 'ore' }).ok, true);
  assert.equal(g.players[0].resources.lumber, 4);
  assert.equal(g.players[0].resources.ore, 1);
  assert.equal(g.act(0, { type: 'bankTrade', give: 'brick', get: 'ore' }).ok, false);
  const any = g.board.ports.find((p) => p.type === 'any');
  g.buildings[any.vertices[0]] = { owner: 0, type: 'settlement' };
  assert.equal(g.tradeRatio(0, 'lumber'), 3);
  assert.ok(g.act(0, { type: 'bankTrade', give: 'lumber', get: 'wool' }).ok);
  assert.equal(g.players[0].resources.lumber, 1);
  const spec = g.board.ports.find((p) => p.type === 'ore');
  g.buildings[spec.vertices[1]] = { owner: 0, type: 'settlement' };
  assert.equal(g.tradeRatio(0, 'ore'), 2);
  assert.equal(g.tradeRatio(0, 'lumber'), 3);
  give(g, 0, { ore: 1 }); // now 2 ore
  assert.ok(g.act(0, { type: 'bankTrade', give: 'ore', get: 'grain' }).ok);
  assert.equal(g.players[0].resources.ore, 0);
  assert.equal(g.players[0].resources.grain, 1);
});

test('player trade: offer, reject, accept moves cards, validation', () => {
  const g = playing();
  g.turn.phase = 'main';
  give(g, 0, { lumber: 2 }); give(g, 1, { ore: 1 });
  assert.equal(g.act(0, { type: 'offerTrade', give: { lumber: 1 }, get: { lumber: 1 } }).ok, false);
  assert.equal(g.act(0, { type: 'offerTrade', give: { brick: 1 }, get: { ore: 1 } }).ok, false);
  assert.ok(g.act(0, { type: 'offerTrade', give: { lumber: 2 }, get: { ore: 1 } }).ok);
  assert.equal(g.act(0, { type: 'respondTrade', accept: true }).ok, false);
  assert.equal(g.act(2, { type: 'respondTrade', accept: true }).ok, false, 'no ore');
  assert.ok(g.act(2, { type: 'respondTrade', accept: false }).ok);
  assert.ok(g.act(1, { type: 'respondTrade', accept: true }).ok);
  assert.equal(g.players[0].resources.ore, 1); assert.equal(g.players[0].resources.lumber, 0);
  assert.equal(g.players[1].resources.lumber, 2); assert.equal(g.players[1].resources.ore, 0);
  assert.equal(g.trade, null);
  // targeted offer
  give(g, 0, { lumber: 1 }); give(g, 2, { ore: 1 });
  assert.ok(g.act(0, { type: 'offerTrade', give: { lumber: 1 }, get: { ore: 1 }, to: 2 }).ok);
  assert.equal(g.act(1, { type: 'respondTrade', accept: true }).ok, false);
  g.act(0, { type: 'endTurn' });
  assert.equal(g.trade, null);
});

test('development cards: knight, largest army, road building, YoP, monopoly, one per turn, not same turn', () => {
  const g = playing();
  g.turn.phase = 'main';
  g.players[0].dev = ['knight', 'knight', 'knight', 'knight', 'monopoly', 'yearofplenty', 'roadbuilding', 'vp'];
  g.players[0].boughtThisTurn = ['monopoly'];
  assert.equal(g.act(0, { type: 'playMonopoly', resource: 'ore' }).ok, false, 'bought this turn');
  assert.ok(g.act(0, { type: 'playKnight' }).ok);
  assert.equal(g.turn.phase, 'robber');
  g.act(0, { type: 'moveRobber', tile: g.board.tiles.find((t) => t.id !== g.robber).id });
  assert.equal(g.turn.phase, 'main');
  assert.equal(g.act(0, { type: 'playKnight' }).ok, false, 'one dev card per turn');
  // next turn(s)
  const nextTurn = () => { g.act(0, { type: 'endTurn' }); g.current = 0; g.turn = g.newTurn(); g.turn.phase = 'main'; };
  nextTurn(); assert.ok(g.act(0, { type: 'playKnight' }).ok); g.act(0, { type: 'moveRobber', tile: g.board.tiles.find((t) => t.id !== g.robber).id });
  assert.equal(g.armyHolder, null);
  nextTurn(); assert.ok(g.act(0, { type: 'playKnight' }).ok); g.act(0, { type: 'moveRobber', tile: g.board.tiles.find((t) => t.id !== g.robber).id });
  assert.equal(g.armyHolder, 0);
  assert.equal(g.publicVP(0), 2);
  // rival with more knights takes it
  g.players[1].knights = 4; g.updateArmy();
  assert.equal(g.armyHolder, 1);
  g.players[2].knights = 4; g.updateArmy();
  assert.equal(g.armyHolder, 1, 'ties do not steal');
  // year of plenty
  nextTurn();
  assert.equal(g.act(0, { type: 'playYearOfPlenty', a: 'ore', b: 'ore' }).ok, true);
  assert.equal(g.players[0].resources.ore, 2);
  // monopoly
  nextTurn();
  give(g, 1, { grain: 3 }); give(g, 2, { grain: 2 });
  g.players[0].boughtThisTurn = [];
  assert.ok(g.act(0, { type: 'playMonopoly', resource: 'grain' }).ok);
  assert.equal(g.players[0].resources.grain, 5);
  assert.equal(g.players[1].resources.grain, 0);
  // road building
  nextTurn();
  g.buildings[10] = { owner: 0, type: 'settlement' };
  assert.ok(g.act(0, { type: 'playRoadBuilding' }).ok);
  assert.equal(g.turn.freeRoads, 2);
  assert.equal(g.act(0, { type: 'endTurn' }).ok, false);
  const e1 = g.board.vertices[10].edges[0];
  assert.ok(g.act(0, { type: 'buildRoad', edge: e1 }).ok);
  assert.equal(g.turn.freeRoads, 1);
  assert.ok(g.act(0, { type: 'buildRoad', edge: g.legalRoads(0)[0] }).ok);
  assert.equal(g.turn.freeRoads, 0);
  assert.equal(g.players[0].resources.lumber, 0);
});

test('VP cards count toward victory and win ends game at 10 VP on own turn', () => {
  const g = playing();
  g.turn.phase = 'main';
  g.players[0].dev = ['vp', 'vp'];
  [0, 5, 10, 15, 20, 25, 30].forEach((v) => g.board.vertices[v] && (g.buildings[v] = { owner: 0, type: 'settlement' }));
  // 7 settlements -> make 4 cities: 4*2 + 3 = 11 > use fewer
  const vs = Object.keys(g.buildings).map(Number);
  g.buildings = {};
  // pick non-adjacent vertices greedily
  const picked = [];
  for (const v of g.board.vertices) if (picked.length < 8 && picked.every((p) => p !== v.id && !v.neighbors.includes(p))) picked.push(v.id);
  picked.slice(0, 4).forEach((v) => (g.buildings[v] = { owner: 0, type: 'city' })); // 8 VP
  assert.equal(g.victoryPoints(0, true), 10);
  assert.equal(g.publicVP(0), 8);
  give(g, 0, { lumber: 1, brick: 1 });
  assert.ok(g.act(0, { type: 'buildRoad', edge: g.legalRoads(0)[0] }).ok);
  assert.equal(g.phase, 'ended');
  assert.equal(g.winner, 0);
  assert.equal(g.act(0, { type: 'endTurn' }).ok, false);
  const v = g.viewFor(1);
  assert.equal(v.players[0].vp, 10);
});

test('longest road: 5+ needed, takeover, and broken by opponent settlement', () => {
  const g = playing();
  // build a path of 5 roads for player 0
  const start = 0;
  const ch = chain(g, start, 6);
  ch.edges.slice(0, 4).forEach((e) => (g.roads[e] = 0));
  g.updateLongest();
  assert.equal(g.longestHolder, null);
  assert.equal(g.roadLength(0), 4);
  g.roads[ch.edges[4]] = 0;
  g.updateLongest();
  assert.equal(g.roadLength(0), 5);
  assert.equal(g.longestHolder, 0);
  assert.equal(g.publicVP(0), 2);
  // opponent breaks the road in the middle
  const midV = g.board.edges[ch.edges[2]].a;
  const shared = [g.board.edges[ch.edges[1]].a, g.board.edges[ch.edges[1]].b].filter((v) => [g.board.edges[ch.edges[2]].a, g.board.edges[ch.edges[2]].b].includes(v))[0];
  g.buildings[shared] = { owner: 1, type: 'settlement' };
  g.updateLongest();
  assert.ok(g.roadLength(0) < 5);
  assert.equal(g.longestHolder, null);
  void midV;
  // takeover requires strictly greater
  g.buildings = {};
  g.roads = {};
  ch.edges.slice(0, 5).forEach((e) => (g.roads[e] = 0));
  g.updateLongest();
  assert.equal(g.longestHolder, 0);
  const ch2 = chain(g, 40, 6);
  ch2.edges.slice(0, 5).forEach((e) => { if (g.roads[e] === undefined) g.roads[e] = 1; });
  g.updateLongest();
  if (g.roadLength(1) === 5) assert.equal(g.longestHolder, 0, 'tie keeps holder');
  g.roads[ch2.edges[5]] = 1;
  g.updateLongest();
  if (g.roadLength(1) > 5 && g.roadLength(1) > g.roadLength(0)) assert.equal(g.longestHolder, 1);
});

test('longest road handles cycles and branches', () => {
  const g = playing();
  // a full hexagon ring of 6 roads around tile 9 -> longest = 6
  const t = g.board.tiles[9];
  for (let i = 0; i < 6; i++) {
    const a = t.vertices[i], b = t.vertices[(i + 1) % 6];
    const e = g.board.edges.find((e) => (e.a === Math.min(a, b) && e.b === Math.max(a, b)));
    g.roads[e.id] = 0;
  }
  assert.equal(g.roadLength(0), 6);
});

test('turn order & endTurn cycles; cannot end before rolling', () => {
  const g = playing(4);
  assert.equal(g.act(0, { type: 'endTurn' }).ok, false);
  g.turn.phase = 'main';
  assert.ok(g.act(0, { type: 'endTurn' }).ok);
  assert.equal(g.current, 1);
  g.turn.phase = 'main'; g.act(1, { type: 'endTurn' }); g.turn.phase = 'main'; g.act(2, { type: 'endTurn' }); g.turn.phase = 'main'; g.act(3, { type: 'endTurn' });
  assert.equal(g.current, 0);
});

test('views hide other players hands and dev cards', () => {
  const g = playing();
  give(g, 1, { ore: 3 });
  g.players[1].dev = ['vp', 'knight'];
  const v = g.viewFor(0);
  assert.equal(v.players[1].resCount, 3);
  assert.equal(v.players[1].resources, undefined);
  assert.equal(v.players[1].dev, undefined);
  assert.equal(v.players[1].vp, 0);
  assert.equal(JSON.stringify(v).includes('"t1"'), false, 'no tokens leaked');
  assert.equal(v.me.resources.ore, 0);
});

test('state is JSON round-trippable', () => {
  const g = mk(4);
  const g2 = Game.fromJSON(JSON.parse(JSON.stringify(g)));
  assert.equal(g2.phase, 'setup');
  assert.equal(g2.board.tiles.length, 19);
});

test('lobby rules: duplicate name, min players, host only start, room full', () => {
  const g = new Game();
  g.addPlayer('A', 'x'); g.addPlayer('B', 'y');
  assert.throws(() => g.addPlayer('a', 'z'), /taken/);
  assert.equal(g.act(0, { type: 'start' }).ok, false);
  g.addPlayer('C', 'z'); g.addPlayer('D', 'w');
  assert.throws(() => g.addPlayer('E', 'q'), /full/);
  assert.equal(g.act(1, { type: 'start' }).ok, false);
  assert.ok(g.act(0, { type: 'start' }).ok);
});

test('full simulated games finish with invariants intact (3 and 4 players)', () => {
  let finished = 0;
  for (let i = 0; i < 20; i++) { const g = playGame(3 + (i % 2)); if (g.phase === 'ended') finished++; }
  assert.ok(finished >= 15, `only ${finished}/20 finished`);
});
