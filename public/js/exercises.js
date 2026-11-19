// Aufgaben-Generatoren. Jede Aufgabe hat 4 Antworten; falsche Antworten sind
// gezielt nach typischen Fehlermustern gebaut. So weiß die App bei jedem Fehler,
// WELCHE Art Fehler passiert ist (Fehler-Radar).

import { TASKS_PER_MISSION } from './curriculum.js';

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const reverseDigits = n => (n >= 10 && n % 10 !== Math.floor(n / 10) % 10 && n < 100) ? Number(String(n).split('').reverse().join('')) : null;

// Baut 4 Antwortmöglichkeiten: richtige + typisierte Ablenker, aufgefüllt mit Zufallswerten.
function options(correct, distractors, filler) {
  const out = [{ label: String(correct), correct: true, type: null }];
  const seen = new Set([String(correct)]);
  for (const d of shuffle(distractors)) {
    if (out.length >= 4) break;
    if (d.v === null || d.v === undefined) continue;
    const key = String(d.v);
    if (seen.has(key) || (typeof d.v === 'number' && d.v < 0)) continue;
    seen.add(key); out.push({ label: key, correct: false, type: d.type });
  }
  let guard = 0;
  while (out.length < 4 && guard++ < 200) {
    const v = filler();
    const key = String(v);
    if (seen.has(key) || (typeof v === 'number' && v < 0)) continue;
    seen.add(key); out.push({ label: key, correct: false, type: 'sonstiges' });
  }
  return shuffle(out);
}
const numFiller = (c, spread = 5) => () => Math.max(0, c + rnd(-spread, spread));

