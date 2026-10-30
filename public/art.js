'use strict';
// Procedural SVG art: icons, tile illustrations, ocean/rocks. No external assets.
const ICONS = (() => {
  const ear = (cx, cy, rot) => `<ellipse cx="${cx}" cy="${cy}" rx="2.6" ry="5" fill="#f0bf34" stroke="#a9780f" stroke-width="1" transform="rotate(${rot} ${cx} ${cy})"/>`;
  const sword = (x1, y1, x2, y2, gx1, gy1, gx2, gy2, hx1, hy1, hx2, hy2) =>
    `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#7d8696" stroke-width="6" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="#e3e8ef" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M${gx1} ${gy1}L${gx2} ${gy2}" stroke="#b9871c" stroke-width="4" stroke-linecap="round"/><path d="M${hx1} ${hy1}L${hx2} ${hy2}" stroke="#6e4423" stroke-width="4.5" stroke-linecap="round"/>`;
  return {
    lumber: `<g transform="rotate(-24 24 24)"><rect x="4" y="13" width="32" height="22" rx="7" fill="#9a6535"/><rect x="4" y="13" width="32" height="8" rx="4" fill="#bb8248"/><path d="M11 23h19M9 29h19" stroke="#6e4423" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="37" cy="24" rx="7.5" ry="11" fill="#ecce96" stroke="#7a4b25" stroke-width="2"/><ellipse cx="37" cy="24" rx="4.6" ry="7" fill="none" stroke="#b98a50" stroke-width="1.4"/><ellipse cx="37" cy="24" rx="1.6" ry="2.6" fill="#b98a50"/></g>`,
    brick: `<g stroke="#6f2410" stroke-width="1.4" stroke-linejoin="round"><rect x="15" y="7" width="22" height="11" rx="2" fill="#e0603a"/><rect x="5" y="19" width="22" height="11" rx="2" fill="#d9532b"/><rect x="28" y="19" width="14" height="11" rx="2" fill="#c9482a"/><rect x="9" y="31" width="22" height="11" rx="2" fill="#cf4f2a"/><rect x="32" y="31" width="9" height="11" rx="2" fill="#e0603a"/></g><g stroke="#ffb08a" stroke-width="1.2" stroke-linecap="round" opacity=".7"><path d="M17 9.5h17M7 21.5h17M30 21.5h10M11 33.5h17"/></g>`,
    wool: `<ellipse cx="24" cy="41" rx="14" ry="3" fill="#0005"/><rect x="14" y="33" width="3.2" height="8" rx="1" fill="#2d2b29"/><rect x="29" y="33" width="3.2" height="8" rx="1" fill="#2d2b29"/><g fill="#f5f3ec" stroke="#aaa79b" stroke-width="1.3"><circle cx="14" cy="27" r="7"/><circle cx="21" cy="21" r="8"/><circle cx="30" cy="24" r="8"/><circle cx="24" cy="30" r="8"/><circle cx="16" cy="32" r="6"/></g><g fill="#f5f3ec"><circle cx="14" cy="27" r="6.4"/><circle cx="21" cy="21" r="7.4"/><circle cx="30" cy="24" r="7.4"/><circle cx="24" cy="30" r="7.4"/><circle cx="16" cy="32" r="5.4"/></g><ellipse cx="39" cy="26" rx="5" ry="6.5" fill="#34312d"/><ellipse cx="35" cy="19.5" rx="2" ry="3.6" fill="#34312d" transform="rotate(-35 35 19.5)"/><circle cx="40" cy="24.5" r=".9" fill="#fff"/>`,
    grain: `<path d="M24 45V13" stroke="#b78a1c" stroke-width="2.4" stroke-linecap="round"/>${ear(24, 8, 0)}${ear(18, 17, -32)}${ear(30, 17, 32)}${ear(18, 26, -32)}${ear(30, 26, 32)}${ear(18, 35, -32)}${ear(30, 35, 32)}`,
    ore: `<ellipse cx="24" cy="41" rx="19" ry="3" fill="#0005"/><polygon points="5,37 12,19 24,14 31,25 24,39" fill="#8a929d" stroke="#454c56" stroke-width="1.5" stroke-linejoin="round"/><polygon points="12,19 24,14 22,24 11,28" fill="#bcc3cd"/><polygon points="24,39 31,25 41,28 45,38" fill="#6b7480" stroke="#454c56" stroke-width="1.5" stroke-linejoin="round"/><polygon points="31,25 41,28 36,32 29,30" fill="#a4acb7"/><polygon points="14,38 21,31 28,38" fill="#9aa2ad" stroke="#454c56" stroke-width="1"/>`,
    card: `<rect x="14" y="7" width="20" height="34" rx="4" fill="none" stroke="#e8e2d2" stroke-width="3"/>`,
    devcard: `<rect x="11" y="6" width="26" height="36" rx="4" fill="#f4efe2" stroke="#8a7d5e" stroke-width="1.6"/><circle cx="24" cy="19" r="5.5" fill="#3a3f55"/><path d="M14 37c0-8 4-11 10-11s10 3 10 11z" fill="#c0392b"/>`,
    swords: sword(10, 38, 36, 9, 9, 29, 21, 41, 6, 42, 12, 36) + sword(38, 38, 12, 9, 39, 29, 27, 41, 42, 42, 36, 36),
    road: `<g transform="rotate(-35 24 24)"><rect x="3" y="17" width="40" height="13" rx="6.5" fill="#a8733d" stroke="#6e4423" stroke-width="1.6"/><rect x="5" y="19" width="34" height="4" rx="2" fill="#c89458"/><ellipse cx="42" cy="23.5" rx="3.6" ry="6.4" fill="#ecce96" stroke="#6e4423" stroke-width="1.3"/></g>`,
    medal: `<path d="M13 3l8 15h6l8-15h-8l-3 6-3-6z" fill="#3b82c4" stroke="#245a90" stroke-width="1.2" stroke-linejoin="round"/><circle cx="24" cy="31" r="13" fill="#f0bd36" stroke="#a87a10" stroke-width="2"/><circle cx="24" cy="31" r="8.5" fill="none" stroke="#c8951c" stroke-width="1.6"/>`,
    star: `<polygon points="24,4 30,17.5 44.5,18.8 33.5,28.5 36.8,43 24,35.5 11.2,43 14.5,28.5 3.5,18.8 18,17.5" fill="#f2bd2e" stroke="#a87a10" stroke-width="2" stroke-linejoin="round"/>`,
    house: `<path d="M6 23L24 7l18 16h-5v17H11V23z" fill="currentColor" stroke="#0006" stroke-width="1.4" stroke-linejoin="round"/>`,
    city: `<path d="M5 41V24l8-7 8 7v17zM21 41V12l9-8 9 8v29z" fill="currentColor" stroke="#0006" stroke-width="1.4" stroke-linejoin="round"/>`,
    dice: `<rect x="6" y="6" width="36" height="36" rx="8" fill="currentColor" stroke="#0006" stroke-width="1.4"/><g fill="#1a1a1a"><circle cx="16" cy="16" r="3.2"/><circle cx="32" cy="16" r="3.2"/><circle cx="24" cy="24" r="3.2"/><circle cx="16" cy="32" r="3.2"/><circle cx="32" cy="32" r="3.2"/></g>`,
    trade: `<path d="M8 17h28M30 9l8 8-8 8M40 31H12M18 23l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    gift: `<rect x="7" y="19" width="34" height="22" rx="3" fill="#c0392b" stroke="#6f1d14" stroke-width="1.4"/><rect x="5" y="13" width="38" height="8" rx="2" fill="#d9503f" stroke="#6f1d14" stroke-width="1.4"/><rect x="21" y="13" width="6" height="28" fill="#f2c94c"/><path d="M24 13c-8-9-14-1-8 0zM24 13c8-9 14-1 8 0z" fill="none" stroke="#f2c94c" stroke-width="3" stroke-linejoin="round"/>`,
    coins: `<circle cx="19" cy="29" r="13" fill="#f0bd36" stroke="#a87a10" stroke-width="2"/><circle cx="30" cy="19" r="13" fill="#f7cf55" stroke="#a87a10" stroke-width="2"/><text x="30" y="25" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="17" fill="#8a6208">$</text>`,
    island: `<ellipse cx="24" cy="38" rx="20" ry="5" fill="#1d6a9a"/><path d="M8 38c2-8 8-12 16-12s14 4 16 12z" fill="#e6cf8c"/><path d="M24 28V12" stroke="#7a4b25" stroke-width="3" stroke-linecap="round"/><path d="M24 13c-6-6-13-3-15 1 7-2 11 0 15-1zM24 13c6-6 13-3 15 1-7-2-11 0-15-1z" fill="#3fa05a"/>`,
    copy: `<rect x="15" y="15" width="24" height="26" rx="4" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M33 10H13a4 4 0 0 0-4 4v22" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>`,
    trophy: `<path d="M14 6h20v12c0 7-4 12-10 12S14 25 14 18zM14 10H6c0 8 3 11 8 12M34 10h8c0 8-3 11-8 12" fill="#f0bd36" stroke="#a87a10" stroke-width="2.2" stroke-linejoin="round"/><path d="M24 30v8M16 42h16" stroke="#a87a10" stroke-width="4" stroke-linecap="round"/>`,
  };
})();
// ---- painted assets (generated 3-D art). Procedural SVG above/below is the fallback if any asset fails to load.
const ASSETS = { ok: false };
const ICON_IMG = { lumber: 'ic_lumber.webp', brick: 'ic_brick.webp', wool: 'ic_wool.webp', grain: 'ic_grain.webp', ore: 'ic_ore.webp' };
const TILE_IMG = { forest: 'tile_forest.webp', pasture: 'tile_pasture.webp', fields: 'tile_fields.webp', hills: 'tile_hills.webp', mountains: 'tile_mountains.webp', desert: 'tile_desert.webp' };
function loadAssets(cb) {
  const urls = [...Object.values(TILE_IMG), ...Object.values(ICON_IMG), 'ocean.webp', 'waves1.webp', 'waves2.webp'];
  let left = urls.length, bad = false;
  urls.forEach((u) => {
    const i = new Image();
    i.onload = () => { if (--left === 0 && !bad) { ASSETS.ok = true; document.documentElement.classList.add('art3d'); if (cb) cb(); } };
    i.onerror = () => { bad = true; };
    i.src = 'assets/' + u;
  });
}
const _icSvg = (n, s = 18, cls = '', style = '') => `<svg class="ic ${cls}" ${style ? `style="${style}"` : ''} width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const ic = (n, s = 18, cls = '', style = '') => (ASSETS.ok && ICON_IMG[n]
  ? `<svg class="ic ic3d ${cls}" ${style ? `style="${style}"` : ''} width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><image href="assets/${ICON_IMG[n]}" width="48" height="48"/></svg>`
  : _icSvg(n, s, cls, style));
const icG = (n, x, y, s) => (ASSETS.ok && ICON_IMG[n] ? `<image href="assets/${ICON_IMG[n]}" x="${(x - s / 2).toFixed(1)}" y="${(y - s / 2).toFixed(1)}" width="${s}" height="${s}"/>` : `<g transform="translate(${(x - s / 2).toFixed(1)},${(y - s / 2).toFixed(1)}) scale(${(s / 48).toFixed(3)})">${ICONS[n] || ''}</g>`);
const DEV_ICON = { knight: 'swords', roadbuilding: 'road', yearofplenty: 'gift', monopoly: 'coins', vp: 'star' };

const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
function dieSVG(v, s = 46) {
  const pips = v ? (PIPS[v] || []).map(([x, y]) => `<circle cx="${23 + x * 10}" cy="${22 + y * 10}" r="4.1" fill="#1d150e"/><circle cx="${22.2 + x * 10}" cy="${21.1 + y * 10}" r="1.5" fill="#fff" opacity=".3"/>`).join('') : '';
  return `<svg class="die3d" width="${s}" height="${s}" viewBox="0 0 48 48" aria-label="die ${v || ''}"><rect x="4" y="9" width="42" height="38" rx="10" fill="#000" opacity=".4"/><rect x="2" y="6" width="42" height="38" rx="10" fill="#a8956a"/><rect x="2" y="2" width="42" height="40" rx="10" fill="url(#dieg)" stroke="#c9b98f" stroke-width="1"/><rect x="4.5" y="4.5" width="37" height="35" rx="8" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.2"/><path d="M8 38q15 4 30 0" stroke="#8a7648" stroke-opacity=".25" stroke-width="3" fill="none"/>${pips}</svg>`;
}
const DIE_DEFS = `<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="dieg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset=".6" stop-color="#efe3c8"/><stop offset="1" stop-color="#d6c7a2"/></linearGradient></defs></svg>`;

