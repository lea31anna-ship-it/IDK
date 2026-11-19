// Spiele-Ecke: Sudoku, Kreuzworträtsel, Wortsuche, Zahlenmauer – jeweils in 3 Stufen.
// level: 'start' (VS 1–2), 'vs34' (VS 3–4), 'us' (Unterstufe)
import { rnd, pick, shuffle } from './util.js';
import { WORDS } from './exercises.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const up = w => [...String(w)].map(c => (c === 'ß' ? 'ß' : c.toUpperCase())).join('');

export const GAMES = [
  { id: 'sudoku', icon: '🔢', name: 'Sudoku', desc: { start: '4×4 mit Bildern', vs34: '6×6 mit Zahlen', us: '9×9 Klassiker' } },
  { id: 'kreuzwort', icon: '✏️', name: 'Kreuzworträtsel', desc: { start: 'Kurze Wörter mit Bildern', vs34: 'Längere Wörter', us: 'Lange Wörter' } },
  { id: 'wortsuche', icon: '🔍', name: 'Wortsuche', desc: { start: '→ und ↓', vs34: '→ und ↓, größeres Feld', us: 'Auch schräg ↘' } },
  { id: 'zahlenmauer', icon: '🧱', name: 'Zahlenmauer', desc: { start: 'Plus bis 30', vs34: 'Plus und Minus bis 200', us: 'Mit negativen Zahlen' } },
];

// Wortvorrat: eigene Wörter (z. B. Lernwörter) oder Bildwörter passend zur Stufe
function wordPool(level, custom) {
  if (custom?.length) return custom.map(w => ({ w: String(w).replace(/-/g, '').trim(), e: null })).filter(x => /^[\p{L}]+$/u.test(x.w) && x.w.length >= 3 && x.w.length <= 12);
  const [min, max] = { start: [3, 5], vs34: [4, 7], us: [6, 12] }[level];
  return WORDS.filter(x => x.w.length >= min && x.w.length <= max && /^[\p{L}]+$/u.test(x.w));
}

