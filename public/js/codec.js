// Serverlose Variante: Zugangscodes und Fortschrittsberichte als Text.
// - Zugangscode (Coach -> Kind): Name + 13 Zeichen; enthält freigeschaltete Planeten,
//   Avatar, Kind-ID und Prüfsumme. Als Link: #k-<name>-<code>[-m<funkspruch>]
// - Bericht (Kind -> Coach): "SH1:" + komprimiertes JSON (base64url).

// Feste Reihenfolge für die Bit-Kodierung. NUR HINTEN ANHÄNGEN, nie umsortieren!
export const CODE_ORDER = ['mengen', 'zerlegen', 'plus10', 'minus10', 'plus20', 'minus20', 'mal1', 'mal2', 'mal3', 'mal4', 'mal5', 'mal6', 'mal7', 'mal8', 'mal9', 'mal10', 'geteilt', 'malmix',
  'anlaut', 'vokale', 'silben', 'reime', 'bdpq', 'lesen', 'schreiben',
  'plus100', 'minus100', 'malzehner', 'halbschriftlich', 'divrest', 'plus1000', 'minus1000', 'groessen', 'sachaufgaben',
  'nomen', 'mehrzahl', 'doppel', 'ie', 'dehnung', 'trennen', 'saetze',
  'negativ', 'vorrang', 'teilbar', 'potenz', 'brucherkennen', 'bruchkuerzen', 'bruchplus', 'dezimal', 'prozent', 'gleichung',
  'wortarten', 'zeitformen', 'slaute', 'grossklein2', 'dasdass', 'komma',
  'lernwoerter', 'station',
  'kps_punkt', 'kps_klammer', 'kps_geteilt', 'kps_kette', 'kps_mix', 'kps_minus', 'kps_sonne',
  'br_erweitern', 'br_vergleich', 'br_minus', 'br_von', 'br_gemischt', 'br_malzahl', 'br_mal', 'br_durch', 'br_sonne',
  'f_bp', 'f_dt', 'f_gk', 'f_fwv', 'f_eiie', 'f_umlaut', 'f_lautpos', 'f_lautsonne',
  'z_mehr', 'z_nachbar', 'z_groesser', 'z_stellen', 'z_strahl', 'z_doppel', 'z_freunde', 'z_sonne',
  'k5_fuenfer', 'k5_finger', 'k5_plus5', 'k5_zerlegen', 'k5_zwanzig', 'k5_sonne', 'zr10_ergaenzen', 'zr10_platzhalter', 'zr10_sonne', 'zue_bis10', 'zue_zerlegen', 'zue_unter', 'zue_sonne',
  'einstufung'];