// ------------------------------------------------------------------ board art
function rngFor(seed) { let a = (seed * 2654435761) >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const inHex = (x, y, m) => Math.abs(x) <= 45 - m && Math.abs(y) + Math.abs(x) / Math.sqrt(3) <= 52 - m * 1.15;
function scatter(r, n, margin, avoid, minD) {
  const pts = []; let guard = 0;
  while (pts.length < n && guard++ < 400) {
    const x = (r() * 2 - 1) * 46, y = (r() * 2 - 1) * 52;
    if (!inHex(x, y, margin)) continue;
    if (avoid && Math.hypot(x, y - 6) < avoid) continue;
    if (pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < minD)) continue;
    pts.push([x, y]);
  }
  return pts.sort((a, b) => a[1] - b[1]);
}
const tree = (x, y, s, r) => { const sh = 0.85 + r() * 0.3; return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(s * sh).toFixed(2)})"><ellipse cx="1" cy="9" rx="7" ry="2.4" fill="#0a2a10" opacity=".5"/><rect x="-1.4" y="5" width="2.8" height="5" fill="#5b3a1e"/><path d="M0-14L-8 -2H8z" fill="#1e5a2a"/><path d="M0-9L-10 4H10z" fill="#246b31"/><path d="M0-4L-12 8H12z" fill="#2c7b3a"/><path d="M0-14L-2.5-8L-6-3L-10 4L-12 8H-5z" fill="#4fa05a" opacity=".55"/></g>`; };
const sheep = (x, y, s) => `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s})"><ellipse cx="0" cy="8" rx="9" ry="2.6" fill="#1d4a10" opacity=".45"/><rect x="-5" y="4" width="2" height="5" fill="#2d2b29"/><rect x="3" y="4" width="2" height="5" fill="#2d2b29"/><g fill="#f7f5ee" stroke="#b9b6aa" stroke-width=".7"><circle cx="-5" cy="0" r="4.5"/><circle cx="0" cy="-3" r="5"/><circle cx="5" cy="0" r="4.8"/><circle cx="0" cy="2" r="5"/></g><g fill="#f7f5ee"><circle cx="-5" cy="0" r="4"/><circle cx="0" cy="-3" r="4.5"/><circle cx="5" cy="0" r="4.3"/><circle cx="0" cy="2" r="4.5"/></g><ellipse cx="9.2" cy="-1" rx="3" ry="3.6" fill="#34312d"/><ellipse cx="7.3" cy="-4.2" rx="1.2" ry="2" fill="#34312d" transform="rotate(-35 7.3 -4.2)"/></g>`;
const wheatEar = (x, y, s, r) => { let g = `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s}) rotate(${((r() - 0.5) * 16).toFixed(0)})"><path d="M0 12V-8" stroke="#a37a16" stroke-width="1.3"/>`; for (let i = 0; i < 4; i++) { g += `<ellipse cx="-2.6" cy="${-4 + i * 4}" rx="1.5" ry="3" fill="#f6cd48" stroke="#a9780f" stroke-width=".5" transform="rotate(-30 -2.6 ${-4 + i * 4})"/><ellipse cx="2.6" cy="${-4 + i * 4}" rx="1.5" ry="3" fill="#f6cd48" stroke="#a9780f" stroke-width=".5" transform="rotate(30 2.6 ${-4 + i * 4})"/>`; } return g + `<ellipse cx="0" cy="-10" rx="1.5" ry="3.2" fill="#f6cd48" stroke="#a9780f" stroke-width=".5"/></g>`; };
const rock = (x, y, s, r) => { const a = r() * 30; return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s}) rotate(${a.toFixed(0)})"><ellipse cx="1" cy="7" rx="10" ry="3" fill="#0006"/><polygon points="-10,6 -7,-5 0,-10 8,-6 11,3 6,7" fill="#7b8490" stroke="#3b424c" stroke-width="1" stroke-linejoin="round"/><polygon points="-7,-5 0,-10 8,-6 1,-1 -6,2" fill="#aeb6c0"/><polygon points="1,-1 8,-6 11,3 6,7 0,5" fill="#59616c"/></g>`; };