// ---------- Mathe ----------
function mengen() {
  const n = rnd(1, 10);
  return {
    prompt: 'Wie viele Punkte siehst du?', speak: 'Wie viele Punkte siehst du?',
    visual: { type: 'tenframe', groups: [{ n, color: 'a' }] }, label: `Menge ${n}`,
    options: options(n, [{ v: n - 1, type: 'zaehlfehler' }, { v: n + 1, type: 'zaehlfehler' }, { v: n + 2, type: 'schaetzen' }, { v: n - 2, type: 'schaetzen' }], numFiller(n)),
    hint: { text: 'Tipp: Eine volle Reihe hat immer 5 Punkte. Zähle von 5 aus weiter!', visual: { type: 'tenframe', groups: [{ n, color: 'a' }], mark5: true } },
  };
}
function zerlegen() {
  const total = rnd(4, 10), a = rnd(0, total), c = total - a;
  return {
    prompt: `${total} = ${a} + ?`, speak: `${total} ist gleich ${a} plus wie viel?`,
    visual: { type: 'house', total, a }, label: `${total} = ${a} + _`,
    options: options(c, [{ v: c + 1, type: 'zaehlfehler' }, { v: c - 1, type: 'zaehlfehler' }, { v: total, type: 'zerlegung' }, { v: a !== c ? a : null, type: 'zerlegung' }, { v: total + a, type: 'operation' }], numFiller(c, 4)),
    hint: { text: `Lege ${total} Plättchen. ${a} sind schon blau – wie viele sind noch übrig?`, visual: { type: 'tenframe', groups: [{ n: a, color: 'a' }, { n: c, color: 'empty' }] } },
  };
}
function plus10() {
  const a = rnd(1, 9), b = rnd(1, 10 - a), c = a + b;
  return {
    prompt: `${a} + ${b} = ?`, speak: `${a} plus ${b}`, visual: { type: 'big' }, label: `${a} + ${b}`,
    options: options(c, [{ v: c + 1, type: 'zaehlfehler' }, { v: c - 1, type: 'zaehlfehler' }, { v: Math.abs(a - b), type: 'operation' }], numFiller(c, 3)),
    hint: { text: `Blaue Punkte: ${a}, orange Punkte: ${b}. Wie viele zusammen?`, visual: { type: 'tenframe', groups: [{ n: a, color: 'a' }, { n: b, color: 'b' }] } },
  };
}
function minus10() {
  const a = rnd(2, 10), b = rnd(1, a), c = a - b;
  return {
    prompt: `${a} − ${b} = ?`, speak: `${a} minus ${b}`, visual: { type: 'big' }, label: `${a} − ${b}`,
    options: options(c, [{ v: c + 1, type: 'zaehlfehler' }, { v: c - 1, type: 'zaehlfehler' }, { v: a + b, type: 'operation' }], numFiller(c, 3)),
    hint: { text: `Von ${a} Punkten werden ${b} weggenommen (durchgestrichen). Wie viele bleiben?`, visual: { type: 'tenframe', groups: [{ n: c, color: 'a' }, { n: b, color: 'gone' }] } },
  };
}
function plus20() {
  const a = rnd(3, 9), b = rnd(11 - a, 9), c = a + b, toTen = 10 - a;
  return {
    prompt: `${a} + ${b} = ?`, speak: `${a} plus ${b}`, visual: { type: 'big' }, label: `${a} + ${b}`,
    options: options(c, [{ v: c + 1, type: 'zaehlfehler' }, { v: c - 1, type: 'zaehlfehler' }, { v: c - 10, type: 'stellenwert' }, { v: c + 10, type: 'stellenwert' }, { v: reverseDigits(c), type: 'zahlendreher' }, { v: Math.abs(b - a), type: 'operation' }], numFiller(c, 4)),
    hint: { text: `Erst bis zur 10: ${a} + ${toTen} = 10. Dann noch ${b - toTen} dazu.`, visual: { type: 'tenframe2', groups: [{ n: a, color: 'a' }, { n: b, color: 'b' }] } },
  };
}
function minus20() {
  const a = rnd(11, 18), b = rnd(a - 9, 9), c = a - b, toTen = a - 10;
  return {
    prompt: `${a} − ${b} = ?`, speak: `${a} minus ${b}`, visual: { type: 'big' }, label: `${a} − ${b}`,
    options: options(c, [{ v: c + 1, type: 'zaehlfehler' }, { v: c - 1, type: 'zaehlfehler' }, { v: c + 10, type: 'stellenwert' }, { v: reverseDigits(a + b), type: 'zahlendreher' }, { v: a + b, type: 'operation' }], numFiller(c, 4)),
    hint: { text: `Erst zurück bis zur 10: ${a} − ${toTen} = 10. Dann noch ${b - toTen} weg.`, visual: { type: 'tenframe2', groups: [{ n: c, color: 'a' }, { n: b, color: 'gone' }] } },
  };
}
function malTask(n, k) {
  const c = n * k;
  const [x, y] = Math.random() < 0.5 ? [k, n] : [n, k];
  return {
    prompt: `${x} × ${y} = ?`, speak: `${x} mal ${y}`, visual: { type: 'big' }, label: `${x} × ${y}`,
    options: options(c, [
      { v: n * (k - 1) || null, type: 'nachbaraufgabe' }, { v: n * (k + 1), type: 'nachbaraufgabe' },
      { v: (n - 1) * k || null, type: 'nachbaraufgabe' }, { v: n + k, type: 'operation' },
      { v: reverseDigits(c), type: 'zahlendreher' }, { v: c + 1, type: 'zaehlfehler' },
    ], numFiller(c, Math.max(3, n))),
    hint: { text: k > 1 ? `${x} × ${y}: Das sind ${x} Reihen mit je ${y} Punkten. Tipp: ${k - 1} × ${n} = ${(k - 1) * n}, dann noch ${n} dazu.` : `Etwas 1-mal ist immer die Zahl selbst!`, visual: { type: 'array', rows: x, cols: y } },
  };
}
function geteilt() {
  const n = rnd(2, 10), k = rnd(1, 10), t = n * k;
  return {
    prompt: `${t} : ${n} = ?`, speak: `${t} geteilt durch ${n}`, visual: { type: 'big' }, label: `${t} : ${n}`,
    options: options(k, [{ v: k + 1, type: 'nachbaraufgabe' }, { v: k - 1 || null, type: 'nachbaraufgabe' }, { v: t - n, type: 'operation' }, { v: reverseDigits(k), type: 'zahlendreher' }], numFiller(k, 3)),
    hint: { text: `Denk an die Malaufgabe: ? × ${n} = ${t}`, visual: { type: 'array', rows: k, cols: n } },
  };
}