// v4-Codes speichern Freischaltungen pro Galaxie. NUR HINTEN ANHÄNGEN!
// Feste Planeten-Blöcke für v4-Codes – unabhängig davon, wie die Galaxien in der App angeordnet sind.
// NIE ändern, nur neue Blöcke hinten anhängen (neue Planeten -> neuer Block).
export const CODE_BLOCKS = [
  ['mengen', 'zerlegen', 'plus10', 'minus10', 'plus20', 'minus20', 'mal1', 'mal2', 'mal3', 'mal4', 'mal5', 'mal6', 'mal7', 'mal8', 'mal9', 'mal10', 'geteilt', 'malmix'],
  ['anlaut', 'vokale', 'silben', 'reime', 'bdpq', 'lesen', 'schreiben'],
  ['plus100', 'minus100', 'malzehner', 'halbschriftlich', 'divrest', 'plus1000', 'minus1000', 'groessen', 'sachaufgaben'],
  ['nomen', 'mehrzahl', 'doppel', 'ie', 'dehnung', 'trennen', 'saetze'],
  ['negativ', 'vorrang', 'teilbar', 'potenz', 'brucherkennen', 'bruchkuerzen', 'bruchplus', 'dezimal', 'prozent', 'gleichung'],
  ['wortarten', 'zeitformen', 'slaute', 'grossklein2', 'dasdass', 'komma'],
  ['kps_punkt', 'kps_klammer', 'kps_geteilt', 'kps_kette', 'kps_mix', 'kps_minus', 'kps_sonne'],
  ['br_erweitern', 'br_vergleich', 'br_minus', 'br_von', 'br_gemischt', 'br_malzahl', 'br_mal', 'br_durch', 'br_sonne'],
  ['f_bp', 'f_dt', 'f_gk', 'f_fwv', 'f_eiie', 'f_umlaut', 'f_lautpos', 'f_lautsonne'],
  ['z_mehr', 'z_nachbar', 'z_groesser', 'z_stellen', 'z_strahl', 'z_doppel', 'z_freunde', 'z_sonne'],
  ['k5_fuenfer', 'k5_finger', 'k5_plus5', 'k5_zerlegen', 'k5_zwanzig', 'k5_sonne', 'zr10_ergaenzen', 'zr10_platzhalter', 'zr10_sonne', 'zue_bis10', 'zue_zerlegen', 'zue_unter', 'zue_sonne'],
];
// Reihenfolge ist Teil des Codes: NUR HINTEN ANHÄNGEN (max. 128)!
export const AVATARS = ['🧑‍🚀', '👩‍🚀', '👨‍🚀', '🦊', '🐼', '🦄', '🐯', '🐸', '🐙', '🦖', '🐱', '🐶', '🦁', '🐧', '🦋', '🤖', '👽', '🌟',
  // Tiere
  '🐻', '🐨', '🐰', '🐹', '🐭', '🐮', '🐷', '🐵', '🐔', '🦉', '🦅', '🦆', '🐢', '🐍', '🐊', '🦕', '🐳', '🐬', '🦈', '🐠', '🦀', '🐝', '🐞', '🦔',
  '🦒', '🐘', '🦓', '🦘', '🦥', '🦦', '🐿️', '🦩', '🦜', '🐲', '🦝', '🐺', '🦌', '🐴', '🐑', '🐌', '🐛', '🦭', '🐻‍❄️', '🐡',
  // Fantasie & Helden
  '🦸', '🦹', '🧙', '🧚', '🧜', '🥷', '👑', '🐉', '👻', '🎃', '🤠', '🧞',
  // Weltraum & Natur
  '🪐', '🌙', '☀️', '🌈', '⚡', '🔥', '❄️', '🚀', '🛸', '☄️', '🌍', '💫', '🌻', '🌵', '🍀', '🌸',
  // Hobbys & Lieblingssachen
  '⚽', '🏀', '🎾', '🎸', '🎨', '🎮', '🧩', '🎈', '🍕', '🍓', '🍉', '🍩', '🧁', '🛹', '🚲', '🏰'];
const B32 = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // ohne 0/O und 1/I/L-Verwechslung

function toB32(n, len) { let s = ''; for (let i = 0; i < len; i++) { s = B32[Number(n & 31n)] + s; n >>= 5n; } return s; }
function fromB32(s) { let n = 0n; for (const c of s) { const v = B32.indexOf(c); if (v < 0) return null; n = (n << 5n) | BigInt(v); } return n; }
function check8(n, name) { let h = 0x9d; const str = n.toString(16) + '|' + name; for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xff; return BigInt(h); }

export function cleanName(name) {
  return String(name || '').toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ß/g, 'SS').replace(/[^A-Z]/g, '').slice(0, 14) || 'KIND';
}
export const prettyName = n => n.charAt(0) + n.slice(1).toLowerCase();