function tileArt(t) {
  const r = rngFor(t.id + 11);
  const avoid = t.number ? 21 : 0;
  let s = '';
  switch (t.type) {
    case 'forest': {
      s += `<g opacity=".28" stroke="#0d3314" stroke-width="2" stroke-linecap="round">${scatter(r, 14, 4, 0, 11).map(([x, y]) => `<path d="M${x - 4} ${y}q4 -4 8 0"/>`).join('')}</g>`;
      scatter(r, 10, 9, avoid, 16).forEach(([x, y]) => (s += tree(x, y, 1.05 + r() * 0.3, r)));
      break;
    }
    case 'pasture': {
      s += `<g stroke="#4f8a2a" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".75">${scatter(r, 14, 5, 0, 10).map(([x, y]) => `<path d="M${x} ${y}l-2 -5M${x} ${y}l0 -6M${x} ${y}l2 -5"/>`).join('')}</g>`;
      s += `<g>${scatter(r, 7, 5, 0, 12).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="${r() > 0.5 ? '#fff6' : '#ffe38a99'}"/>`).join('')}</g>`;
      scatter(r, 2, 14, avoid + 4, 30).forEach(([x, y]) => (s += sheep(x, y, 1.05)));
      break;
    }
    case 'fields': {
      for (let i = -9; i <= 9; i++) s += `<path d="M${-60 + i * 9} 60L${20 + i * 9} -60" stroke="${i % 2 ? '#d29d22' : '#f3c943'}" stroke-width="4.5" opacity=".55"/>`;
      scatter(r, 7, 10, avoid, 16).forEach(([x, y]) => (s += wheatEar(x, y, 1.05 + r() * 0.3, r)));
      break;
    }
    case 'hills': {
      for (let row = -6; row <= 6; row++) for (let col = -5; col <= 5; col++) { const x = col * 17 + (row % 2 ? 8 : 0), y = row * 9; s += `<rect x="${x}" y="${y}" width="15" height="7" rx="1.4" fill="${(row + col) % 3 ? '#b4492a' : '#c8582f'}" stroke="#7d2e17" stroke-width=".6" opacity=".55"/>`; }
      scatter(r, 3, 12, avoid, 28).forEach(([x, y]) => (s += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><ellipse cx="0" cy="5" rx="14" ry="3.4" fill="#5b1c0c" opacity=".45"/><path d="M-14 5Q-10-9 0-9Q10-9 14 5z" fill="#d86a3c" stroke="#7d2e17" stroke-width="1"/><path d="M-9 2Q-6-5 0-6" stroke="#f1946a" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`));
      break;
    }
    case 'mountains': {
      s += `<g opacity=".4" stroke="#454c56" stroke-width="1.2" fill="none">${scatter(r, 9, 4, 0, 12).map(([x, y]) => `<path d="M${x - 6} ${y + 3}l5 -6l3 3l4 -5"/>`).join('')}</g>`;
      const peaks = scatter(r, 3, 12, avoid, 26);
      peaks.forEach(([x, y]) => { const w = 15 + r() * 6, h = 22 + r() * 8; s += `<g transform="translate(${x.toFixed(1)},${(y + 6).toFixed(1)})"><ellipse cx="0" cy="2" rx="${w + 3}" ry="4" fill="#20262e" opacity=".5"/><polygon points="${-w},0 ${-w * 0.35},${-h * 0.75} ${-w * 0.1},${-h * 0.62} 0,${-h} ${w * 0.5},${-h * 0.4} ${w},0" fill="#7a838f" stroke="#3b424c" stroke-width="1" stroke-linejoin="round"/><polygon points="${-w},0 ${-w * 0.35},${-h * 0.75} ${-w * 0.1},${-h * 0.62} 0,${-h} ${-w * 0.05},${-h * 0.2}" fill="#aab2bd"/><polygon points="0,${-h} ${w * 0.5},${-h * 0.4} ${w},0 ${w * 0.1},0 ${w * 0.15},${-h * 0.4}" fill="#555d69"/></g>`; });
      scatter(r, 3, 8, avoid, 16).forEach(([x, y]) => (s += rock(x, y, 0.55, r)));
      break;
    }
    case 'desert': {
      s += `<g fill="none" stroke-linecap="round">${[-30, -14, 4, 22, 36].map((y, i) => `<path d="M-50 ${y}q16 -9 30 0t30 0t30 0" stroke="${i % 2 ? '#f6ebc3' : '#bfa564'}" stroke-width="2.4" opacity=".6"/>`).join('')}</g>`;
      s += `<g transform="translate(0,2)"><ellipse cx="0" cy="17" rx="13" ry="3.4" fill="#6e5a2a" opacity=".5"/><rect x="-4.5" y="-18" width="9" height="35" rx="4.5" fill="#3f8a45" stroke="#245a2c" stroke-width="1.2"/><path d="M-4.5 4h-6a3 3 0 0 1-3-3v-9" stroke="#245a2c" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M-4.5 4h-6a3 3 0 0 1-3-3v-9" stroke="#3f8a45" stroke-width="6.6" stroke-linecap="round" fill="none"/><path d="M4.5 -3h5a3 3 0 0 0 3-3v-8" stroke="#245a2c" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M4.5 -3h5a3 3 0 0 0 3-3v-8" stroke="#3f8a45" stroke-width="6.6" stroke-linecap="round" fill="none"/><path d="M-1.5 -16v30" stroke="#6bb36f" stroke-width="1.6" stroke-linecap="round"/></g>`;
      scatter(r, 2, 10, 18, 40).forEach(([x, y]) => (s += rock(x, y, 0.5, r)));
      break;
    }
  }
  return s;
}