// =============== SUDOKU ===============
function sudokuGrid(n, br, bc) {
  const base = (r, c) => (bc * (r % br) + Math.floor(r / br) + c) % n;
  const digits = shuffle([...Array(n).keys()]);
  const groupShuffle = (count, size) => shuffle([...Array(count).keys()]).flatMap(g => shuffle([...Array(size).keys()]).map(i => g * size + i));
  const rows = groupShuffle(n / br, br), cols = groupShuffle(n / bc, bc);
  return rows.map(r => cols.map(c => digits[base(r, c)]));
}
function sudoku(el, level, { onSolved, speak }) {
  const cfg = { start: { n: 4, br: 2, bc: 2, blanks: 6, sym: shuffle(['🍎', '🍌', '🍇', '🍓', '🥕', '⭐', '🌙', '🚀']).slice(0, 4) }, vs34: { n: 6, br: 2, bc: 3, blanks: 14 }, us: { n: 9, br: 3, bc: 3, blanks: 40 } }[level];
  const { n, br, bc } = cfg;
  const sym = cfg.sym || [...Array(n)].map((_, i) => String(i + 1));
  const sol = sudokuGrid(n, br, bc);
  const holes = new Set(shuffle([...Array(n * n).keys()]).slice(0, cfg.blanks));
  const val = sol.flat().map((v, i) => (holes.has(i) ? null : v));
  let sel = [...holes][0];
  const boxOf = i => Math.floor(Math.floor(i / n) / br) * (n / bc) + Math.floor((i % n) / bc);
  const render = (showErr = false) => {
    const conflicts = new Set();
    if (showErr) for (let i = 0; i < n * n; i++) for (let j = i + 1; j < n * n; j++) {
      if (val[i] === null || val[i] !== val[j]) continue;
      if (Math.floor(i / n) === Math.floor(j / n) || i % n === j % n || boxOf(i) === boxOf(j)) { if (holes.has(i)) conflicts.add(i); if (holes.has(j)) conflicts.add(j); }
    }
    el.innerHTML = `
      <p class="g-help">Jedes Zeichen darf in jeder <strong>Reihe</strong>, jeder <strong>Spalte</strong> und jedem <strong>dicken Kasten</strong> nur einmal vorkommen.</p>
      <div class="sudoku n${n}" style="--n:${n}" role="grid">
        ${val.map((v, i) => `<button class="sc ${holes.has(i) ? 'free' : 'given'} ${i === sel ? 'sel' : ''} ${conflicts.has(i) ? 'bad' : ''} ${(i % n) % bc === bc - 1 && i % n !== n - 1 ? 'br' : ''} ${Math.floor(i / n) % br === br - 1 && Math.floor(i / n) !== n - 1 ? 'bb' : ''}" data-i="${i}" ${holes.has(i) ? '' : 'tabindex="-1"'} aria-label="Feld ${Math.floor(i / n) + 1}-${i % n + 1}: ${v === null ? 'leer' : sym[v]}">${v === null ? '' : sym[v]}</button>`).join('')}
      </div>
      <div class="g-pad" style="--cols:${Math.min(n + 1, 5)}">${sym.map((s, k) => `<button data-k="${k}">${s}</button>`).join('')}<button data-k="del" aria-label="Löschen">⌫</button></div>
      <div class="g-actions"><button class="btn" id="g-check">🔎 Prüfen</button></div>`;
    el.querySelectorAll('.sc.free').forEach(b => b.onclick = () => { sel = Number(b.dataset.i); render(); });
    el.querySelectorAll('.g-pad button').forEach(b => b.onclick = () => {
      if (!holes.has(sel)) return;
      val[sel] = b.dataset.k === 'del' ? null : Number(b.dataset.k);
      const order = [...holes].sort((a, b2) => a - b2);
      if (b.dataset.k !== 'del') { const nx = order.find(i => i > sel && val[i] === null) ?? order.find(i => val[i] === null); if (nx !== undefined) sel = nx; }
      if (val.every(v => v !== null) && isValid()) { render(); onSolved(); return; }
      render();
    });
    el.querySelector('#g-check').onclick = () => { render(true); const bad = el.querySelectorAll('.sc.bad').length; speak(bad ? 'Die orangen Felder passen noch nicht. Schau nochmal in Reihe, Spalte und Kasten.' : val.includes(null) ? 'Bis jetzt passt alles. Weiter so!' : ''); };
  };
  const isValid = () => {
    for (let a = 0; a < n; a++) {
      const row = new Set(), col = new Set(), box = new Set();
      for (let b = 0; b < n; b++) {
        row.add(val[a * n + b]); col.add(val[b * n + a]);
      }
      for (let i = 0; i < n * n; i++) if (boxOf(i) === a) box.add(val[i]);
      if (row.size !== n || col.size !== n || box.size !== n) return false;
    }
    return true;
  };
  render();
}

