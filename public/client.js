'use strict';
const RES = ['lumber', 'brick', 'wool', 'grain', 'ore'];
const RI = { lumber: ['', 'Lumber'], brick: ['', 'Brick'], wool: ['', 'Wool'], grain: ['', 'Grain'], ore: ['', 'Ore'] };
const COSTS = {
  road: { lumber: 1, brick: 1 }, settlement: { lumber: 1, brick: 1, wool: 1, grain: 1 },
  city: { grain: 2, ore: 3 }, dev: { wool: 1, grain: 1, ore: 1 },
};
const DEVN = { knight: ['', 'Knight'], roadbuilding: ['', 'Road Building'], yearofplenty: ['', 'Year of Plenty'], monopoly: ['', 'Monopoly'], vp: ['', 'Victory Point'] };
const K = 52;

const socket = io();
let S = null; // latest state
let mode = null; // 'road' | 'settlement' | 'city'
let tab = 'bank';
let showTrade = false;
let draft = { give: {}, get: {}, to: null };
let bankDraft = { give: 'lumber', get: 'ore' };
let discardDraft = {};
let modal = null; // {type:'yop'|'monopoly', a, b, r}
let lastLogN = -1;

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sess = () => { try { return JSON.parse(localStorage.getItem('so_session') || 'null'); } catch (e) { return null; } };
const saveSess = (s) => (s ? localStorage.setItem('so_session', JSON.stringify(s)) : localStorage.removeItem('so_session'));
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); }
const hasAll = (h, c) => Object.keys(c).every((r) => (h[r] || 0) >= c[r]);

// ---------------------------------------------------------- networking
function act(a) {
  socket.emit('act', a, (res) => { if (res && !res.ok) toast(res.error); });
}
function joinRoom(code, name, quiet) {
  const s = sess();
  const token = s && s.code === code && s.name.toLowerCase() === name.toLowerCase() ? s.token : undefined;
  socket.emit('join', { code, name, token }, (res) => {
    if (!res.ok) { if (!quiet) toast(res.error); else saveSess(null); S = null; render(); return; }
    saveSess({ code: res.code, name: res.name, token: res.token });
  });
}
socket.on('connect', () => { const s = sess(); if (s) joinRoom(s.code, s.name, true); });
socket.on('state', (st) => {
  const prev = S; S = st;
  if (!(st.phase === 'playing' && st.turn && st.current === st.you && st.turn.phase === 'main')) mode = null;
  if (prev && prev.version !== st.version) maybeToast(prev, st);
  render();
});
socket.on('kicked', () => { saveSess(null); S = null; render(); toast('You were removed from the room'); });
socket.on('disconnect', () => toast('Disconnected… reconnecting'));

function maybeToast(prev, st) {
  if (st.lastSteal && (!prev.lastSteal || prev.version !== st.version) && st.lastSteal.thief === st.you) {
    const l = st.log[st.log.length - 1];
    if (l && /stole/.test(l.msg)) toast(`You stole 1 ${st.lastSteal.res}`);
  }
}

// ---------------------------------------------------------- rendering
function render() {
  const app = $('#app');
  if (!S) return renderHome(app);
  if (S.phase === 'lobby') return renderLobby(app);
  renderGame(app);
}

function renderHome(app) {
  const params = new URLSearchParams(location.search);
  const code = (params.get('room') || '').toUpperCase();
  const lastName = localStorage.getItem('so_name') || '';
  app.innerHTML = `<div class="center stack">
    <div class="title">${ic('island', 38)}<span>Settlers Online</span></div>
    <div class="mute">A multiplayer island-building board game for 3–4 players. Create a room and share the code with your friends.</div>
    <div class="card stack">
      <label>Your name<input id="name" maxlength="16" placeholder="Name" value="${esc(lastName)}"></label>
      <button class="primary" id="create">Create a room</button>
      <div class="mute" style="text-align:center">— or join one —</div>
      <input id="code" maxlength="4" placeholder="ROOM CODE" value="${esc(code)}" style="text-transform:uppercase;letter-spacing:6px;text-align:center;font-weight:800">
      <button id="join">Join room</button>
    </div></div>`;
  const nm = () => $('#name').value.trim();
  $('#create').onclick = () => {
    if (!nm()) return toast('Enter your name');
    localStorage.setItem('so_name', nm());
    socket.emit('create', { name: nm() }, (res) => { if (!res.ok) return toast(res.error); saveSess({ code: res.code, name: res.name, token: res.token }); });
  };
  $('#join').onclick = () => {
    const c = $('#code').value.trim().toUpperCase();
    if (!nm()) return toast('Enter your name');
    if (c.length !== 4) return toast('Enter the 4-letter room code');
    localStorage.setItem('so_name', nm());
    joinRoom(c, nm());
  };
}

