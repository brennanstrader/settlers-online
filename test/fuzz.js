'use strict';
// In-process full-game simulation with invariant checks.
const { Game, RES } = require('../game');
const { decide } = require('./bot');

function checkInvariants(g) {
  for (const r of RES) {
    const total = g.bank[r] + g.players.reduce((s, p) => s + p.resources[r], 0);
    if (total !== 19) throw new Error(`resource ${r} not conserved: ${total}`);
    if (g.bank[r] < 0 || g.players.some((p) => p.resources[r] < 0)) throw new Error('negative resources');
  }
  for (let i = 0; i < g.players.length; i++) {
    if (g.count(i, 'settlement') > 5 || g.count(i, 'city') > 4 || g.roadCount(i) > 15) throw new Error('piece limit');
  }
  // distance rule
  for (const v of Object.keys(g.buildings)) for (const n of g.board.vertices[v].neighbors) if (g.buildings[n]) throw new Error('distance rule violated');
}

function playGame(n = 4, maxSteps = 20000) {
  const g = new Game({ minPlayers: 3 });
  for (let i = 0; i < n; i++) g.addPlayer('P' + i, 't' + i);
  let r = g.act(0, { type: 'start' }); if (!r.ok) throw new Error(r.error);
  let steps = 0, stalls = 0;
  while (g.phase !== 'ended' && steps++ < maxSteps) {
    let acted = false;
    for (let pi = 0; pi < n && g.phase !== 'ended'; pi++) {
      const a = decide(g.viewFor(pi));
      if (!a) continue;
      const res = g.act(pi, a);
      if (!res.ok) throw new Error(`bot action rejected: ${JSON.stringify(a)} -> ${res.error} (phase ${g.phase}/${g.turn && g.turn.phase})`);
      acted = true;
      checkInvariants(g);
      if (a.type === 'endTurn' || a.type === 'roll') break;
    }
    if (!acted && ++stalls > 50) throw new Error('stalled');
    if (g.turnCount > 1500) break;
  }
  return g;
}
module.exports = { playGame, checkInvariants };
if (require.main === module) {
  const N = +process.argv[2] || 20;
  let wins = 0, turns = [];
  for (let i = 0; i < N; i++) {
    const g = playGame(3 + (i % 2));
    if (g.phase === 'ended') { wins++; turns.push(g.turnCount); }
  }
  console.log(`games=${N} finished=${wins} avgTurns=${turns.length ? Math.round(turns.reduce((a, b) => a + b, 0) / turns.length) : '-'}`);
}
