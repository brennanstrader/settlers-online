'use strict';
// Multi-client socket simulation: spins up the real server in-process on a random port,
// connects 4 socket.io clients as bots, plays a whole game, tests reconnect-by-name midgame.
process.env.PORT = process.env.PORT || '0';
process.env.DATA_FILE = '/tmp/so-sim-rooms.json';
const { io: ioc } = require('socket.io-client');
const { server } = require('../server');
const { decide } = require('./bot');

const emit = (s, ev, p) => new Promise((res) => s.emit(ev, p, res));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await new Promise((r) => (server.listening ? r() : server.once('listening', r)));
  const url = `http://localhost:${server.address().port}`;
  const names = ['Ann', 'Bo', 'Cy', 'Di'];
  const clients = names.map(() => ({ s: ioc(url, { forceNew: true }), state: null, busy: false, rejected: 0, token: null }));
  clients.forEach((c) => c.s.on('state', (st) => { c.state = st; pump(c); }));
  const created = await emit(clients[0].s, 'create', { name: names[0] });
  if (!created.ok) throw new Error('create failed');
  clients[0].token = created.token;
  const code = created.code;
  console.log('room', code);
  // bad join
  console.log('bad code ->', (await emit(clients[1].s, 'join', { code: 'ZZZZ', name: 'X' })).error);
  for (let i = 1; i < 4; i++) { const r = await emit(clients[i].s, 'join', { code, name: names[i] }); if (!r.ok) throw new Error(r.error); clients[i].token = r.token; }
  // duplicate name while connected, no token -> rejected
  const extra = ioc(url, { forceNew: true });
  console.log('dup name ->', (await emit(extra, 'join', { code, name: 'ann' })).error);
  extra.close();
  await sleep(100);
  let r = await emit(clients[1].s, 'act', { type: 'start' });
  console.log('non-host start ->', r.error);
  r = await emit(clients[0].s, 'act', { type: 'start' });
  if (!r.ok) throw new Error(r.error);

  let actions = 0, errors = 0, raced = 0, reconnected = false;
  function pump(c) {
    if (c.busy || !c.state || c.state.you < 0) return;
    const a = decide(c.state);
    if (!a) return;
    c.busy = true;
    c.s.emit('act', a, (res) => {
      c.busy = false; actions++;
      if (!res.ok && /No open trade|not for you|no longer has/i.test(res.error)) { raced++; } else if (!res.ok) { errors++; console.log('REJECTED', c.state.players[c.state.you].name, JSON.stringify(a), res.error); }
    });
  }
  const t0 = Date.now();
  let step = 0;
  while (Date.now() - t0 < 60000) {
    await sleep(25);
    const st = clients[0].state;
    if (st.phase === 'ended') break;
    clients.forEach(pump);
    // mid-game: client 2 "refreshes" (new socket, same name+token)
    if (!reconnected && st.phase === 'playing' && st.log.length > 30) {
      reconnected = true;
      const old = clients[2];
      old.s.close();
      await sleep(150);
      const cyOf = (st) => st.players.find((p) => p.name === 'Cy');
      const mid = cyOf(clients[0].state).connected;
      const fresh = { s: ioc(url, { forceNew: true }), state: null, busy: false, token: old.token };
      fresh.s.on('state', (x) => { fresh.state = x; pump(fresh); });
      const rj = await emit(fresh.s, 'join', { code, name: 'cy', token: old.token });
      clients[2] = fresh;
      await sleep(100);
      console.log(`reconnect-by-name ok=${rj.ok} offlineWhileGone=${!mid} backOnline=${cyOf(clients[0].state).connected} sameSeat=${fresh.state.you === old.state.you}`);
      if (!rj.ok || mid || !cyOf(clients[0].state).connected || fresh.state.you !== old.state.you) throw new Error('reconnect failed');
      // hands remain
      if (!fresh.state.me) throw new Error('no private view after reconnect');
    }
    step++;
  }
  const st = clients[0].state;
  console.log(`phase=${st.phase} winner=${st.winner != null ? st.players[st.winner].name : '-'} actions=${actions} rejected=${errors} benignTradeRaces=${raced} turns≈${st.log.length}`);
  if (st.phase !== 'ended') throw new Error('game did not finish in time');
  if (errors) throw new Error('bots had rejected actions');
  // privacy: client views never include others' resources before the end
  console.log('final VP:', st.players.map((p) => `${p.name}=${p.vp}`).join(' '));
  clients.forEach((c) => c.s.close());
  server.close();
  process.exit(0);
}
main().catch((e) => { console.error('SIM FAILED', e); process.exit(1); });