function inviteUrl() { return `${location.origin}/?room=${S.code}`; }

function renderLobby(app) {
  const isHost = S.players[S.you] && S.players[S.you].name === S.host;
  const n = S.players.length;
  app.innerHTML = `<div class="center stack">
    <div class="title">${ic('island', 38)}<span>Settlers Online</span></div>
    <div class="card stack">
      <div class="mute">Room code — share this with your friends</div>
      <div><span class="code" id="codebox">${S.code}</span></div>
      <div class="row"><button id="copy">${ic('copy', 16)} Copy invite link</button>${navigator.share ? '<button id="share">Share…</button>' : ''}</div>
    </div>
    <div class="card">
      <h3>Players (${n}/4)</h3>
      ${S.players.map((p) => `<div class="lobby-player"><span class="dot" style="background:${p.color}"></span><span class="grow"><b>${esc(p.name)}</b>${p.name === S.host ? ' <span class="badge">host</span>' : ''}${p.index === S.you ? ' <span class="badge">you</span>' : ''}</span>
        <span class="mute">${p.connected ? '● online' : '○ offline'}</span>
        ${isHost && p.name !== S.host ? `<button class="sm danger" data-a="kick" data-i="${p.index}">Kick</button>` : ''}</div>`).join('')}
    </div>
    ${isHost ? `<button class="primary" id="start" ${n < S.minPlayers ? 'disabled' : ''}>${n < S.minPlayers ? `Waiting for players (need ${S.minPlayers}+)` : 'Start game'}</button>`
      : '<div class="mute" style="text-align:center">Waiting for the host to start…</div>'}
    <button class="sm" id="leave">Leave room</button>
  </div>`;
  $('#copy').onclick = () => { (navigator.clipboard ? navigator.clipboard.writeText(inviteUrl()) : Promise.reject()).then(() => toast('Link copied'), () => toast(inviteUrl())); };
  if ($('#share')) $('#share').onclick = () => navigator.share({ title: 'Settlers Online', text: `Join my game! Room ${S.code}`, url: inviteUrl() }).catch(() => {});
  if ($('#start')) $('#start').onclick = () => act({ type: 'start' });
  $('#leave').onclick = () => { act({ type: 'leave' }); saveSess(null); S = null; render(); };
}

function statusInfo() {
  const cur = S.players[S.current];
  const me = S.you === S.current;
  if (S.phase === 'ended') return { label: 'Game over', text: `${esc(S.players[S.winner].name)} wins!` };
  if (S.phase === 'setup') {
    const what = S.setup.step === 'settlement' ? 'Place a settlement.' : 'Place a road next to it.';
    return me ? { label: 'Your turn', text: what } : { label: 'Setup', text: `${esc(cur.name)} is placing a ${S.setup.step === 'settlement' ? 'settlement' : 'road'}.` };
  }
  const t = S.turn;
  const L = me ? 'Your turn' : 'Waiting';
  if (t.freeRoads > 0) return me ? { label: L, text: `Place ${t.freeRoads} free road${t.freeRoads > 1 ? 's' : ''}.` } : { label: L, text: `${esc(cur.name)} is placing free roads.` };
  switch (t.phase) {
    case 'roll': return me ? { label: L, text: 'Roll the dice.' } : { label: L, text: `${esc(cur.name)} is about to roll.` };
    case 'discard': {
      const names = Object.keys(t.discard).map((i) => S.players[i].name);
      return t.discard[S.you] ? { label: 'Seven!', text: `Discard ${t.discard[S.you]} cards.` } : { label: 'Seven!', text: `Waiting for ${esc(names.join(', '))} to discard.` };
    }
    case 'robber': return me ? { label: L, text: 'Move the robber: tap a tile.' } : { label: L, text: `${esc(cur.name)} is moving the robber.` };
    case 'steal': return me ? { label: L, text: 'Choose a player to steal from.' } : { label: L, text: `${esc(cur.name)} is choosing who to rob.` };
    default: return me ? { label: L, text: 'Build, trade, or end turn.' } : { label: L, text: `${esc(cur.name)}'s turn.` };
  }
}