const TILE_GRAD = { forest: ['#2f7a3a', '#1b4a25'], pasture: ['#b3dc68', '#7fb347'], fields: ['#f1cb4b', '#d3a022'], hills: ['#d4633a', '#98391f'], mountains: ['#a6aeb8', '#69727e'], desert: ['#f2e2ae', '#d3ba7e'] };
const TILE_ICON = { forest: 'lumber', hills: 'brick', pasture: 'wool', fields: 'grain', mountains: 'ore' };

function oceanDefs() {
  const g = Object.entries(TILE_GRAD).map(([k, [a, b]]) => `<radialGradient id="tg-${k}" cx=".4" cy=".35" r=".85"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`).join('');
  return `<defs>${g}
  <radialGradient id="ocean" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#15466f"/><stop offset=".62" stop-color="#0a2547"/><stop offset="1" stop-color="#0a2547"/></radialGradient>
  <linearGradient id="bevel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7edcd"/><stop offset=".5" stop-color="#e6d6a8"/><stop offset="1" stop-color="#b9a572"/></linearGradient>
  <radialGradient id="token" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fffaea"/><stop offset=".7" stop-color="#f2e6c3"/><stop offset="1" stop-color="#d6c391"/></radialGradient>
  <radialGradient id="badge" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#fff6dd"/><stop offset="1" stop-color="#dcc593"/></radialGradient>
  <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>
  <linearGradient id="tokring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#b8a06a"/></linearGradient>
  <filter id="blur6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="blur2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 -.12"/></filter>
  </defs>`;
}

