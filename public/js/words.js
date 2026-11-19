// Lernwörter: Übungen aus eigenen Wortlisten (von der Coachin, der Schule oder selbst eingetragen).
// Wörter können mit Bindestrich in Silben getrennt eingegeben werden (Ta-fel) → farbige Silben.
import { rnd, pick, shuffle, options } from './util.js';

export const cleanWord = w => String(w || '').replace(/-/g, '').trim();
export const syllablesOfCustom = w => (String(w).includes('-') ? String(w).split('-').filter(Boolean) : null);
export function parseWordInput(text) {
  return [...new Set(String(text || '').split(/[\n,;]+/).map(s => s.trim().replace(/\s+/g, ' ')).filter(s => s && s.length <= 30 && /\p{L}/u.test(s)))].slice(0, 60);
}

// Typische Rechtschreibfehler als falsche Antworten (mit Fehlertyp fürs Fehler-Radar)
const SWAPS = [
  [/ie/, 'i', 'ie_i'], [/(?<![ie])i(?!e)/, 'ie', 'ie_i'], [/ß/, 'ss', 's_laute'], [/ss/, 'ß', 's_laute'], [/ß/, 's', 's_laute'],
  [/ck/, 'k', 'doppelkonsonant'], [/tz/, 'z', 'doppelkonsonant'], [/([bdfglmnprt])\1/, '$1', 'doppelkonsonant'],
  [/äu/, 'eu', 'vokal'], [/ä/, 'e', 'vokal'], [/ö/, 'ö', null], [/eu/, 'äu', 'vokal'],
  [/([aeiouäöü])h/, '$1', 'dehnung'], [/d$/, 't', 'laut_aehnlich'], [/t$/, 'd', 'laut_aehnlich'], [/g$/, 'k', 'laut_aehnlich'],
  [/b/, 'd', 'spiegel'], [/d/, 'b', 'spiegel'], [/p/, 'b', 'laut_aehnlich'], [/v/, 'f', 'laut_aehnlich'], [/^V/, 'F', 'laut_aehnlich'], [/ei/, 'ie', 'dreher'],
];
export function spellingVariants(word) {
  const w = cleanWord(word), out = [];
  for (const [re, rep, type] of SWAPS) { if (!type) continue; const v = w.replace(re, rep); if (v !== w) out.push({ v, type }); }
  if (w.length >= 4) {
    const i = rnd(1, w.length - 3);
    if (w[i] !== w[i + 1]) out.push({ v: w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2), type: 'dreher' });
    const j = rnd(1, w.length - 2); out.push({ v: w.slice(0, j) + w.slice(j + 1), type: 'auslassung' });
  }
  const k = [...w].findIndex((c, idx) => idx > 0 && /[bcdfgklmnprstz]/.test(c) && !/[bcdfgklmnprstz]/.test(w[idx - 1] || ''));
  if (k > 0 && w[k] !== w[k + 1]) out.push({ v: w.slice(0, k) + w[k] + w.slice(k), type: 'doppelkonsonant' });
  return shuffle(out).filter((x, i, a) => a.findIndex(y => y.v === x.v) === i);
}

// Lückenwort: die „knifflige Stelle“ des Wortes wird zur Lücke
const TRICKY = [['ie', ['ie', 'i', 'ih'], 'ie_i'], ['ß', ['ß', 'ss', 's'], 's_laute'], ['ss', ['ss', 'ß', 's'], 's_laute'], ['ck', ['ck', 'k', 'kk'], 'doppelkonsonant'], ['tz', ['tz', 'z', 'zz'], 'doppelkonsonant'],
  ['äu', ['äu', 'eu', 'oi'], 'vokal'], ['eu', ['eu', 'äu', 'oi'], 'vokal'], ['ä', ['ä', 'e', 'a'], 'vokal'], ['ah', ['ah', 'a', 'aa'], 'dehnung'], ['eh', ['eh', 'e', 'ee'], 'dehnung'], ['oh', ['oh', 'o', 'oo'], 'dehnung'], ['uh', ['uh', 'u', 'uu'], 'dehnung'],
  ['v', ['v', 'f', 'w'], 'laut_aehnlich'], ['pf', ['pf', 'f', 'p'], 'laut_aehnlich'], ['sch', ['sch', 'sh', 'ch'], 'laut_aehnlich'], ['ei', ['ei', 'ai', 'ie'], 'vokal']];