function renderGame(app) {
  const me = S.you;
  if (!$('#game')) {
    app.innerHTML = `${DIE_DEFS}<div id="game"><div id="left"><div class="panel banner" id="topbar"></div><div id="boardwrap"><div class="sea"><div class="sea-img"></div><div class="sea-w sea-w1"></div><div class="sea-w sea-w2"></div><div class="sea-shine"></div></div><div id="foamhost"></div><div id="boardhost"></div></div></div><div id="side"></div></div><div id="modalroot"></div>`;
    $('#boardwrap').addEventListener('click', onBoardClick);
  }
  const mineTurn = S.phase !== 'ended' && me === S.current;
  const dice = S.turn && S.turn.dice;
  const st = statusInfo();
  $('#topbar').className = 'panel banner' + (mineTurn ? ' mine' : '');
  $('#topbar').innerHTML = `
    <div class="bn-text"><div class="eyebrow">${st.label}</div><div class="status">${st.text}</div></div>
    <div class="dice-wrap"><div class="dice-tray ${dice ? '' : 'dim'}">${dieSVG(dice ? dice[0] : 0)}${dieSVG(dice ? dice[1] : 0)}</div><span class="sum">${dice ? dice[0] + dice[1] : '–'}</span></div>`;
  $('#boardhost').innerHTML = `<button class="roomchip" title="Copy invite link" data-a="copy">Room <b>${S.code}</b> ${ic('copy', 13)}</button>` + boardSVG();
  updateFoam();
  $('#side').innerHTML = sidePanel();
  $('#modalroot').innerHTML = modalHTML();
  const lg = $('#logbox'); if (lg) lg.scrollTop = lg.scrollHeight;
}