// v1 (13 Zeichen): [8 Prüfsumme][16 ID][5 Avatar][1 auto][32 Planeten]            = 62 Bit
// v2 (19 Zeichen): [8 Prüfsumme][16 ID][5 Avatar][1 auto][64 Planeten]  + 1 Füllbit = 95 Bit
// v3 (20 Zeichen): wie v2, aber 7 Bit Avatar (bis 128 Avatare)
const FMT = { 13: { mb: 32n, ab: 5n, groups: [4, 4, 5] }, 19: { mb: 64n, ab: 5n, groups: [4, 5, 5, 5] }, 20: { mb: 64n, ab: 7n, groups: [5, 5, 5, 5] } };
const group = (c, gs) => { const out = []; let i = 0; for (const g of gs) { out.push(c.slice(i, i + g)); i += g; } return out.join('-'); };
// v4 (variabel, beginnt mit „X“): Freischaltungen pro Galaxie – kurz, auch bei sehr vielen Planeten.
// Bits: [8 Prüfsumme][16 ID][7 Avatar][1 auto][5 Anzahl Galaxien] + je Galaxie [5 Galaxie][5 Länge][Maske]
// (v1–v3 beginnen immer mit einem der ersten 16 Zeichen des Alphabets, v4 mit „X“ – eindeutig unterscheidbar.)
const V4 = 'X';
function encodeV4(nm, id, avatar, autoAdvance, unlocked) {
  const bits = [];
  const put = (v, w) => { for (let i = w - 1; i >= 0; i--) bits.push((v >> i) & 1); };
  put(id & 0xffff, 16); put(avatar & 127, 7); put(autoAdvance ? 1 : 0, 1);
  const groups = CODE_BLOCKS.map((ids, gi) => ({ gi, list: ids.map(id => unlocked.includes(id)) })).filter(x => x.list.some(Boolean));
  put(groups.length, 5);
  for (const g of groups) { const len = g.list.lastIndexOf(true) + 1; put(g.gi, 5); put(len, 5); g.list.slice(0, len).forEach(b => bits.push(b ? 1 : 0)); }
  const body = bits.join('');
  const chk = Number(check8(BigInt('0b' + (body || '0')), nm));
  const all = chk.toString(2).padStart(8, '0') + body;
  const padded = all.padEnd(Math.ceil(all.length / 5) * 5, '0');
  let out = '';
  for (let i = 0; i < padded.length; i += 5) out += B32[parseInt(padded.slice(i, i + 5), 2)];
  return V4 + out;
}
function decodeV4(nm, raw) {
  let bits = '';
  for (const c of raw.slice(1)) { const v = B32.indexOf(c); if (v < 0) return null; bits += v.toString(2).padStart(5, '0'); }
  let pos = 0;
  const take = w => { if (pos + w > bits.length) throw new Error('kurz'); const v = parseInt(bits.slice(pos, pos + w), 2); pos += w; return v; };
  try {
    const chk = take(8), start = pos;
    const id = take(16), avatar = take(7), auto = take(1), ng = take(5), unlocked = [];
    for (let g = 0; g < ng; g++) {
      const gi = take(5), len = take(5), planets = (CODE_BLOCKS[gi] || []).map(id => ({ id }));
      for (let i = 0; i < len; i++) if (take(1) && planets[i]) unlocked.push(planets[i].id);
    }
    if (/1/.test(bits.slice(pos)) && bits.length - pos >= 5) return null; // mehr als nur Füllbits übrig
    if (chk !== Number(check8(BigInt('0b' + (bits.slice(start, pos) || '0')), nm))) return null;
    return { id, avatar: AVATARS[avatar] || AVATARS[0], autoAdvance: auto === 1, unlocked };
  } catch { return null; }
}
export function encodeKidCode({ name, id, avatar = 0, autoAdvance = true, unlocked = [] }) {
  const nm = cleanName(name);
  let mask = 0n, maxIdx = -1;
  CODE_ORDER.forEach((pid, i) => { if (unlocked.includes(pid)) { mask |= 1n << BigInt(i); maxIdx = i; } });
  if (avatar >= 32 || maxIdx >= 32) { // kurzer v1-Code reicht nicht -> kompaktes v4
    const raw = encodeV4(nm, id, avatar, autoAdvance, unlocked);
    return `${nm}-${raw.match(/.{1,5}/g).join('-')}`;
  }
  const len = 13, { mb, ab, groups } = FMT[len];
  const top = mb + 1n + ab + 16n;
  const body = (BigInt(id & 0xffff) << (mb + 1n + ab)) | (BigInt(avatar & 127) << (mb + 1n)) | ((autoAdvance ? 1n : 0n) << mb) | mask;
  const n = (check8(body, nm) << top) | body;
  return `${nm}-${group(toB32(n, len), groups)}`;
}
export function decodeKidCode(str) {
  const s = String(str || '').toUpperCase().replace(/\s+/g, '');
  const m = /^([A-Z]+)-?([0-9A-Z-]+)$/.exec(s);
  if (!m) return null;
  const raw = m[2].replace(/-/g, '');
  if (raw[0] === V4) {
    const d = decodeV4(m[1], raw); if (!d) return null;
    return { name: prettyName(m[1]), ...d, code: `${m[1]}-${raw.match(/.{1,5}/g).join('-')}` };
  }
  const f = FMT[raw.length]; if (!f) return null;
  const { mb, ab } = f, top = mb + 1n + ab + 16n;
  const n = fromB32(raw); if (n === null) return null;
  const body = n & ((1n << top) - 1n);
  if ((n >> top) !== check8(body, m[1])) return null;
  const mask = body & ((1n << mb) - 1n);
  return {
    name: prettyName(m[1]), id: Number((body >> (mb + 1n + ab)) & 0xffffn), avatar: AVATARS[Number((body >> (mb + 1n)) & ((1n << ab) - 1n))] || AVATARS[0],
    autoAdvance: ((body >> mb) & 1n) === 1n, unlocked: CODE_ORDER.filter((_, i) => (mask >> BigInt(i)) & 1n),
    code: `${m[1]}-${group(raw, f.groups)}`,
  };
}

