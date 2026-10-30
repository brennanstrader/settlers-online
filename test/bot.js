'use strict';
// Simple greedy bot that decides from a player's *view* only (used by fuzz + socket sims).
const { RES, COSTS } = require('../game');
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const afford = (h, c) => Object.keys(c).every((r) => h[r] >= c[r]);

function pips(view, vid) {
  const P = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };
  return view.board.vertices[vid].tiles.reduce((s, t) => s + (P[view.board.tiles[t].number] || 0), 0);
}

// returns an action or null (nothing to do)
function decide(view) {
  const me = view.you;
  if (view.phase === 'lobby' || view.phase === 'ended' || me < 0) return null;
  const L = view.legal, h = view.me.resources;
  if (view.phase === 'setup') {
    if (view.current !== me) return null;
    if (L.settlements.length) {
      const best = Math.max(...L.settlements.map((v) => pips(view, v)));
      return { type: 'buildSettlement', vertex: pick(L.settlements.filter((v) => pips(view, v) === best)) };
    }
    return L.roads.length ? { type: 'buildRoad', edge: pick(L.roads) } : null;
  }
  const t = view.turn;
  if (t.phase === 'discard') {
    const need = t.discard[me];
    if (!need) return null;
    const cards = {}; const pool = [];
    RES.forEach((r) => { for (let i = 0; i < h[r]; i++) pool.push(r); });
    for (let i = 0; i < need; i++) { const k = Math.floor(Math.random() * pool.length); const r = pool.splice(k, 1)[0]; cards[r] = (cards[r] || 0) + 1; }
    return { type: 'discard', cards };
  }
  // respond to trade sometimes
  if (view.trade && view.trade.from !== me && (view.trade.to == null || view.trade.to === me) && !view.trade.rejected.includes(me)) {
    const ok = afford(h, view.trade.get) && Math.random() < 0.5;
    return { type: 'respondTrade', accept: ok };
  }
  if (view.current !== me) return null;
  if (t.freeRoads > 0) return L.roads.length ? { type: 'buildRoad', edge: pick(L.roads) } : null;
  if (t.phase === 'roll') {
    if (view.me.playable.knight && !t.devPlayed && Math.random() < 0.5) return { type: 'playKnight' };
    return { type: 'roll' };
  }
  if (t.phase === 'robber') return { type: 'moveRobber', tile: pick(L.robber) };
  if (t.phase === 'steal') return { type: 'steal', victim: pick(L.steal) };
  // main
  if (view.trade && view.trade.from === me) return { type: 'cancelTrade' };
  if (L.cities.length && afford(h, COSTS.city)) return { type: 'buildCity', vertex: pick(L.cities) };
  if (L.settlements.length && afford(h, COSTS.settlement)) return { type: 'buildSettlement', vertex: pick(L.settlements) };
  if (view.deckSize && afford(h, COSTS.dev)) return { type: 'buyDev' };
  if (!t.devPlayed) {
    const p = view.me.playable;
    if (p.knight) return { type: 'playKnight' };
    if (p.monopoly) return { type: 'playMonopoly', resource: pick(RES) };
    if (p.yearofplenty) return { type: 'playYearOfPlenty', a: 'ore', b: 'grain' };
    if (p.roadbuilding) return { type: 'playRoadBuilding' };
  }
  if (L.roads.length && afford(h, COSTS.road) && (!L.settlements.length || Math.random() < 0.3)) return { type: 'buildRoad', edge: pick(L.roads) };
  // bank trade toward city/settlement
  const target = L.cities.length ? COSTS.city : COSTS.settlement;
  const missing = RES.filter((r) => (target[r] || 0) > h[r]);
  if (missing.length) {
    const give = RES.find((r) => h[r] - (target[r] || 0) >= view.me.ratios[r] && view.bank[missing[0]] > 0);
    if (give) return { type: 'bankTrade', give, get: missing[0] };
    // player trade offer once per turn when I have a surplus
    const surplus = RES.find((r) => h[r] - (target[r] || 0) >= 1 && !missing.includes(r));
    if (surplus && Math.random() < 0.2 && !view.trade) return { type: 'offerTrade', give: { [surplus]: 1 }, get: { [missing[0]]: 1 } };
  }
  return { type: 'endTurn' };
}
module.exports = { decide };