// ---- board
function legalSets() {
  const L = S.legal || { settlements: [], cities: [], roads: [], robber: [], steal: [] };
  const out = { v: [], e: [], t: [] };
  if (S.you !== S.current) return out;
  if (S.phase === 'setup') { out.v = L.settlements; out.e = L.roads; return out; }
  if (S.turn.freeRoads > 0) { out.e = L.roads; return out; }
  if (S.turn.phase === 'robber') { out.t = L.robber; return out; }
  if (S.turn.phase === 'main') {
    if (mode === 'settlement') out.v = L.settlements;
    if (mode === 'city') out.v = L.cities;
    if (mode === 'road') out.e = L.roads;
  }
  return out;
}
function boardGeom() {
  const B = S.board;
  const P = (v) => [B.vertices[v].x * K, B.vertices[v].y * K];
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
  B.vertices.forEach((v) => { minx = Math.min(minx, v.x * K); maxx = Math.max(maxx, v.x * K); miny = Math.min(miny, v.y * K); maxy = Math.max(maxy, v.y * K); });
  const pad = 1.5 * K;
  const w = maxx - minx + 2 * pad, h = maxy - miny + 2 * pad;
  const side = Math.max(w, h * 1.0);
  const vb = [(minx + maxx) / 2 - side / 2, (miny + maxy) / 2 - h / 2 - (side - h) / 2, side, side];
  return { B, P, vb };
}
let _foamKey = '';
function updateFoam() {
  const host = $('#foamhost'); if (!host) return;
  if (!ASSETS.ok) { if (_foamKey) { host.innerHTML = ''; _foamKey = ''; } return; }
  const { B, P, vb } = boardGeom();
  const key = B.tiles.map((t) => t.type[0] + t.id).join('') + vb.map(Math.round).join(',');
  if (key === _foamKey) return; // keep the DOM (and its running animation) untouched between state updates
  _foamKey = key; host.innerHTML = foamSVG(B, K, vb, P);
}
function boardSVG() {
  const { B, P, vb } = boardGeom();
  const legal = legalSets();
  let s = `<svg id="board" viewBox="${vb.map((n) => n.toFixed(1)).join(' ')}" xmlns="http://www.w3.org/2000/svg">${oceanDefs()}`;
  s += boardStatic(B, K, vb, P);
  // robber
  const rt = B.tiles[S.robber];
  if (rt) { const cx = rt.x * K, cy = rt.y * K; s += `<g transform="translate(${cx + 24},${cy + 16})"><ellipse cx="0" cy="12" rx="11" ry="4.5" fill="#0007"/><path d="M-9,12 Q-9,-3 0,-3 Q9,-3 9,12 Z" fill="#17181c" stroke="#e8e2d2" stroke-width="1.2"/><circle cx="0" cy="-9" r="6" fill="#17181c" stroke="#e8e2d2" stroke-width="1.2"/><path d="M-5-10q1-4 4-4" stroke="#7d8696" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`; }
  // roads
  for (const [eid, owner] of Object.entries(S.roads)) {
    const e = B.edges[eid]; const [ax, ay] = P(e.a), [bx, by] = P(e.b); const c = S.players[owner].color;
    if (ASSETS.ok) {
      s += `<line x1="${ax}" y1="${ay + 3.5}" x2="${bx}" y2="${by + 3.5}" stroke="#000" stroke-opacity=".5" stroke-width="10" stroke-linecap="round" filter="url(#blur2)"/><line x1="${ax}" y1="${ay + 1.4}" x2="${bx}" y2="${by + 1.4}" stroke="${c}" stroke-width="9" stroke-linecap="round"/><line x1="${ax}" y1="${ay + 1.4}" x2="${bx}" y2="${by + 1.4}" stroke="#000" stroke-opacity=".5" stroke-width="9" stroke-linecap="round"/><line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${c}" stroke-width="8" stroke-linecap="round"/><line x1="${ax}" y1="${ay - 1.6}" x2="${bx}" y2="${by - 1.6}" stroke="#fff" stroke-opacity=".42" stroke-width="2.4" stroke-linecap="round"/>`;
    } else
    s += `<line x1="${ax}" y1="${ay + 3}" x2="${bx}" y2="${by + 3}" stroke="#000" stroke-opacity=".45" stroke-width="12" stroke-linecap="round"/><line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#101216" stroke-width="12.5" stroke-linecap="round"/><line x1="${ax}" y1="${ay + 1.2}" x2="${bx}" y2="${by + 1.2}" stroke="${c}" stroke-width="8.4" stroke-linecap="round"/><line x1="${ax}" y1="${ay + 1.2}" x2="${bx}" y2="${by + 1.2}" stroke="#000" stroke-opacity=".28" stroke-width="8.4" stroke-linecap="round"/><line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${c}" stroke-width="7.2" stroke-linecap="round"/><line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#fff" stroke-opacity=".38" stroke-width="2.2" stroke-linecap="round" transform="translate(-.8,-1.7)"/>`;
  }
  // legal edges
  for (const eid of legal.e) {
    const e = B.edges[eid]; const [ax, ay] = P(e.a), [bx, by] = P(e.b);
    s += `<line class="pulse" x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="#fff" stroke-width="10" stroke-linecap="round"/><line class="hit" data-e="${eid}" x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="transparent" stroke-width="26" stroke-linecap="round"/>`;
  }
  // buildings (shaded 3-D house / town hall)
  const poly = (pts, fill, extra = '') => `<polygon points="${pts}" fill="${fill}" stroke="#0b0d10" stroke-width="1.5" stroke-linejoin="round" ${extra}/>`;
  const shd = (pts, o) => `<polygon points="${pts}" fill="#000" opacity="${o}"/>`;
  const lit = (pts, o) => `<polygon points="${pts}" fill="#fff" opacity="${o}"/>`;
  for (const [vid, b] of Object.entries(S.buildings)) {
    const [x, y] = P(vid); const c = S.players[b.owner].color;
    const pimg = pieceSVG(b.type, x, y + 3, c);
    if (pimg) { s += pimg; continue; }
    if (b.type === 'settlement') {
      const front = '-10,9 -10,-1 2,-1 2,9', side = '2,9 2,-1 10,-4 10,6', gable = '-11,-1 -4,-11 3,-1', roofR = '-4,-11 4,-14 11,-4 3,-1';
      s += `<g transform="translate(${x},${y - 3}) scale(1.22)"><ellipse cx="3" cy="11" rx="15" ry="4" fill="#000" opacity=".5"/>` +
        poly(front, c) + lit(front, 0.1) + poly(side, c) + shd(side, 0.32) + poly(roofR, c) + shd(roofR, 0.12) + poly(gable, c) + lit(gable, 0.26) +
        `<rect x="-6" y="3" width="5" height="6" rx="1" fill="#000" opacity=".55"/><rect x="-7.5" y="-5.5" width="3.4" height="3.2" fill="#fff" opacity=".35"/><path d="M-10,-1 H2 M2,-1 L10,-4" stroke="#fff" stroke-opacity=".5" stroke-width="1" fill="none"/></g>`;
    } else {
      const hall = '-17,10 -17,0 -2,0 -2,10', hroof = '-18.5,0 -9.5,-9 -0.5,0', tf = '-2,10 -2,-8 10,-8 10,10', ts = '10,10 10,-8 16,-11 16,7', tg = '-3,-8 4,-19 11,-8', tr = '4,-19 10,-22 17,-11 11,-8';
      s += `<g transform="translate(${x + 1},${y - 4}) scale(1.18)"><ellipse cx="2" cy="12" rx="20" ry="4.4" fill="#000" opacity=".5"/>` +
        poly(hall, c) + lit(hall, 0.08) + poly(hroof, c) + lit(hroof, 0.24) +
        poly(tf, c) + lit(tf, 0.1) + poly(ts, c) + shd(ts, 0.32) + poly(tr, c) + shd(tr, 0.12) + poly(tg, c) + lit(tg, 0.26) +
        `<rect x="1.5" y="3.6" width="4.4" height="6.4" rx="1" fill="#000" opacity=".55"/><rect x="-13" y="3" width="4" height="4" fill="#fff" opacity=".3"/><rect x="2.5" y="-5" width="3.4" height="3.4" fill="#fff" opacity=".35"/></g>`;
    }
  }
  for (const vid of legal.v) {
    const [x, y] = P(vid);
    s += `<circle class="pulse" cx="${x}" cy="${y}" r="11" fill="#fff" stroke="#111" stroke-width="2"/><circle class="hit" data-v="${vid}" cx="${x}" cy="${y}" r="20" fill="transparent"/>`;
  }
  for (const tid of legal.t) {
    const t = B.tiles[tid];
    s += `<polygon class="hit pulse" data-t="${tid}" points="${t.vertices.map((v) => P(v).join(',')).join(' ')}" fill="#fff" fill-opacity=".35"/>`;
  }
  return s + '</svg>';
}
function onBoardClick(ev) {
  const el = ev.target.closest('[data-v],[data-e],[data-t]');
  if (!el) return;
  if (el.dataset.v != null) {
    const vertex = +el.dataset.v;
    if (S.phase === 'setup' || mode === 'settlement') act({ type: 'buildSettlement', vertex });
    else if (mode === 'city') act({ type: 'buildCity', vertex });
    if (S.phase === 'playing') mode = null;
  } else if (el.dataset.e != null) {
    act({ type: 'buildRoad', edge: +el.dataset.e });
    if (S.phase === 'playing' && !(S.turn.freeRoads > 1)) mode = null;
  } else if (el.dataset.t != null) act({ type: 'moveRobber', tile: +el.dataset.t });
}