function gapTask(word) {
  const w = cleanWord(word), lw = w.toLowerCase();
  let hit = null;
  for (const [seg, alts, type] of TRICKY) { const i = lw.indexOf(seg, seg.length === 1 ? 0 : 0); if (i >= 0) { hit = { i, len: seg.length, alts, type }; break; } }
  if (!hit) { const m = /([bdfglmnprt])\1/.exec(lw); if (m) hit = { i: m.index, len: 2, alts: [m[0], m[1], m[1] + 'h'], type: 'doppelkonsonant' }; }
  if (!hit) {
    const vs = [...lw].map((c, i) => ('aeiouäöü'.includes(c) && i > 0 ? i : -1)).filter(i => i >= 0);
    if (!vs.length) return null;
    const i = pick(vs); hit = { i, len: 1, alts: [lw[i], ...'aeiou'.split('').filter(x => x !== lw[i])].slice(0, 4), type: 'vokal' };
  }
  const right = w.slice(hit.i, hit.i + hit.len);
  const fixCase = s => (right[0] === right[0].toUpperCase() && right[0] !== right[0].toLowerCase() ? s[0].toUpperCase() + s.slice(1) : s);
  return {
    prompt: 'Was gehört in die Lücke?', speak: `Was gehört in die Lücke? ${w}`, label: w,
    visual: { type: 'gapword', before: w.slice(0, hit.i), after: w.slice(hit.i + hit.len), say: w },
    options: shuffle([...new Set(hit.alts.map(fixCase))].map(o => ({ label: o, correct: o === right, type: o === right ? null : hit.type }))).filter((o, i, a) => a.findIndex(x => x.label === o.label) === i),
    hint: { text: 'Sprich das Wort langsam und deutlich. Hörst du den Laut lang oder kurz? Denk an die Regel, die ihr geübt habt.', sayslow: w },
  };
}
function listenTask(word) {
  const w = cleanWord(word);
  return {
    prompt: 'Hör genau hin: Welches Wort ist richtig geschrieben?', speak: w, label: w,
    visual: { type: 'listen', say: w },
    options: options(w, spellingVariants(word), () => w.slice(0, -1) + pick('aeinrst')),
    hint: { text: 'Hör dir das Wort noch einmal an und sprich es in Silben mit. Vergleiche dann jede Antwort Buchstabe für Buchstabe.', sayslow: w, syllables: syllablesOfCustom(word) || undefined },
  };
}
function lookTask(word) {
  const w = cleanWord(word);
  return {
    prompt: 'Welches Wort ist richtig geschrieben?', speak: `Welches Wort ist richtig geschrieben? ${w}`, label: w,
    visual: { type: 'none' },
    options: options(w, spellingVariants(word), () => w.slice(0, -1) + pick('aeinrst')),
    hint: { text: 'Lies jedes Wort langsam, Silbe für Silbe. Welches sieht genau so aus wie auf deiner Lernwörter-Liste?', syllables: syllablesOfCustom(word) || undefined },
  };
}

/** Mission aus einer Wortliste (10 Aufgaben, alle Wörter kommen dran). */
export function wordMission(words, count = 10) {
  const list = words.filter(w => cleanWord(w).length >= 2);
  if (!list.length) return [];
  const order = []; while (order.length < count) order.push(...shuffle(list));
  return order.slice(0, count).map((w, i) => {
    const kind = i % 3;
    const t = kind === 0 ? listenTask(w) : kind === 1 ? (gapTask(w) || listenTask(w)) : lookTask(w);
    if (t.options.length < 2) return listenTask(w);
    return t;
  });
}