// =============== KREUZWORTRÄTSEL ===============
function buildCrossword(pool, want) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const cand = shuffle(pool).slice(0, 30);
    const grid = new Map(), placed = [];
    const key = (r, c) => r + ',' + c;
    const place = (w, r, c, dir) => { const W = up(w.w); [...W].forEach((ch, i) => grid.set(key(r + (dir === 'd' ? i : 0), c + (dir === 'a' ? i : 0)), ch)); placed.push({ ...w, W, r, c, dir }); };
    const fits = (W, r, c, dir) => {
      const dr = dir === 'd' ? 1 : 0, dc = dir === 'a' ? 1 : 0;
      if (grid.has(key(r - dr, c - dc)) || grid.has(key(r + dr * W.length, c + dc * W.length))) return false;
      let cross = 0;
      for (let i = 0; i < W.length; i++) {
        const rr = r + dr * i, cc = c + dc * i, g = grid.get(key(rr, cc));
        if (g) { if (g !== W[i]) return false; cross++; }
        else if (grid.has(key(rr + dc, cc + dr)) || grid.has(key(rr - dc, cc - dr))) return false;
      }
      return cross > 0;
    };
    place(cand[0], 0, 0, 'a');
    for (const w of cand.slice(1)) {
      if (placed.length >= want || placed.some(p => up(p.w) === up(w.w))) continue;
      const W = up(w.w), opts = [];
      for (const p of placed) for (let i = 0; i < p.W.length; i++) for (let j = 0; j < W.length; j++) {
        if (p.W[i] !== W[j]) continue;
        const dir = p.dir === 'a' ? 'd' : 'a';
        const r = p.dir === 'a' ? p.r - j : p.r + i, c = p.dir === 'a' ? p.c + i : p.c - j;
        if (fits(W, r, c, dir)) opts.push([r, c, dir]);
      }
      if (opts.length) place(w, ...pick(opts));
    }
    if (placed.length >= Math.min(want, 3)) return { grid, placed };
  }
  return null;
}
function kreuzwort(el, level, { onSolved, speak, words }) {
  const want = { start: 4, vs34: 6, us: 7 }[level];
  const cw = buildCrossword(wordPool(level, words), want);
  if (!cw) { el.innerHTML = '<p>Mit diesen Wörtern lässt sich leider kein Rätsel bauen. Probier eine andere Liste!</p>'; return; }
  const cells = [...cw.grid.keys()].map(k => k.split(',').map(Number));
  const minR = Math.min(...cells.map(x => x[0])), minC = Math.min(...cells.map(x => x[1]));
  const rows = Math.max(...cells.map(x => x[0])) - minR + 1, cols = Math.max(...cells.map(x => x[1])) - minC + 1;
  const starts = [...new Set(cw.placed.map(p => (p.r - minR) * 100 + (p.c - minC)))].sort((a, b) => a - b);
  cw.placed.forEach(p => { p.num = starts.indexOf((p.r - minR) * 100 + (p.c - minC)) + 1; p.R = p.r - minR; p.C = p.c - minC; });
  const solution = new Map([...cw.grid].map(([k, v]) => { const [r, c] = k.split(',').map(Number); return [(r - minR) + ',' + (c - minC), v]; }));
  const numAt = new Map(cw.placed.map(p => [p.R + ',' + p.C, p.num]));
  let dir = 'a';
  const clue = p => `<li><button class="g-clue" data-n="${p.num}" data-dir="${p.dir}"><b>${p.num}</b> ${p.e ? `<span class="g-clue-e">${p.e}</span>` : ''} <span aria-hidden="true">🔊</span><span class="g-clue-len">${p.W.length} Buchstaben</span></button></li>`;
  el.innerHTML = `
    <p class="g-help">Tippe auf einen Hinweis, um das Wort zu hören. Schreib dann jeden Buchstaben in ein Kästchen.</p>
    <div class="g-scroll"><div class="cw" style="--cols:${cols};--rows:${rows}">
      ${Array.from({ length: rows * cols }, (_, i) => { const k = Math.floor(i / cols) + ',' + (i % cols); return solution.has(k) ? `<div class="cw-cell">${numAt.has(k) ? `<span class="cw-num">${numAt.get(k)}</span>` : ''}<input maxlength="2" data-k="${k}" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Feld"></div>` : '<div class="cw-empty"></div>'; }).join('')}
    </div></div>
    <div class="cw-clues">
      ${cw.placed.some(p => p.dir === 'a') ? `<div><h4>➡️ Waagrecht</h4><ul>${cw.placed.filter(p => p.dir === 'a').sort((a, b) => a.num - b.num).map(clue).join('')}</ul></div>` : ''}
      ${cw.placed.some(p => p.dir === 'd') ? `<div><h4>⬇️ Senkrecht</h4><ul>${cw.placed.filter(p => p.dir === 'd').sort((a, b) => a.num - b.num).map(clue).join('')}</ul></div>` : ''}
    </div>
    <div class="g-actions"><button class="btn" id="g-check">🔎 Prüfen</button></div>`;
  const input = k => el.querySelector(`input[data-k="${k}"]`);
  el.querySelectorAll('.g-clue').forEach(b => b.onclick = () => {
    const p = cw.placed.find(x => x.num === Number(b.dataset.n) && x.dir === b.dataset.dir);
    dir = p.dir; speak(p.w); input(p.R + ',' + p.C)?.focus();
  });
  const check = final => {
    let ok = true;
    for (const [k, v] of solution) { const i = input(k); const good = up(i.value.trim()) === v; if (!good) ok = false; i.classList.toggle('bad', !final && i.value !== '' && !good); i.classList.toggle('good', good); }
    return ok;
  };
  el.querySelectorAll('.cw input').forEach(inp => {
    inp.oninput = () => {
      inp.value = up(inp.value.slice(-1)); inp.classList.remove('bad');
      const [r, c] = inp.dataset.k.split(',').map(Number);
      const nx = input(dir === 'a' ? `${r},${c + 1}` : `${r + 1},${c}`) || input(dir === 'a' ? `${r + 1},${c}` : `${r},${c + 1}`);
      if (inp.value && nx) nx.focus();
      if ([...solution.keys()].every(k => input(k).value) && check(true)) { el.querySelectorAll('.cw input').forEach(i => { i.readOnly = true; }); onSolved(); }
    };
    inp.onfocus = () => { const [r, c] = inp.dataset.k.split(',').map(Number); if (!input(`${r},${c + 1}`) && !input(`${r},${c - 1}`)) dir = 'd'; else if (!input(`${r + 1},${c}`) && !input(`${r - 1},${c}`)) dir = 'a'; };
    inp.onkeydown = e => { if (e.key === 'Backspace' && !inp.value) { const [r, c] = inp.dataset.k.split(',').map(Number); (input(dir === 'a' ? `${r},${c - 1}` : `${r - 1},${c}`))?.focus(); } };
  });
  el.querySelector('#g-check').onclick = () => { check(false); const bad = el.querySelectorAll('.cw input.bad').length; speak(bad ? 'Die orangen Buchstaben stimmen noch nicht. Hör dir das Wort nochmal an.' : 'Alles, was du geschrieben hast, stimmt!'); };
}

// =============== WORTSUCHE ===============
function wortsuche(el, level, { onSolved, speak, words }) {
  const cfg = { start: { size: 7, count: 4, dirs: [[0, 1], [1, 0]] }, vs34: { size: 8, count: 5, dirs: [[0, 1], [1, 0]] }, us: { size: 10, count: 7, dirs: [[0, 1], [1, 0], [1, 1], [-1, 1]] } }[level];
  const { size } = cfg;
  let grid, placed;
  for (let attempt = 0; attempt < 50; attempt++) {
    grid = Array.from({ length: size }, () => Array(size).fill(null)); placed = [];
    for (const w of shuffle(wordPool(level, words).filter(x => x.w.length <= size))) {
      if (placed.length >= cfg.count || placed.some(p => p.W === up(w.w))) continue;
      const W = up(w.w);
      for (let t = 0; t < 80; t++) {
        const [dr, dc] = pick(cfg.dirs), r = rnd(0, size - 1), c = rnd(0, size - 1);
        const er = r + dr * (W.length - 1), ec = c + dc * (W.length - 1);
        if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
        if ([...W].every((ch, i) => { const g = grid[r + dr * i][c + dc * i]; return !g || g === ch; })) {
          [...W].forEach((ch, i) => { grid[r + dr * i][c + dc * i] = ch; });
          placed.push({ ...w, W, r, c, dr, dc, found: false }); break;
        }
      }
    }
    if (placed.length >= Math.min(cfg.count, 3)) break;
  }
  const FILL = 'EEEENNNIIISSRRAATTDHULCGMOBWFKZ';
  for (const row of grid) for (let c = 0; c < size; c++) row[c] ||= FILL[rnd(0, FILL.length - 1)];
  let first = null;
  const colors = ['#ffcf4d', '#7ad7ff', '#ff9ad5', '#9dffb0', '#ffb36b', '#c3a6ff', '#ff8a8a'];
  const render = () => {
    el.innerHTML = `
      <p class="g-help">Tippe auf den <strong>ersten</strong> und dann auf den <strong>letzten</strong> Buchstaben eines Wortes.</p>
      <ul class="ws-words">${placed.map((p, i) => `<li class="${p.found ? 'found' : ''}" style="--wc:${colors[i % colors.length]}"><button data-say="${esc(p.w)}">${p.e ? p.e + ' ' : ''}${esc(p.w)} 🔊</button></li>`).join('')}</ul>
      <div class="g-scroll"><div class="ws" style="--n:${size}">
        ${grid.flatMap((row, r) => row.map((ch, c) => { const f = placed.findIndex(p => p.found && [...p.W].some((_, i) => p.r + p.dr * i === r && p.c + p.dc * i === c)); return `<button class="ws-c ${first && first[0] === r && first[1] === c ? 'sel' : ''}" data-r="${r}" data-c="${c}" ${f >= 0 ? `style="background:${colors[f % colors.length]};color:#1b1d44"` : ''}>${ch}</button>`; })).join('')}
      </div></div>`;
    el.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
    el.querySelectorAll('.ws-c').forEach(b => b.onclick = () => {
      const r = Number(b.dataset.r), c = Number(b.dataset.c);
      if (!first) { first = [r, c]; render(); return; }
      const [r0, c0] = first; first = null;
      const hit = placed.find(p => !p.found && ((p.r === r0 && p.c === c0 && p.r + p.dr * (p.W.length - 1) === r && p.c + p.dc * (p.W.length - 1) === c) || (p.r === r && p.c === c && p.r + p.dr * (p.W.length - 1) === r0 && p.c + p.dc * (p.W.length - 1) === c0)));
      if (hit) { hit.found = true; speak(hit.w); }
      render();
      if (placed.every(p => p.found)) onSolved();
    });
  };
  render();
}

// =============== ZAHLENMAUER ===============
function zahlenmauer(el, level, { onSolved, speak }) {
  const cfg = { start: { base: 3, lo: 1, hi: 9, hide: 3 }, vs34: { base: 4, lo: 2, hi: 25, hide: 5 }, us: { base: 4, lo: -12, hi: 20, hide: 6 } }[level];
  const B = cfg.base, rows = [];
  rows[0] = Array.from({ length: B }, () => rnd(cfg.lo, cfg.hi));
  for (let r = 1; r < B; r++) rows[r] = rows[r - 1].slice(0, -1).map((v, i) => v + rows[r - 1][i + 1]);
  const all = rows.flatMap((row, r) => row.map((v, i) => ({ r, i, v })));
  const solvable = hidden => {
    const known = new Set(all.filter(x => !hidden.has(x.r + ',' + x.i)).map(x => x.r + ',' + x.i));
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 1; r < B; r++) for (let i = 0; i < B - r; i++) {
        const t = r + ',' + i, a = (r - 1) + ',' + i, b = (r - 1) + ',' + (i + 1);
        const k = [known.has(t), known.has(a), known.has(b)];
        if (k.filter(Boolean).length === 2) { known.add(t); known.add(a); known.add(b); changed = true; }
      }
    }
    return known.size === all.length;
  };
  let hidden;
  for (let t = 0; t < 400; t++) {
    const pool = level === 'start' ? all.filter(x => x.r > 0) : all;
    hidden = new Set(shuffle(pool).slice(0, cfg.hide).map(x => x.r + ',' + x.i));
    if (solvable(hidden)) break;
  }
  const show = v => (v < 0 ? '−' + Math.abs(v) : String(v));
  el.innerHTML = `
    <p class="g-help">Zwei Steine nebeneinander ergeben <strong>zusammen</strong> den Stein darüber. Fülle die leeren Steine aus!</p>
    <div class="zm">${[...rows].reverse().map(row => { const r = rows.indexOf(row); return `<div class="zm-row">${row.map((v, i) => hidden.has(r + ',' + i) ? `<input class="zm-b" inputmode="${level === 'us' ? 'text' : 'numeric'}" data-k="${r},${i}" aria-label="Stein" autocomplete="off">` : `<div class="zm-b given">${show(v)}</div>`).join('')}</div>`; }).join('')}</div>
    ${level === 'us' ? '<p class="g-help">Minuszeichen: einfach „-“ vor die Zahl tippen.</p>' : ''}
    <div class="g-actions"><button class="btn" id="g-check">🔎 Prüfen</button></div>`;
  const inputs = [...el.querySelectorAll('.zm-b[data-k]')];
  const val = k => { const [r, i] = k.split(',').map(Number); return rows[r][i]; };
  const parse = s => Number(String(s).replace('−', '-').trim());
  const check = mark => {
    let ok = true;
    for (const inp of inputs) { const good = inp.value.trim() !== '' && parse(inp.value) === val(inp.dataset.k); if (!good) ok = false; if (mark) inp.classList.toggle('bad', inp.value.trim() !== '' && !good); inp.classList.toggle('good', good && mark); }
    return ok;
  };
  inputs.forEach(inp => inp.oninput = () => { inp.classList.remove('bad'); if (check(false)) { check(true); inputs.forEach(i => { i.readOnly = true; }); onSolved(); } });
  el.querySelector('#g-check').onclick = () => { check(true); speak(el.querySelectorAll('.zm-b.bad').length ? 'Die orangen Steine stimmen noch nicht. Tipp: Oben minus einen Stein unten ergibt den anderen.' : 'Bis jetzt stimmt alles!'); };
}

const IMPL = { sudoku, kreuzwort, wortsuche, zahlenmauer };
export function renderGame(id, level, el, opts) { IMPL[id](el, level, opts); }
export const _test = { sudokuGrid, buildCrossword, wordPool };