// ---- side panel
function resChips(h, small) { return RES.filter((r) => h[r]).map((r) => `<span class="chip">${ic(r, 14)} ${h[r]}</span>`).join(' ') || '<span class="mute">nothing</span>'; }
const costRow = (c) => Object.entries(c).map(([r, n]) => ic(r, 14).repeat(n)).join('');

function sidePanel() {
  const me = S.you, mine = S.phase === 'playing' && me === S.current;
  const my = S.me; const t = S.turn;
  let h = '';
  // players
  h += `<div class="panel players">` + S.players.map((p) => `<div class="p ${p.index === S.current && S.phase !== 'ended' ? 'cur' : ''} ${p.connected ? '' : 'off'}">
      <span class="dot" style="background:${p.color}"></span>
      <span class="nm">${esc(p.name)}${p.index === me ? ' (you)' : ''}${p.connected ? '' : ' <span class="mute">· offline</span>'}${p.hasLongest ? ` <span title="Longest Road +2">${ic('medal', 15)}</span>` : ''}${p.hasArmy ? ` <span title="Largest Army +2">${ic('star', 15)}</span>` : ''}</span>
      <span class="st" title="Resource cards">${ic('card', 17)}${p.resCount}</span><span class="st" title="Development cards">${ic('devcard', 17)}${p.devCount}</span>
      <span class="st" title="Knights played">${ic('swords', 17)}${p.knights}</span><span class="st" title="Longest road length">${ic('road', 17)}${p.roadLength}</span>
      <span class="vp" title="Victory points">${p.vp}${p.index === me && p.vp !== p.publicVP ? '*' : ''}</span></div>`).join('') +
    `<div class="rules"><span>First to 10 VP wins</span><i></i><span>${ic('medal', 16)} Longest Road (5+)</span><i></i><span>${ic('star', 16)} Largest Army (3+)</span></div>${S.players[me] && S.players[me].vp !== S.players[me].publicVP ? '<div class="mute small" style="text-align:center;margin-top:4px">* includes hidden VP cards</div>' : ''}</div>`;

  if (S.phase === 'ended') {
    const isHost = S.players[me] && S.players[me].name === S.host;
    h += `<div class="panel"><div class="eyebrow">Final scores</div><h3 class="serif big">${ic('trophy', 26)} ${esc(S.players[S.winner].name)} wins!</h3>${S.players.map((p) => `<div class="row" style="padding:3px 0"><span class="dot" style="background:${p.color}"></span><span class="grow">${esc(p.name)}</span><b>${p.vp}</b> VP</div>`).join('')}
      ${isHost ? '<button class="primary wide" data-a="rematch" style="margin-top:10px">Rematch (back to lobby)</button>' : '<div class="mute">Host can start a rematch.</div>'}</div>`;
  }
  // actions
  if (S.phase === 'playing' && me >= 0) {
    const inMain = mine && t.phase === 'main' && !(t.freeRoads > 0);
    const hand = my.resources, L = S.legal;
    const can = (k) => inMain && hasAll(hand, COSTS[k]);
    h += `<div class="panel"><div class="eyebrow">Build &amp; trade</div><div class="abtns">
      <button data-a="mode" data-k="road" class="${mode === 'road' ? 'on' : ''}" ${can('road') && L.roads.length ? '' : 'disabled'} title="1 lumber + 1 brick">${ic('road', 22)}<span>Road</span></button>
      <button data-a="mode" data-k="settlement" class="${mode === 'settlement' ? 'on' : ''}" ${can('settlement') && L.settlements.length ? '' : 'disabled'} title="1 lumber, brick, wool, grain">${ic('house', 22)}<span>Settlement</span></button>
      <button data-a="mode" data-k="city" class="${mode === 'city' ? 'on' : ''}" ${can('city') && L.cities.length ? '' : 'disabled'} title="2 grain + 3 ore">${ic('city', 22)}<span>City</span></button>
      <button data-a="buy" ${can('dev') && S.deckSize ? '' : 'disabled'} title="1 wool, grain, ore">${ic('devcard', 22)}<span>Dev card <small>(${S.deckSize})</small></span></button>
      <button data-a="tradeToggle" class="${showTrade ? 'on' : ''}" ${inMain ? '' : 'disabled'}>${ic('trade', 22)}<span>Trade</span></button></div>`;
    if (mode && inMain) h += `<div class="mute small" style="margin-top:8px">Tap a highlighted spot on the board to build. <a href="#" data-a="mode" data-k="">cancel</a></div>`;
    h += `<div class="costs"><span>Road ${costRow(COSTS.road)}</span><span>Settlement ${costRow(COSTS.settlement)}</span><span>City ${costRow(COSTS.city)}</span><span>Dev ${costRow(COSTS.dev)}</span></div></div>`;
    if (t.phase === 'steal' && mine) {
      h += `<div class="panel"><div class="eyebrow">Steal from</div><div class="btns" style="margin-top:8px">${S.legal.steal.map((i) => `<button data-a="steal" data-i="${i}"><span class="dot" style="background:${S.players[i].color}"></span> ${esc(S.players[i].name)} (${S.players[i].resCount})</button>`).join('')}</div></div>`;
    }
    if (t.phase === 'discard' && t.discard[me]) h += discardCard(t.discard[me]);
    if (S.trade) h += tradeCard();
    if (showTrade && inMain) h += tradePanel();
  }
  if (me >= 0 && my) {
    h += `<div class="panel"><div class="eyebrow">Your resources</div><div class="hand">${RES.map((r) => `<div class="res ${my.resources[r] ? '' : 'zero'}">${ic(r, 40)}<b>${my.resources[r]}</b><span>${RI[r][1]}</span></div>`).join('')}</div></div>`;
    const grouped = {}; my.dev.forEach((d) => (grouped[d] = (grouped[d] || 0) + 1));
    const pl = S.phase === 'playing';
    const inMain2 = mine && pl && t.phase === 'main' && !(t.freeRoads > 0);
    const rollNow = mine && pl && t.phase === 'roll' && !(t.freeRoads > 0);
    h += `<div class="panel"><div class="eyebrow">Development cards</div><div class="devrow"><div class="devlist">`;
    const ents = Object.entries(grouped);
    if (!ents.length) h += `<div class="dev empty">No cards yet</div>`;
    for (const [d, n] of ents) {
      const canPlay = mine && pl && my.playable[d] && !t.devPlayed && (t.phase === 'main' || t.phase === 'roll') && !(t.freeRoads > 0);
      h += `<div class="dev">${ic(DEV_ICON[d], 28)}<span class="grow">${DEVN[d][1]} ×${n}</span>${d === 'vp' ? '<span class="mute tag">auto</span>' : canPlay ? `<button class="sm" data-a="dev" data-k="${d}">Play</button>` : `<span class="mute tag">${my.playable[d] ? '' : 'next turn'}</span>`}</div>`;
    }
    h += `</div>`;
    if (pl) h += rollNow ? `<button class="primary next" data-a="roll">${ic('dice', 22, '', 'color:#2a2118')} Roll Dice</button>` : `<button class="primary next" data-a="end" ${inMain2 ? '' : 'disabled'}>Next Turn <span class="arr">→</span></button>`;
    h += `</div></div>`;
  }
  h += `<div class="panel"><div class="eyebrow">Log</div><div class="log" id="logbox">${S.log.map((l) => `<div>${esc(l.msg)}</div>`).join('')}</div></div>`;
  h += `<div class="mute small bankline">Bank: ${RES.map((r) => `<span>${ic(r, 14)} ${S.bank[r]}</span>`).join('')} · <a href="#" data-a="leavegame">Leave</a></div>`;
  return h;
}