// Funkspruch im Link: UTF-8 -> Base32
function bytesToB32(bytes) { let bits = 0, val = 0, out = ''; for (const b of bytes) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits) out += B32[(val << (5 - bits)) & 31]; return out; }
function b32ToBytes(s) { let bits = 0, val = 0; const out = []; for (const c of s) { const v = B32.indexOf(c); if (v < 0) return null; val = ((val << 5) | v) & 0xffff; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } } return new Uint8Array(out); }

export function kidHash(code, message, extra = '') {
  const [nm, ...rest] = code.split('-');
  let h = `k-${nm.toLowerCase()}-${rest.join('').toLowerCase()}`;
  if (message) h += '-m' + bytesToB32(new TextEncoder().encode(message.slice(0, 160))).toLowerCase();
  if (extra) h += '-x' + extra.toLowerCase();
  return h;
}

// Zusatzdaten im Link (Lernwörter, Belohnungsziel): JSON -> deflate -> Base32
export async function encodeExtra(obj) {
  if (!obj) return '';
  let bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined') bytes = new Uint8Array([1, ...await pipe(bytes, new CompressionStream('deflate-raw'))]);
  else bytes = new Uint8Array([0, ...bytes]);
  return bytesToB32(bytes);
}
export async function decodeExtra(str) {
  if (!str) return null;
  try {
    const b = b32ToBytes(str.toUpperCase()); if (!b || !b.length) return null;
    let body = b.slice(1);
    if (b[0] === 1) body = await pipe(body, new DecompressionStream('deflate-raw'));
    return JSON.parse(new TextDecoder().decode(body));
  } catch { return null; }
}
// Für den Link nur das Nötigste: Listen-Namen und Wörter, Belohnungsziel
export const linkExtra = (k, settings = {}) => {
  const w = (k.wordLists || []).filter(l => l.words?.length).map(l => [l.name, l.words]);
  const r = k.reward?.text ? [k.reward.goal || 5, k.reward.text] : null;
  const c = settings.phone || settings.email ? [settings.coachName || '', settings.phone || '', settings.email || ''] : null; // Kontakt der Coachin für „Nachricht an Coachin“
  const st = k.profile?.stufe; const g = st === '' || st == null || Number.isNaN(Number(st)) ? null : Number(st); // Klasse -> Einstufungstest passt sich an
  const p = (k.plan || []).length ? k.plan : null; // Lernplan: nur diese Themen-Galaxien zeigen
  return w.length || r || c || g != null || p ? { w, r, ...(c ? { c } : {}), ...(g != null ? { g } : {}), ...(p ? { p } : {}) } : null;
};
export const unpackExtra = x => ({ wordLists: (x?.w || []).map(([name, words], i) => ({ id: 'l' + i, name: String(name).slice(0, 40), words: (words || []).map(String).slice(0, 60) })), reward: x?.r ? { goal: Number(x.r[0]) || 5, text: String(x.r[1]).slice(0, 120) } : null, plan: Array.isArray(x?.p) ? x.p.map(String).slice(0, 40) : null, stufe: Number.isInteger(x?.g) && x.g >= 0 && x.g <= 8 ? x.g : null, contact: x?.c ? { name: String(x.c[0] || '').slice(0, 60), phone: String(x.c[1] || '').slice(0, 40), email: String(x.c[2] || '').slice(0, 120) } : null });
export function parseKidHash(hash) {
  const m = /^#?k-([a-z]+)-([0-9a-z]{4,60})(?:-m([0-9a-z]+))?(?:-x([0-9a-z]+))?$/i.exec(hash || '');
  if (!m) return null;
  let kid = decodeKidCode(`${m[1]}-${m[2]}`);
  if (!kid) { // ältere Links: Name und Code wurden manchmal an der falschen Stelle getrennt -> Prüfsumme findet die richtige Stelle
    const all = m[1] + m[2];
    for (let i = 1; i < all.length - 8 && !kid; i++) if (/^[a-z]+$/i.test(all.slice(0, i))) kid = decodeKidCode(`${all.slice(0, i)}-${all.slice(i)}`);
  }
  if (!kid) return null;
  let message = null;
  if (m[3]) { const b = b32ToBytes(m[3].toUpperCase()); if (b) { try { message = new TextDecoder('utf-8', { fatal: true }).decode(b); } catch { } } }
  return { ...kid, message, extra: m[4] || null };
}