// ---------- Lesen & Schreiben ----------
// s = Silben (für Silbenfärbung und Silben-Planet)
export const WORDS = [
  ['Haus', '🏠'], ['Maus', '🐭'], ['Sonne', '☀️', 'Son-ne'], ['Mond', '🌙'], ['Ball', '⚽'], ['Apfel', '🍎', 'Ap-fel'],
  ['Banane', '🍌', 'Ba-na-ne'], ['Tomate', '🍅', 'To-ma-te'], ['Fisch', '🐟'], ['Hund', '🐶'], ['Katze', '🐱', 'Kat-ze'],
  ['Rakete', '🚀', 'Ra-ke-te'], ['Stern', '⭐'], ['Baum', '🌳'], ['Blume', '🌸', 'Blu-me'], ['Auto', '🚗', 'Au-to'],
  ['Igel', '🦔', 'I-gel'], ['Ente', '🦆', 'En-te'], ['Elefant', '🐘', 'E-le-fant'], ['Löwe', '🦁', 'Lö-we'],
  ['Schokolade', '🍫', 'Scho-ko-la-de'], ['Giraffe', '🦒', 'Gi-raf-fe'], ['Krokodil', '🐊', 'Kro-ko-dil'],
  ['Pinguin', '🐧', 'Pin-gu-in'], ['Schmetterling', '🦋', 'Schmet-ter-ling'], ['Kuchen', '🍰', 'Ku-chen'], ['Brot', '🍞'],
  ['Nase', '👃', 'Na-se'], ['Ohr', '👂'], ['Zug', '🚂'], ['Schiff', '🚢'], ['Buch', '📖'], ['Hut', '🎩'], ['Ei', '🥚'],
  ['Kerze', '🕯️', 'Ker-ze'], ['Ananas', '🍍', 'A-na-nas'], ['Biene', '🐝', 'Bie-ne'], ['Delfin', '🐬', 'Del-fin'],
  ['Tiger', '🐯', 'Ti-ger'], ['Pilz', '🍄'], ['Kirsche', '🍒', 'Kir-sche'], ['Zitrone', '🍋', 'Zi-tro-ne'],
  ['Erdbeere', '🍓', 'Erd-bee-re'], ['Karotte', '🥕', 'Ka-rot-te'], ['Schnecke', '🐌', 'Schne-cke'], ['Frosch', '🐸'],
  ['Schaf', '🐑'], ['Kuh', '🐮'], ['Vogel', '🐦', 'Vo-gel'], ['Wal', '🐳'], ['Drache', '🐉', 'Dra-che'], ['Bär', '🐻'],
  ['Gabel', '🍴', 'Ga-bel'], ['Lampe', '💡', 'Lam-pe'], ['Suppe', '🍲', 'Sup-pe'], ['Raupe', '🐛', 'Rau-pe'],
  ['Radio', '📻', 'Ra-di-o'], ['Kleid', '👗'], ['Pudel', '🐩', 'Pu-del'], ['Nudel', '🍝', 'Nu-del'], ['Robbe', '🦭', 'Rob-be'],
  ['Adler', '🦅', 'Ad-ler'], ['Dose', '🥫', 'Do-se'], ['Rose', '🌹', 'Ro-se'], ['Hose', '👖', 'Ho-se'], ['Tisch', '🪑'],
  ['Hase', '🐰', 'Ha-se'], ['Vase', '🏺', 'Va-se'], ['Hand', '✋'], ['Kanne', '🫖', 'Kan-ne'], ['Tanne', '🌲', 'Tan-ne'],
  ['Mund', '👄'], ['Schuh', '👟'], ['Bein', '🦵'], ['Stein', '🪨'], ['Schwein', '🐷'], ['Wurst', '🌭'], ['Zelt', '⛺'],
  ['Geld', '💰'], ['Gurke', '🥒', 'Gur-ke'], ['Melone', '🍉', 'Me-lo-ne'], ['Pizza', '🍕', 'Piz-za'], ['Tasse', '☕', 'Tas-se'],
  ['Wolke', '☁️', 'Wol-ke'], ['Lupe', '🔍', 'Lu-pe'], ['Dino', '🦕', 'Di-no'], ['Mütze', '🧢', 'Müt-ze'], ['Fuchs', '🦊'],
  ['Ziege', '🐐', 'Zie-ge'], ['Gans', '🪿'], ['Taxi', '🚕', 'Ta-xi'], ['Besen', '🧹', 'Be-sen'], ['Kamel', '🐫', 'Ka-mel'],
].map(([w, e, s]) => ({ w, e, s: s ? s.split('-') : [w] }));
const WORD = Object.fromEntries(WORDS.map(x => [x.w, x]));
export const syllablesOf = w => WORD[w]?.s || null;