function discardCard(need) {
  const sum = RES.reduce((s, r) => s + (discardDraft[r] || 0), 0);
  return `<div class="card offer"><b>Discard ${need} cards</b> <span class="mute">(selected ${sum})</span>
    ${RES.map((r) => `<div class="trade-row"><span>${ic(r, 24)}</span><span class="mute">have ${S.me.resources[r]}</span>
      <span class="stepper"><button class="sm" data-a="dstep" data-r="${r}" data-d="-1">−</button><span>${discardDraft[r] || 0}</span><button class="sm" data-a="dstep" data-r="${r}" data-d="1">+</button></span></div>`).join('')}
    <button class="primary" data-a="discard" ${sum === need ? '' : 'disabled'}>Discard</button></div>`;
}

function tradeCard() {
  const tr = S.trade, me = S.you;
  const from = S.players[tr.from];
  const forMe = tr.from !== me && (tr.to == null || tr.to === me);
  const target = tr.to == null ? 'everyone' : tr.to === me ? 'you' : S.players[tr.to].name;
  let h = `<div class="card offer"><b>${tr.from === me ? 'Your offer' : esc(from.name) + ' offers'}</b> <span class="mute">to ${esc(target)}</span>
    <div style="margin:6px 0">${tr.from === me ? 'You give' : 'They give'}: ${resChips(tr.give)}</div>
    <div style="margin-bottom:6px">${tr.from === me ? 'You get' : 'You give'}: ${resChips(tr.get)}</div>`;
  if (tr.from === me) {
    h += `<div class="mute">Declined by: ${tr.rejected.length ? esc(tr.rejected.map((i) => S.players[i].name).join(', ')) : 'nobody yet'}</div><button class="sm danger" data-a="cancelTrade">Cancel offer</button>`;
  } else if (forMe) {
    const ok = hasAll(S.me.resources, tr.get);
    h += `<div class="btns"><button class="primary" data-a="respond" data-v="1" ${ok ? '' : 'disabled'}>${ok ? 'Accept' : "Can't afford"}</button><button data-a="respond" data-v="0" ${tr.rejected.includes(me) ? 'disabled' : ''}>Decline</button></div>`;
  } else h += '<div class="mute">Not for you.</div>';
  return h + '</div>';
}