// ---------- Fortschrittsbericht ----------
const b64url = bytes => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64url = s => { const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(bin, c => c.charCodeAt(0)); };
async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }

export async function encodeReport(kid) {
  const idx = id => CODE_ORDER.indexOf(id);
  const min = ts => Math.round(Date.parse(ts) / 60000);
  const obj = {
    v: 1, id: kid.id, n: kid.name, c: kid.code,
    p: Object.fromEntries(Object.entries(kid.progress || {}).filter(([k]) => idx(k) >= 0).map(([k, p]) => [idx(k), [p.bestStars, p.attempts, p.correct, p.total, p.lastPlayed ? min(p.lastPlayed) : 0, ...(p.lv ? [p.lv[1] || 0, p.lv[2] || 0, p.lv[3] || 0] : [])]])),
    s: (kid.sessions || []).slice(-80).map(s => [min(s.ts), idx(s.planetId), s.correct, s.total, s.moodBefore || 0, s.moodAfter || 0, s.tips || 0, s.durationSec || 0, s.level || 0]),
    e: (kid.errors || []).slice(-120).map(e => [min(e.ts), idx(e.planetId), e.type, e.task, e.given, e.expected]),
    av: kid.look?.avatar || '', pl: kid.placement || null, t: kid.trophies || {}, st: kid.stats ? { ...kid.stats, days: (kid.stats.days || []).slice(-60) } : null,
  };
  let bytes = new TextEncoder().encode(JSON.stringify(obj)), z = 'J';
  if (typeof CompressionStream !== 'undefined') { bytes = await pipe(bytes, new CompressionStream('deflate-raw')); z = 'Z'; }
  return 'SH1' + z + ':' + b64url(bytes);
}
export async function decodeReport(text) {
  const m = /SH1([JZ]):([A-Za-z0-9_-]+)/.exec(text || '');
  if (!m) throw new Error('Kein Bericht-Code gefunden. Bitte den ganzen Text einfügen (er enthält „SH1“).');
  let bytes = unb64url(m[2]);
  if (m[1] === 'Z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  const o = JSON.parse(new TextDecoder().decode(bytes));
  const pid = i => CODE_ORDER[i];
  const iso = t => new Date(t * 60000).toISOString();
  return {
    id: o.id, name: o.n, code: o.c,
    progress: Object.fromEntries(Object.entries(o.p || {}).filter(([i]) => pid(i)).map(([i, a]) => [pid(i), { bestStars: a[0], attempts: a[1], correct: a[2], total: a[3], lastPlayed: a[4] ? iso(a[4]) : null, ...(a.length > 5 ? { lv: { 1: a[5], 2: a[6], 3: a[7] } } : {}) }])),
    sessions: (o.s || []).filter(a => pid(a[1])).map(a => ({ ts: iso(a[0]), planetId: pid(a[1]), correct: a[2], total: a[3], stars: a[3] ? (a[2] / a[3] >= 1 ? 3 : a[2] / a[3] >= .9 ? 2 : a[2] / a[3] >= .7 ? 1 : 0) : 0, moodBefore: a[4] || null, moodAfter: a[5] || null, tips: a[6], durationSec: a[7], level: a[8] || null })),
    trophies: o.t || {}, stats: o.st || null, placement: o.pl || null, avatar: AVATARS.includes(o.av) ? o.av : null,
    errors: (o.e || []).filter(a => pid(a[1])).map(a => ({ ts: iso(a[0]), planetId: pid(a[1]), type: String(a[2]), task: String(a[3]).slice(0, 60), given: String(a[4]).slice(0, 40), expected: String(a[5]).slice(0, 40) })),
  };
}