const LAUT_AEHNLICH = { B: ['P', 'D'], P: ['B'], D: ['T', 'B'], T: ['D'], G: ['K'], K: ['G'], F: ['W', 'V'], W: ['F', 'V'], V: ['F', 'W'], M: ['N'], N: ['M'], S: ['Z'], Z: ['S'], E: ['I'], I: ['E', 'Ü'], O: ['U'], U: ['O'], L: ['R'], R: ['L'], H: ['K'] };
const LETTERS = 'ABDEFGHIKLMNOPRSTUWZ'.split('');

function anlaut() {
  const pool = WORDS.filter(x => !/^(Sch|St|Sp|Ei|Au|Eu|Ch|Qu|Pf|Ä|Ö|Ü)/.test(x.w));
  const word = pick(pool), first = word.w[0];
  const opts = options(first, (LAUT_AEHNLICH[first] || []).map(v => ({ v, type: 'laut_aehnlich' })), () => pick(LETTERS));
  return {
    prompt: `Mit welchem Buchstaben beginnt das Wort?`, speak: `Mit welchem Buchstaben beginnt ${word.w}?`,
    visual: { type: 'emoji', emoji: word.e, say: word.w }, label: word.w,
    options: opts.map(o => ({ ...o, label: `${o.label} ${o.label.toLowerCase()}` })),
    hint: { text: 'Sprich das Wort ganz langsam und gedehnt. Was hörst du ganz am Anfang?', sayslow: word.w },
  };
}
function vokale() {
  const VOW = 'aeiou';
  const cands = [];
  for (const x of WORDS) {
    const lw = x.w.toLowerCase();
    for (let i = 0; i < lw.length; i++) {
      if (VOW.includes(lw[i]) && !VOW.includes(lw[i - 1] || '') && !VOW.includes(lw[i + 1] || '') && lw[i + 1] !== 'h' && i > 0) cands.push([x, i]);
    }
  }
  const [word, i] = pick(cands);
  const v = word.w[i];
  return {
    prompt: 'Welcher Buchstabe fehlt?', speak: `Welcher Buchstabe fehlt bei ${word.w}?`,
    visual: { type: 'emoji', emoji: word.e, say: word.w, gap: [word.w.slice(0, i), word.w.slice(i + 1)] }, label: word.w,
    options: options(v, VOW.split('').filter(x => x !== v).map(x => ({ v: x, type: 'vokal' })), () => pick(VOW)),
    hint: { text: 'Sprich das Wort langsam. Welchen Selbstlaut hörst du in der Lücke?', sayslow: word.w },
  };
}
function silben() {
  const word = pick(WORDS.filter(x => x.w !== 'Ei'));
  const n = word.s.length;
  return {
    prompt: 'Wie viele Silben hat das Wort?', speak: `Wie viele Silben hat ${word.w}? Klatsche mit!`,
    visual: { type: 'emoji', emoji: word.e, say: word.w, word: word.w }, label: word.w,
    options: options(n, [1, 2, 3, 4, 5].filter(x => x !== n).map(v => ({ v, type: 'silben' })), () => rnd(1, 5)),
    hint: { text: 'Klatsche bei jeder Silbe einmal in die Hände:', syllables: word.s, saysyll: word.s },
  };
}
const RHYMES = [['Haus', 'Maus', 'Laus'], ['Hund', 'Mund', 'bunt'], ['Baum', 'Traum', 'Schaum'], ['Hose', 'Rose', 'Dose'], ['Tanne', 'Kanne', 'Pfanne'], ['Fisch', 'Tisch'], ['Stein', 'Bein', 'Schwein'], ['Hand', 'Sand', 'Wand'], ['Hase', 'Nase', 'Vase'], ['Ball', 'Stall', 'Knall'], ['Katze', 'Tatze', 'Mütze'], ['Sonne', 'Tonne'], ['Schnecke', 'Decke', 'Ecke'], ['Zelt', 'Geld', 'Welt'], ['Schuh', 'Kuh'], ['Wurst', 'Durst'], ['Nudel', 'Pudel', 'Strudel'], ['Kuchen', 'suchen'], ['Lupe', 'Suppe'], ['Gans', 'Tanz']];
// Hinweis: Katze/Mütze und Lupe/Suppe sind unreine Reime -> werden nicht als Paar genutzt
const PURE = RHYMES.filter(g => !g.includes('Mütze') && !g.includes('Lupe'));
const allRhymeWords = RHYMES.flat();
function reime() {
  const g = pick(PURE), [target, match] = shuffle(g);
  const sameStart = allRhymeWords.filter(w => w[0].toLowerCase() === target[0].toLowerCase() && !g.includes(w));
  const others = allRhymeWords.filter(w => !g.includes(w));
  const dist = [...(sameStart.length ? [{ v: pick(sameStart), type: 'anlaut_statt_reim' }] : []), ...shuffle(others).slice(0, 4).map(v => ({ v, type: 'reim' }))];
  const opts = options(match, dist, () => pick(others));
  return {
    prompt: `Was reimt sich auf „${target}“?`, speak: `Was reimt sich auf ${target}?`,
    visual: { type: 'emoji', emoji: WORD[target]?.e || '🎵', say: target, word: target }, label: target,
    options: opts.map(o => ({ ...o, emoji: WORD[o.label]?.e })), sayOptions: true,
    hint: { text: `Hör auf das Ende: ${target} – klingt eins der Wörter am Ende genauso?`, sayslow: target },
  };
}
const MIRROR = ['b', 'd', 'p', 'q'];
const MERK = { b: 'b wie Ball', d: 'd wie Dino', p: 'p wie Pizza', q: 'q wie Qualle' };
function bdpq() {
  if (Math.random() < 0.5) {
    const l = pick(MIRROR);
    return {
      prompt: `Tippe auf das „${l}“`, speak: `Tippe auf das ${MERK[l]}`, visual: { type: 'none' }, label: `Buchstabe ${l}`,
      options: options(l, MIRROR.filter(x => x !== l).map(v => ({ v, type: 'spiegel' })), () => pick(MIRROR)).map(o => ({ ...o, big: true })),
      hint: { text: 'Merkhilfe: Beim „b“ kommt erst der Strich, dann der Bauch – wie bei b-a-u-ch. Beim „d“ kommt erst der Bauch, dann der Strich.' },
    };
  }
  const pool = WORDS.filter(x => /[bdpq]/.test(x.w.slice(1)));
  const word = pick(pool);
  const idxs = [...word.w].map((c, i) => (i > 0 && MIRROR.includes(c) ? i : -1)).filter(i => i >= 0);
  const i = pick(idxs);
  const variants = MIRROR.filter(c => c !== word.w[i]).map(c => ({ v: word.w.slice(0, i) + c + word.w.slice(i + 1), type: 'spiegel' }));
  return {
    prompt: 'Welches Wort ist richtig geschrieben?', speak: `Welches Wort ist richtig geschrieben? ${word.w}`,
    visual: { type: 'emoji', emoji: word.e, say: word.w }, label: word.w,
    options: options(word.w, variants, () => word.w),
    hint: { text: 'Schau dir die Buchstaben b, d, p und q ganz genau an. Wohin zeigt der Bauch?' },
  };
}
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function lesen() {
  const word = pick(WORDS);
  const similar = WORDS.filter(x => x !== word && (lev(x.w.toLowerCase(), word.w.toLowerCase()) <= 2 || (x.w[0] === word.w[0] && Math.abs(x.w.length - word.w.length) <= 1)));
  const others = WORDS.filter(x => x !== word);
  const dist = [...shuffle(similar).slice(0, 2).map(x => ({ v: x.e, type: 'aehnliches_wort', w: x.w })), ...shuffle(others).slice(0, 3).map(x => ({ v: x.e, type: 'sonstiges', w: x.w }))];
  const opts = options(word.e, dist, () => pick(others).e).map(o => ({ ...o, big: true, display: o.label, label: o.correct ? word.w : (WORDS.find(x => x.e === o.label)?.w || o.label) }));
  return {
    prompt: 'Lies das Wort. Welches Bild passt?', speak: 'Lies das Wort. Welches Bild passt?',
    visual: { type: 'word', word: word.w }, label: word.w, options: opts, noSpeakWord: true,
    hint: { text: 'Lies Silbe für Silbe:', syllables: word.s, saysyll: word.s },
  };
}
function schreiben() {
  const word = pick(WORDS.filter(x => x.w.length >= 4));
  const w = word.w, d = [];
  const i = rnd(1, w.length - 2);
  if (w[i] !== w[i + 1]) d.push({ v: w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2), type: 'dreher' });
  const j = rnd(1, w.length - 1);
  d.push({ v: w.slice(0, j) + w.slice(j + 1), type: 'auslassung' });
  const SWAP = { b: 'd', d: 'b', p: 'b', t: 'd', g: 'k', k: 'g', e: 'i', i: 'e', o: 'u', u: 'o', a: 'e', m: 'n', n: 'm', l: 'r', r: 'l' };
  const typeOf = (a, b) => (['b', 'd', 'p', 'q'].includes(a) && ['b', 'd', 'p', 'q'].includes(b) ? 'spiegel' : 'aeiou'.includes(a) ? 'vokal' : 'laut_aehnlich');
  for (const k of shuffle([...Array(w.length).keys()].slice(1))) {
    const c = w[k];
    if (SWAP[c]) { d.push({ v: w.slice(0, k) + SWAP[c] + w.slice(k + 1), type: typeOf(c, SWAP[c]) }); if (d.length >= 4) break; }
  }
  return {
    prompt: 'Welches Wort ist richtig geschrieben?', speak: `Welches Wort ist richtig geschrieben? ${w}`,
    visual: { type: 'emoji', emoji: word.e, say: w }, label: w,
    options: options(w, d, () => w.slice(0, -1) + pick('aeinrst')),
    hint: { text: 'Sprich das Wort in Silben und vergleiche jeden Buchstaben:', syllables: word.s, saysyll: word.s },
  };
}

const GEN = { mengen, zerlegen, plus10, minus10, plus20, minus20, geteilt, anlaut, vokale, silben, reime, bdpq, lesen, schreiben };

export function generateMission(planetId, count = TASKS_PER_MISSION) {
  const tasks = [];
  const m = /^mal(\d+)$/.exec(planetId);
  if (m) {
    const n = Number(m[1]);
    const ks = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (let i = 0; i < count; i++) tasks.push(malTask(n, ks[i % 10]));
    return tasks;
  }
  const gen = planetId === 'malmix' ? () => malTask(rnd(2, 10), rnd(2, 10)) : GEN[planetId];
  if (!gen) throw new Error('Unbekannter Planet: ' + planetId);
  const labels = new Set();
  let guard = 0;
  while (tasks.length < count && guard++ < 300) {
    const t = gen();
    if (labels.has(t.label) && guard < 250) continue; // möglichst keine Wiederholungen
    labels.add(t.label); tasks.push(t);
  }
  return tasks;
}