// Static (non-state) board layer: ocean, rocks, island rim, tiles, borders, tokens, ports.
const _staticCache = {};
const boardStatic = (B, K, vb, P) => (ASSETS.ok ? boardStatic3D(B, K, vb, P) : boardStaticProc(B, K, vb, P));
function boardStaticProc(B, K, vb, P) {
  const key = B.tiles.map((t) => t.type[0] + (t.number || 0)).join('') + '|' + B.ports.map((p) => p.type).join(',') + '|' + vb.map(Math.round).join(',');
  if (_staticCache[key]) return _staticCache[key];
  let cx0 = 0, cy0 = 0; B.tiles.forEach((t) => { cx0 += t.x * K; cy0 += t.y * K; }); cx0 /= B.tiles.length; cy0 /= B.tiles.length;
  const tileScale = (t, f) => t.vertices.map((v) => { const [x, y] = P(v); return `${(t.x * K + (x - t.x * K) * f).toFixed(1)},${(t.y * K + (y - t.y * K) * f).toFixed(1)}`; }).join(' ');
  const full = (t) => t.vertices.map((v) => P(v).join(',')).join(' ');
  let s = `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="url(#ocean)"/>`;
  // waves
  const wr = rngFor(77);
  s += `<g fill="none" stroke="#6fb4e6" stroke-linecap="round" opacity=".16">`;
  for (let i = 0; i < 70; i++) { const x = vb[0] + wr() * vb[2], y = vb[1] + wr() * vb[3], l = 10 + wr() * 18; s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)}q${l / 4} -4 ${l / 2} 0t${l / 2} 0" stroke-width="${(1 + wr()).toFixed(1)}"/>`; }
  s += `</g>`;
  // shallow-water glow + island rim
  s += `<g filter="url(#blur6)" opacity=".55">${B.tiles.map((t) => `<polygon points="${full(t)}" fill="#2f86b5" stroke="#2f86b5" stroke-width="46" stroke-linejoin="round"/>`).join('')}</g>`;
  s += `<g filter="url(#blur2)" opacity=".5">${B.tiles.map((t) => `<polygon points="${full(t)}" fill="#000" stroke="#000" stroke-width="30" stroke-linejoin="round" transform="translate(0,5)"/>`).join('')}</g>`;
  s += B.tiles.map((t) => `<polygon points="${full(t)}" fill="#2c2f31" stroke="#2c2f31" stroke-width="26" stroke-linejoin="round"/>`).join('');
  s += B.tiles.map((t) => `<polygon points="${full(t)}" fill="#5c5a52" stroke="#5c5a52" stroke-width="20" stroke-linejoin="round"/>`).join('');
  s += B.tiles.map((t) => `<polygon points="${full(t)}" fill="#8f8567" stroke="#8f8567" stroke-width="12" stroke-linejoin="round"/>`).join('');
  // rim rubble
  const rr = rngFor(5); const tc = B.tiles.map((t) => [t.x * K, t.y * K]);
  s += `<g>`;
  for (let i = 0; i < 24; i++) { const a = rr() * 6.283, d = 215 + rr() * 60; const x = cx0 + Math.cos(a) * d, y = cy0 + Math.sin(a) * d; if (Math.min(...tc.map(([a1, b1]) => Math.hypot(a1 - x, b1 - y))) < 62) continue; s += `<polygon points="${[0, 1, 2, 3, 4].map((k) => { const aa = k * 1.2566 + rr() * 0.6, rad = 3 + rr() * 4; return `${(x + Math.cos(aa) * rad).toFixed(1)},${(y + Math.sin(aa) * rad).toFixed(1)}`; }).join(' ')}" fill="#4d5258" stroke="#1a1d20" stroke-width=".8"/>`; }
  s += `</g>`;
  // ocean rocks (outside island + ports)
  const portPts = B.ports.map((p) => { const [ax, ay] = P(p.vertices[0]), [bx, by] = P(p.vertices[1]); const mx = (ax + bx) / 2 - cx0, my = (ay + by) / 2 - cy0, d = Math.hypot(mx, my) || 1; return [(ax + bx) / 2 + (mx / d) * 0.95 * K, (ay + by) / 2 + (my / d) * 0.95 * K]; });
  const or = rngFor(31); let placed = 0, guard = 0; const placedPts = [];
  while (placed < 11 && guard++ < 800) {
    const x = vb[0] + or() * vb[2], y = vb[1] + or() * vb[3];
    if (Math.min(...tc.map(([a, b]) => Math.hypot(a - x, b - y))) < 118) continue;
    if (portPts.some(([a, b]) => Math.hypot(a - x, b - y) < 48)) continue;
    if (placedPts.some(([a, b]) => Math.hypot(a - x, b - y) < 40)) continue;
    placedPts.push([x, y]); placed++;
    const sz = 8 + or() * 16; const pts = [0, 1, 2, 3, 4, 5, 6].map((k) => { const aa = k * 0.8976 + or() * 0.4, rad = sz * (0.7 + or() * 0.45); return [x + Math.cos(aa) * rad, y + Math.sin(aa) * rad * 0.8]; });
    const poly = pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
    s += `<g><polygon points="${poly}" fill="#7fc8ee" opacity=".12" stroke="#9ad8f5" stroke-width="4" stroke-linejoin="round"/><polygon points="${poly}" fill="#3b4148" stroke="#14181c" stroke-width="1.2" stroke-linejoin="round"/><polygon points="${pts.slice(0, 4).map((p) => p.map((n) => (n - (n < x + 0.1 ? 0 : 0)).toFixed(1)).join(',')).join(' ')} ${x.toFixed(1)},${y.toFixed(1)}" fill="#6a727b" opacity=".75"/></g>`;
  }
  // tiles: cream bevel, art, borders
  let clips = '';
  for (const t of B.tiles) {
    const inner = tileScale(t, 0.925);
    clips += `<clipPath id="c${t.id}"><polygon points="${inner}"/></clipPath>`;
    s += `<polygon points="${full(t)}" fill="url(#bevel)" stroke="#7a6a45" stroke-width="1.2" stroke-linejoin="round"/>`;
    s += `<g clip-path="url(#c${t.id})"><polygon points="${full(t)}" fill="url(#tg-${t.type})"/><g transform="translate(${(t.x * K).toFixed(1)},${(t.y * K).toFixed(1)})">${tileArt(t)}</g></g>`;
    s += `<polygon points="${inner}" fill="none" stroke="#00000066" stroke-width="1.4" stroke-linejoin="round"/><polygon points="${tileScale(t, 0.95)}" fill="none" stroke="#fff8" stroke-width=".8" stroke-linejoin="round"/>`;
  }
  s = `<defs>${clips}</defs>` + s;
  // grain overlay
  s += `<g clip-path="url(#allt)" style="mix-blend-mode:overlay" opacity=".9"><rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" filter="url(#grain)"/></g>`;
  s = `<defs><clipPath id="allt">${B.tiles.map((t) => `<polygon points="${full(t)}"/>`).join('')}</clipPath></defs>` + s;
  // ports
  for (let i = 0; i < B.ports.length; i++) {
    const p = B.ports[i]; const [ax, ay] = P(p.vertices[0]), [bx, by] = P(p.vertices[1]); const [lx, ly] = portPts[i];
    const plank = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2a1a0b" stroke-width="8" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9a6d3c" stroke-width="5.4" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#c8975a" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="5 4"/>`;
    s += `<g>${plank(ax, ay, lx, ly)}${plank(bx, by, lx, ly)}<circle cx="${lx}" cy="${ly + 2}" r="21" fill="#000" opacity=".4"/><circle cx="${lx}" cy="${ly}" r="20" fill="url(#badge)" stroke="#8a6d3b" stroke-width="2.2"/><circle cx="${lx}" cy="${ly}" r="17" fill="none" stroke="#fff8" stroke-width=".8"/>`;
    if (p.type === 'any') s += `<text x="${lx}" y="${ly - 1}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="15" fill="#3d3220">?</text>`;
    else s += icG(TILE_ICON_BY_RES[p.type], lx, ly - 4, 17);
    s += `<text x="${lx}" y="${ly + 12.5}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="10" fill="#4a3a1a">${p.type === 'any' ? '3:1' : '2:1'}</text></g>`;
  }
  // number tokens + resource icons
  for (const t of B.tiles) {
    const cx = t.x * K, cy = t.y * K;
    const ico = TILE_ICON[t.type];
    if (ico) s += icG(ico, cx, cy - 22, 21);
    if (t.number) {
      const hot = t.number === 6 || t.number === 8; const pips = 6 - Math.abs(7 - t.number); const col = hot ? '#c0281c' : '#2a2118';
      const dots = Array.from({ length: pips }, (_, i) => `<circle cx="${(cx + (i - (pips - 1) / 2) * 3.6).toFixed(1)}" cy="${cy + 20.2}" r="1.15" fill="${col}"/>`).join('');
      s += `<circle cx="${cx}" cy="${cy + 8.5}" r="17.5" fill="#000" opacity=".35"/><circle cx="${cx}" cy="${cy + 7}" r="17" fill="url(#token)" stroke="#8a6d3b" stroke-width="1.6"/><circle cx="${cx}" cy="${cy + 7}" r="14.2" fill="none" stroke="#fff9" stroke-width=".8"/>` +
        `<text x="${cx}" y="${cy + 12.5}" text-anchor="middle" font-family="Georgia,'Noto Serif',serif" font-size="${hot ? 17 : 16}" font-weight="700" fill="${col}">${t.number}</text>${dots}`;
    }
  }
  return (_staticCache[key] = s);
}
const TILE_ICON_BY_RES = { lumber: 'lumber', brick: 'brick', wool: 'wool', grain: 'grain', ore: 'ore' };

