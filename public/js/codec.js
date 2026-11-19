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
  'wortarten', 'zeitformen', 'slaute', 'grossklein2', 'dasdass', 'komma'];
export const AVATARS = ['🧑‍🚀', '👩‍🚀', '👨‍🚀', '🦊', '🐼', '🦄', '🐯', '🐸', '🐙', '🦖', '🐱', '🐶', '🦁', '🐧', '🦋', '🤖', '👽', '🌟'];
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
const FMT = { 13: { mb: 32n, groups: [4, 4, 5] }, 19: { mb: 64n, groups: [4, 5, 5, 5] } };
const group = (c, gs) => { const out = []; let i = 0; for (const g of gs) { out.push(c.slice(i, i + g)); i += g; } return out.join('-'); };
export function encodeKidCode({ name, id, avatar = 0, autoAdvance = true, unlocked = [] }) {
  const nm = cleanName(name);
  let mask = 0n, maxIdx = -1;
  CODE_ORDER.forEach((pid, i) => { if (unlocked.includes(pid)) { mask |= 1n << BigInt(i); maxIdx = i; } });
  const len = maxIdx < 32 ? 13 : 19, { mb, groups } = FMT[len];
  const body = (BigInt(id & 0xffff) << (mb + 6n)) | (BigInt(avatar & 31) << (mb + 1n)) | ((autoAdvance ? 1n : 0n) << mb) | mask;
  const n = (check8(body, nm) << (mb + 22n)) | body;
  return `${nm}-${group(toB32(n, len), groups)}`;
}
export function decodeKidCode(str) {
  const s = String(str || '').toUpperCase().replace(/\s+/g, '');
  const m = /^([A-Z]+)-?([0-9A-Z-]+)$/.exec(s);
  if (!m) return null;
  const raw = m[2].replace(/-/g, '');
  const f = FMT[raw.length]; if (!f) return null;
  const { mb } = f;
  const n = fromB32(raw); if (n === null) return null;
  const body = n & ((1n << (mb + 22n)) - 1n);
  if ((n >> (mb + 22n)) !== check8(body, m[1])) return null;
  const mask = body & ((1n << mb) - 1n);
  return {
    name: prettyName(m[1]), id: Number((body >> (mb + 6n)) & 0xffffn), avatar: AVATARS[Number((body >> (mb + 1n)) & 31n)] || AVATARS[0],
    autoAdvance: ((body >> mb) & 1n) === 1n, unlocked: CODE_ORDER.filter((_, i) => (mask >> BigInt(i)) & 1n),
    code: `${m[1]}-${group(raw, f.groups)}`,
  };
}

// Funkspruch im Link: UTF-8 -> Base32
function bytesToB32(bytes) { let bits = 0, val = 0, out = ''; for (const b of bytes) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } } if (bits) out += B32[(val << (5 - bits)) & 31]; return out; }
function b32ToBytes(s) { let bits = 0, val = 0; const out = []; for (const c of s) { const v = B32.indexOf(c); if (v < 0) return null; val = ((val << 5) | v) & 0xffff; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } } return new Uint8Array(out); }

export function kidHash(code, message) {
  let h = 'k-' + code.replace(/-/g, '').toLowerCase().replace(/^([a-z]+)/, '$1-');
  if (message) h += '-m' + bytesToB32(new TextEncoder().encode(message.slice(0, 160))).toLowerCase();
  return h;
}
export function parseKidHash(hash) {
  const m = /^#?k-([a-z]+)-([0-9a-z]{19}|[0-9a-z]{13})(?:-m([0-9a-z]+))?$/i.exec(hash || '');
  if (!m) return null;
  const kid = decodeKidCode(`${m[1]}-${m[2]}`);
  if (!kid) return null;
  let message = null;
  if (m[3]) { const b = b32ToBytes(m[3].toUpperCase()); if (b) { try { message = new TextDecoder('utf-8', { fatal: true }).decode(b); } catch { } } }
  return { ...kid, message };
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
    p: Object.fromEntries(Object.entries(kid.progress || {}).map(([k, p]) => [idx(k), [p.bestStars, p.attempts, p.correct, p.total, p.lastPlayed ? min(p.lastPlayed) : 0]])),
    s: (kid.sessions || []).slice(-80).map(s => [min(s.ts), idx(s.planetId), s.correct, s.total, s.moodBefore || 0, s.moodAfter || 0, s.tips || 0, s.durationSec || 0]),
    e: (kid.errors || []).slice(-120).map(e => [min(e.ts), idx(e.planetId), e.type, e.task, e.given, e.expected]),
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
    progress: Object.fromEntries(Object.entries(o.p || {}).filter(([i]) => pid(i)).map(([i, a]) => [pid(i), { bestStars: a[0], attempts: a[1], correct: a[2], total: a[3], lastPlayed: a[4] ? iso(a[4]) : null }])),
    sessions: (o.s || []).filter(a => pid(a[1])).map(a => ({ ts: iso(a[0]), planetId: pid(a[1]), correct: a[2], total: a[3], stars: a[3] ? (a[2] / a[3] >= 1 ? 3 : a[2] / a[3] >= .9 ? 2 : a[2] / a[3] >= .7 ? 1 : 0) : 0, moodBefore: a[4] || null, moodAfter: a[5] || null, tips: a[6], durationSec: a[7] })),
    errors: (o.e || []).filter(a => pid(a[1])).map(a => ({ ts: iso(a[0]), planetId: pid(a[1]), type: String(a[2]), task: String(a[3]).slice(0, 60), given: String(a[4]).slice(0, 40), expected: String(a[5]).slice(0, 40) })),
  };
}