function tradePanel() {
  const my = S.me;
  let h = `<div class="card"><div class="tabs"><button class="${tab === 'bank' ? 'on' : ''}" data-a="tab" data-k="bank">Bank / Port</button><button class="${tab === 'players' ? 'on' : ''}" data-a="tab" data-k="players">Players</button></div>`;
  if (tab === 'bank') {
    const ratio = my.ratios[bankDraft.give];
    const opts = (sel) => RES.map((r) => `<option value="${r}" ${r === sel ? 'selected' : ''}>${RI[r][1]}</option>`).join('');
    const ok = bankDraft.give !== bankDraft.get && my.resources[bankDraft.give] >= ratio && S.bank[bankDraft.get] > 0;
    h += `<div class="mute">Your rates: ${RES.map((r) => `<span class="chip">${ic(r, 14)} ${my.ratios[r]}:1</span>`).join(' ')}</div>
      <div class="row" style="margin:8px 0"><span>Give <b>${ratio}</b></span><select data-sel="give">${opts(bankDraft.give)}</select><span>for 1</span><select data-sel="get">${opts(bankDraft.get)}</select></div>
      <button class="primary" data-a="bank" ${ok ? '' : 'disabled'}>Trade with bank</button>`;
  } else {
    const others = S.players.filter((p) => p.index !== S.you);
    h += `<div class="row" style="margin-bottom:6px"><span>To:</span><select data-sel="to"><option value="">Everyone</option>${others.map((p) => `<option value="${p.index}" ${draft.to === p.index ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
      <div class="trade-row mute"><span></span><span>You give</span><span>You get</span></div>
      ${RES.map((r) => `<div class="trade-row"><span>${ic(r, 24)}</span>
        <span class="stepper"><button class="sm" data-a="tstep" data-s="give" data-r="${r}" data-d="-1">−</button><span>${draft.give[r] || 0}</span><button class="sm" data-a="tstep" data-s="give" data-r="${r}" data-d="1">+</button></span>
        <span class="stepper"><button class="sm" data-a="tstep" data-s="get" data-r="${r}" data-d="-1">−</button><span>${draft.get[r] || 0}</span><button class="sm" data-a="tstep" data-s="get" data-r="${r}" data-d="1">+</button></span></div>`).join('')}
      <button class="primary" data-a="offer" ${S.trade ? 'disabled' : ''}>${S.trade ? 'Cancel your current offer first' : 'Send offer'}</button>`;
  }
  return h + '</div>';
}

function modalHTML() {
  if (!modal) return '';
  const opts = (sel, id) => RES.map((r) => `<option value="${r}" ${r === sel ? 'selected' : ''}>${RI[r][1]}</option>`).join('');
  if (modal.type === 'yop') return `<div class="modal"><div class="card stack"><h3 class="serif">${ic('gift', 24)} Year of Plenty</h3><div class="mute">Take any 2 resources from the bank.</div>
    <select data-sel="ya">${opts(modal.a)}</select><select data-sel="yb">${opts(modal.b)}</select>
    <div class="btns"><button class="primary" data-a="yopgo">Take</button><button data-a="closemodal">Cancel</button></div></div></div>`;
  if (modal.type === 'monopoly') return `<div class="modal"><div class="card stack"><h3 class="serif">${ic('coins', 24)} Monopoly</h3><div class="mute">Every other player gives you all their cards of one resource.</div>
    <select data-sel="mr">${opts(modal.r)}</select>
    <div class="btns"><button class="primary" data-a="monogo">Take them</button><button data-a="closemodal">Cancel</button></div></div></div>`;
  return '';
}

// ---- events
document.addEventListener('change', (ev) => {
  const s = ev.target.dataset && ev.target.dataset.sel; if (!s) return;
  const v = ev.target.value;
  if (s === 'give') { bankDraft.give = v; if (bankDraft.get === v) bankDraft.get = RES.find((r) => r !== v); }
  if (s === 'get') bankDraft.get = v;
  if (s === 'to') draft.to = v === '' ? null : +v;
  if (s === 'ya') modal.a = v; if (s === 'yb') modal.b = v; if (s === 'mr') modal.r = v;
  if (['give', 'get', 'to'].includes(s)) render();
});
function onClick(ev) {
  const el = ev.target.closest('[data-a]'); if (!el) return;
  ev.preventDefault();
  const a = el.dataset.a, d = el.dataset;
  const clamp = (n) => Math.max(0, Math.min(19, n));
  switch (a) {
    case 'copy': (navigator.clipboard ? navigator.clipboard.writeText(inviteUrl()) : Promise.reject()).then(() => toast('Invite link copied'), () => toast(inviteUrl())); return;
    case 'kick': return act({ type: 'kick', index: +d.i });
    case 'roll': return act({ type: 'roll' });
    case 'end': mode = null; showTrade = false; return act({ type: 'endTurn' });
    case 'mode': mode = d.k || null; return render();
    case 'buy': return act({ type: 'buyDev' });
    case 'tradeToggle': showTrade = !showTrade; return render();
    case 'tab': tab = d.k; return render();
    case 'steal': return act({ type: 'steal', victim: +d.i });
    case 'dstep': { const r = d.r; const v = clamp((discardDraft[r] || 0) + +d.d); discardDraft[r] = Math.min(v, S.me.resources[r]); return render(); }
    case 'discard': { const cards = { ...discardDraft }; discardDraft = {}; return act({ type: 'discard', cards }); }
    case 'tstep': { const side = d.s, r = d.r; const cur = draft[side][r] || 0; let v = clamp(cur + +d.d); if (side === 'give') v = Math.min(v, S.me.resources[r]); draft[side][r] = v; return render(); }
    case 'offer': act({ type: 'offerTrade', give: draft.give, get: draft.get, to: draft.to }); return;
    case 'cancelTrade': return act({ type: 'cancelTrade' });
    case 'respond': return act({ type: 'respondTrade', accept: d.v === '1' });
    case 'bank': return act({ type: 'bankTrade', give: bankDraft.give, get: bankDraft.get });
    case 'dev': {
      if (d.k === 'knight') return act({ type: 'playKnight' });
      if (d.k === 'roadbuilding') return act({ type: 'playRoadBuilding' });
      if (d.k === 'yearofplenty') { modal = { type: 'yop', a: 'grain', b: 'ore' }; return render(); }
      if (d.k === 'monopoly') { modal = { type: 'monopoly', r: 'ore' }; return render(); }
      return;
    }
    case 'yopgo': { const m = modal; modal = null; return act({ type: 'playYearOfPlenty', a: m.a, b: m.b }); }
    case 'monogo': { const m = modal; modal = null; return act({ type: 'playMonopoly', resource: m.r }); }
    case 'closemodal': modal = null; return render();
    case 'rematch': return act({ type: 'rematch' });
    case 'leavegame': if (confirm('Leave this game? You can rejoin later with the same name and room code.')) { saveSess(null); S = null; location.href = '/'; } return;
  }
}

document.addEventListener('click', onClick);
render();
loadAssets(() => { if (S && $('#game')) render(); });