// ------------------------------------------------------------------ painted 3-D board (used when ASSETS.ok)
const _hexEdgeLights = (pts, lightA, darkA, w) => {
  // pts: [[x,y]...] polygon; outward normal vs light from top-left decides highlight / shade colour
  let cx = 0, cy = 0; pts.forEach(([x, y]) => { cx += x; cy += y; }); cx /= pts.length; cy /= pts.length;
  let out = '';
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    const mx = (x1 + x2) / 2 - cx, my = (y1 + y2) / 2 - cy, d = Math.hypot(mx, my) || 1;
    const lit = (-mx / d) * 0.6 + (-my / d) * 0.8; // dot with direction to light (up-left)
    const col = lit > 0 ? lightA : darkA, op = Math.min(1, Math.abs(lit) * 1.1);
    out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-opacity="${op.toFixed(2)}" stroke-width="${w}" stroke-linecap="round"/>`;
  }
  return out;
};

function boardStatic3D(B, K, vb, P) {
  const key = '3d|' + B.tiles.map((t) => t.type[0] + (t.number || 0)).join('') + '|' + B.ports.map((p) => p.type).join(',') + '|' + vb.map(Math.round).join(',');
  if (_staticCache[key]) return _staticCache[key];
  let cx0 = 0, cy0 = 0; B.tiles.forEach((t) => { cx0 += t.x * K; cy0 += t.y * K; }); cx0 /= B.tiles.length; cy0 /= B.tiles.length;
  const scaled = (t, f) => t.vertices.map((v) => { const [x, y] = P(v); return [t.x * K + (x - t.x * K) * f, t.y * K + (y - t.y * K) * f]; });
  const str = (pts) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const full = (t) => t.vertices.map((v) => P(v).join(',')).join(' ');
  const fullPts = (t) => t.vertices.map((v) => P(v));
  let s = '';
  // island drop-shadow + rim (dark outline, sand, light edge)
  s += `<g filter="url(#blur6)" opacity=".7">${B.tiles.map((t) => `<polygon points="${full(t)}" fill="#000" stroke="#000" stroke-width="30" stroke-linejoin="round" transform="translate(2,9)"/>`).join('')}</g>`;
  s += B.tiles.map((t) => `<polygon points="${full(t)}" fill="#241d14" stroke="#241d14" stroke-width="27" stroke-linejoin="round"/>`).join('');
  s += B.tiles.map((t) => `<polygon points="${full(t)}" fill="#6a5d43" stroke="#6a5d43" stroke-width="21" stroke-linejoin="round"/>`).join('');
  s += B.tiles.map((t) => `<polygon points="${full(t)}" fill="#a79a77" stroke="#a79a77" stroke-width="13" stroke-linejoin="round"/>`).join('');
  // tiles
  let clips = '';
  for (const t of B.tiles) {
    const inner = scaled(t, 0.925), r = rngFor(t.id + 3);
    const fixed = t.type === 'pasture' || t.type === 'desert';
    const S = fixed ? 110 : 190, ox = fixed ? 0 : (r() - 0.5) * 70, oy = fixed ? 0 : (r() - 0.5) * 70;
    const flip = t.type !== 'desert' && r() > 0.5 ? -1 : 1;
    const cx = t.x * K, cy = t.y * K;
    clips += `<clipPath id="c${t.id}"><polygon points="${str(inner)}"/></clipPath>`;
    // raised tile: contact shadow, cream bevel, bevel edges
    s += `<polygon points="${full(t)}" fill="#000" opacity=".4" transform="translate(1.5,3.6)" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>`;
    s += `<polygon points="${full(t)}" fill="url(#bevel)" stroke="#6d5d38" stroke-width="1.1" stroke-linejoin="round"/>`;
    s += _hexEdgeLights(fullPts(t), '#fffbe8', '#7c6a3c', 1.8);
    // painted art
    s += `<g clip-path="url(#c${t.id})"><g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) scale(${flip},1)"><image href="assets/${TILE_IMG[t.type]}" x="${(-S / 2 + ox * flip).toFixed(1)}" y="${(-S / 2 + oy).toFixed(1)}" width="${S}" height="${S}" preserveAspectRatio="none"/></g>`;
    s += `<polygon points="${full(t)}" fill="url(#shade)"/>`;
    s += `<polygon points="${str(inner)}" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="5" stroke-linejoin="round"/></g>`;
    s += _hexEdgeLights(inner, '#1a1408', '#fff6d0', 1.3);
  }
  s = `<defs>${clips}</defs>` + s;
  // ports
  for (let i = 0; i < B.ports.length; i++) {
    const p = B.ports[i]; const [ax, ay] = P(p.vertices[0]), [bx, by] = P(p.vertices[1]);
    const mx = (ax + bx) / 2 - cx0, my = (ay + by) / 2 - cy0, dd = Math.hypot(mx, my) || 1;
    const lx = (ax + bx) / 2 + (mx / dd) * 0.95 * K, ly = (ay + by) / 2 + (my / dd) * 0.95 * K;
    const plank = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1 + 2}" x2="${x2}" y2="${y2 + 2}" stroke="#000" stroke-opacity=".35" stroke-width="9" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2a1a0b" stroke-width="8" stroke-linecap="round"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#8e6232" stroke-width="5.4" stroke-linecap="round"/><line x1="${x1}" y1="${y1 - 1}" x2="${x2}" y2="${y2 - 1}" stroke="#d3a468" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="5 4"/>`;
    s += `<g>${plank(ax, ay, lx, ly)}${plank(bx, by, lx, ly)}<circle cx="${lx}" cy="${ly + 4}" r="20.5" fill="#000" opacity=".4"/><circle cx="${lx}" cy="${ly + 2.4}" r="20" fill="#9b814a"/><circle cx="${lx}" cy="${ly}" r="20" fill="url(#badge)" stroke="#8a6d3b" stroke-width="1.8"/><ellipse cx="${lx - 5}" cy="${ly - 10}" rx="9" ry="4.5" fill="#fff" opacity=".35"/>`;
    if (p.type === 'any') s += `<text x="${lx}" y="${ly - 1}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="15" fill="#3d3220">?</text>`;
    else s += icG(TILE_ICON_BY_RES[p.type], lx, ly - 4, 20);
    s += `<text x="${lx}" y="${ly + 12.5}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="10" fill="#4a3a1a">${p.type === 'any' ? '3:1' : '2:1'}</text></g>`;
  }
  // number tokens (raised pucks)
  for (const t of B.tiles) {
    if (!t.number) continue;
    const cx = t.x * K, cy = t.y * K;
    const hot = t.number === 6 || t.number === 8; const pips = 6 - Math.abs(7 - t.number); const col = hot ? '#c0281c' : '#2a2118';
    const dots = Array.from({ length: pips }, (_, i) => `<circle cx="${(cx + (i - (pips - 1) / 2) * 3.6).toFixed(1)}" cy="${cy + 20.4}" r="1.2" fill="${col}"/>`).join('');
    s += `<circle cx="${cx}" cy="${cy + 11.5}" r="18.5" fill="#000" opacity=".28"/><circle cx="${cx}" cy="${cy + 10}" r="17.6" fill="#000" opacity=".38"/>` +
      `<circle cx="${cx}" cy="${cy + 9}" r="17" fill="#a38b55"/><circle cx="${cx}" cy="${cy + 7}" r="17" fill="url(#token)" stroke="#8a6d3b" stroke-width="1.3"/>` +
      `<circle cx="${cx}" cy="${cy + 7}" r="14.2" fill="none" stroke="url(#tokring)" stroke-width="1.1" opacity=".9"/><ellipse cx="${cx - 5}" cy="${cy - 2.2}" rx="9" ry="4.6" fill="#fff" opacity=".4"/>` +
      `<text x="${cx}" y="${cy + 12.5}" text-anchor="middle" font-family="Georgia,'Noto Serif',serif" font-size="${hot ? 17 : 16}" font-weight="700" fill="${col}">${t.number}</text>${dots}`;
  }
  return (_staticCache[key] = s);
}

// Foam / shoreline layer: separate persistent SVG (CSS-animated by transform+opacity, so it is cheap).
function foamSVG(B, K, vb, P) {
  const polys = (sw, extra) => B.tiles.map((t) => `<polygon points="${t.vertices.map((v) => P(v).join(',')).join(' ')}" fill="none" stroke="#e8f6ff" stroke-width="${sw}" stroke-linejoin="round" ${extra || ''}/>`).join('');
  const box = vb.map((n) => n.toFixed(1)).join(' ');
  const mk = (cls, inner) => `<svg class="foam ${cls}" viewBox="${box}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><filter id="fb-${cls}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3.2"/></filter></defs><g filter="url(#fb-${cls})">${inner}</g></svg>`;
  return mk('foam0', polys(30, 'opacity=".4"')) + mk('foam1', polys(40)) + mk('foam2', polys(30, 'stroke-dasharray="46 22 14 30"'));
}
