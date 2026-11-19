// Aufgaben für Volksschule 3.–4. Klasse und Unterstufe (5.–8. Schulstufe).
// Wie bei den Grundlagen gehört jeder falsche Antwortvorschlag zu einem Fehlermuster.
import { rnd, pick, shuffle, reverseDigits, options, numFiller } from './util.js';
import { WORDS } from './exercises.js';

const M = '−'; // echtes Minuszeichen
const fmt = n => (n < 0 ? M + Math.abs(n) : String(n));
const par = n => (n < 0 ? `(${fmt(n)})` : String(n));
const dec = n => String(Math.round(n * 1000) / 1000).replace('.', ',');
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (z, n) => { const g = gcd(z, n); return `${z / g}/${n / g}`; };
const until = (gen, ok) => { for (let i = 0; i < 500; i++) { const v = gen(); if (ok(v)) return v; } return gen(); };
const NAMES = ['Mia', 'Ben', 'Lea', 'Tim', 'Emma', 'Noah', 'Lina', 'Paul', 'Sara', 'Elias', 'Anna', 'Jonas'];
const steps = t => ({ text: t });

// ================= Volksschule 3.–4.: Rechnen =================
function plus100() {
  const [a, b] = until(() => [rnd(12, 79), rnd(12, 69)], ([a, b]) => a % 10 + b % 10 >= 10 && a + b <= 100);
  const c = a + b, bz = b - (b % 10);
  return {
    prompt: `${a} + ${b} = ?`, speak: `${a} plus ${b}`, visual: { type: 'big' }, label: `${a} + ${b}`,
    options: options(c, [{ v: c - 10, type: 'uebertrag' }, { v: c + 10, type: 'stellenwert' }, { v: c + 1, type: 'zaehlfehler' }, { v: c - 1, type: 'zaehlfehler' }, { v: reverseDigits(c), type: 'zahlendreher' }], numFiller(c, 12)),
    hint: steps(`Erst die Zehner: ${a} + ${bz} = ${a + bz}. Dann die Einer: ${a + bz} + ${b % 10} = ? Achtung, dabei springst du über einen Zehner!`),
  };
}
function minus100() {
  const [a, b] = until(() => [rnd(31, 99), rnd(12, 68)], ([a, b]) => a % 10 < b % 10 && a - b >= 5);
  const c = a - b, bz = b - (b % 10);
  const digitwise = (Math.floor(a / 10) - Math.floor(b / 10)) * 10 + Math.abs(a % 10 - b % 10);
  return {
    prompt: `${a} ${M} ${b} = ?`, speak: `${a} minus ${b}`, visual: { type: 'big' }, label: `${a} − ${b}`,
    options: options(c, [{ v: digitwise, type: 'uebertrag' }, { v: c + 10, type: 'uebertrag' }, { v: c + 1, type: 'zaehlfehler' }, { v: c - 1, type: 'zaehlfehler' }, { v: reverseDigits(c), type: 'zahlendreher' }], numFiller(c, 12)),
    hint: steps(`Erst die Zehner weg: ${a} ${M} ${bz} = ${a - bz}. Dann die Einer: ${a - bz} ${M} ${b % 10} = ? Tipp: Rechne zuerst bis zum vollen Zehner zurück.`),
  };
}
function plus1000() {
  const [a, b] = until(() => [rnd(105, 689), rnd(105, 389)], ([a, b]) => a + b < 1000 && (a % 10 + b % 10 >= 10 || a % 100 + b % 100 >= 100));
  const c = a + b;
  return {
    prompt: `${a} + ${b} = ?`, speak: `${a} plus ${b}`, visual: { type: 'big' }, label: `${a} + ${b}`,
    options: options(c, [{ v: c - 10, type: 'uebertrag' }, { v: c - 100, type: 'uebertrag' }, { v: c + 100, type: 'stellenwert' }, { v: c + 1, type: 'zaehlfehler' }], numFiller(c, 20)),
    hint: steps(`Zerlege in Hunderter, Zehner und Einer: ${a} + ${b - (b % 100)} = ${a + b - (b % 100)}, dann noch + ${b % 100}. Vergiss den Übertrag nicht!`),
  };
}
function minus1000() {
  const [a, b] = until(() => [rnd(300, 990), rnd(105, 489)], ([a, b]) => a - b > 50 && (a % 10 < b % 10 || a % 100 < b % 100));
  const c = a - b;
  return {
    prompt: `${a} ${M} ${b} = ?`, speak: `${a} minus ${b}`, visual: { type: 'big' }, label: `${a} − ${b}`,
    options: options(c, [{ v: c + 10, type: 'uebertrag' }, { v: c + 100, type: 'uebertrag' }, { v: c - 100, type: 'stellenwert' }, { v: c - 1, type: 'zaehlfehler' }], numFiller(c, 20)),
    hint: steps(`Schrittweise: ${a} ${M} ${b - (b % 100)} = ${a - b + (b % 100)}, dann noch ${M} ${b % 100}.`),
  };
}
function malzehner() {
  const a = rnd(2, 9), z = rnd(2, 9) * 10, c = a * z;
  const [x, y] = Math.random() < .5 ? [a, z] : [z, a];
  return {
    prompt: `${x} × ${y} = ?`, speak: `${x} mal ${y}`, visual: { type: 'big' }, label: `${x} × ${y}`,
    options: options(c, [{ v: c / 10, type: 'stellenwert' }, { v: c * 10, type: 'stellenwert' }, { v: a * (z + 10), type: 'nachbaraufgabe' }, { v: a * (z - 10), type: 'nachbaraufgabe' }, { v: a + z, type: 'operation' }], numFiller(c, 30)),
    hint: steps(`Rechne erst ohne Null: ${a} × ${z / 10} = ${c / 10}. Dann hängst du die Null wieder an.`),
  };
}
function halbschriftlich() {
  const a = until(() => rnd(12, 49), v => v % 10 !== 0), b = rnd(3, 9), c = a * b, t = a - (a % 10), e = a % 10;
  return {
    prompt: `${a} × ${b} = ?`, speak: `${a} mal ${b}`, visual: { type: 'big' }, label: `${a} × ${b}`,
    options: options(c, [{ v: t * b + e, type: 'teilprodukt' }, { v: t * b, type: 'teilprodukt' }, { v: c + 10, type: 'stellenwert' }, { v: (a + 1) * b, type: 'nachbaraufgabe' }, { v: c - b, type: 'nachbaraufgabe' }], numFiller(c, 15)),
    hint: steps(`Zerlege ${a} in ${t} und ${e}: ${t} × ${b} = ${t * b} und ${e} × ${b} = ${e * b}. Zusammen: ${t * b} + ${e * b}.`),
  };
}
function divrest() {
  const d = rnd(3, 9), q = rnd(2, 9), r = rnd(1, d - 1), n = d * q + r;
  const L = (x, y) => `${x} R ${y}`;
  return {
    prompt: `${n} : ${d} = ?`, speak: `${n} geteilt durch ${d}`, visual: { type: 'big' }, label: `${n} : ${d}`,
    options: options(L(q, r), [{ v: L(q - 1, r + d), type: 'rest' }, { v: L(q, 0), type: 'rest' }, { v: L(q + 1, 0), type: 'rest' }, { v: L(q, r + 1 < d ? r + 1 : r - 1), type: 'rest' }, { v: L(q + 1, r), type: 'nachbaraufgabe' }], () => L(q + rnd(-2, 2), rnd(0, d - 1))),
    hint: steps(`Welche ${d}er-Zahl passt gerade noch in ${n}? ${q} × ${d} = ${q * d}. Was bleibt übrig? Der Rest muss immer kleiner als ${d} sein.`),
  };
}
const UNITS = [['m', 'cm', 100], ['cm', 'mm', 10], ['km', 'm', 1000], ['kg', 'g', 1000], ['h', 'min', 60], ['min', 's', 60], ['€', 'Cent', 100], ['l', 'ml', 1000], ['t', 'kg', 1000]];
function groessen() {
  const [from, to, f] = pick(UNITS), v = rnd(2, 9), c = v * f;
  const wrong = [10, 60, 100, 1000].filter(x => x !== f).map(x => ({ v: v * x, type: 'einheit' }));
  return {
    prompt: `${v} ${from} = ? ${to}`, speak: `${v} ${from} sind wie viele ${to}?`, visual: { type: 'big' }, label: `${v} ${from} in ${to}`,
    options: options(c, [...wrong, { v: v + f, type: 'operation' }], numFiller(c, f)),
    hint: steps(`Merke: 1 ${from} = ${f} ${to}. Also ist ${v} ${from} = ${v} × ${f} ${to}.`),
  };
}
function sachaufgaben() {
  const n = pick(NAMES), kind = rnd(0, 3);
  let text, a, b, c, op;
  if (kind === 0) { a = rnd(15, 48); b = rnd(12, 45); c = a + b; op = '+'; text = pick([`${n} hat ${a} Sticker. Zum Geburtstag bekommt ${n} noch ${b} dazu. Wie viele Sticker hat ${n} jetzt?`, `In der Bücherei stehen ${a} Comics. Heute kommen ${b} neue dazu. Wie viele Comics sind es jetzt?`]); }
  else if (kind === 1) { a = rnd(40, 95); b = rnd(12, a - 10); c = a - b; op = '−'; text = pick([`Im Bus sitzen ${a} Kinder. An der Schule steigen ${b} Kinder aus. Wie viele sitzen noch im Bus?`, `${n} hat ${a} € gespart und kauft ein Spiel für ${b} €. Wie viel Geld bleibt übrig?`]); }
  else if (kind === 2) { a = rnd(3, 9); b = rnd(3, 9); c = a * b; op = '×'; text = pick([`Ein Heft kostet ${a} €. ${n} kauft ${b} Hefte. Wie viel muss ${n} bezahlen?`, `In jeder Reihe stehen ${a} Stühle. Es gibt ${b} Reihen. Wie viele Stühle sind das?`]); }
  else { b = rnd(3, 9); c = rnd(3, 9); a = b * c; op = ':'; text = pick([`${a} Äpfel werden gerecht auf ${b} Körbe verteilt. Wie viele Äpfel kommen in jeden Korb?`, `${a} Kinder bilden Gruppen mit je ${b} Kindern. Wie viele Gruppen gibt es?`]); }
  const others = [{ v: a + b, type: 'operation' }, { v: Math.abs(a - b), type: 'operation' }, { v: a * b, type: 'operation' }, { v: c + 1, type: 'zaehlfehler' }, { v: c + 10, type: 'stellenwert' }];
  return {
    prompt: 'Wie lautet das Ergebnis?', speak: text, visual: { type: 'text', text }, label: `Sachaufgabe ${a} ${op} ${b}`,
    options: options(c, others, numFiller(c, 10)),
    hint: steps(`Was ist gesucht? Achte auf Signalwörter: „dazu“ → plus, „aussteigen / bleibt übrig“ → minus, „jede / je … mehrere“ → mal, „verteilen / Gruppen“ → geteilt. Hier passt: ${a} ${op} ${b}.`),
  };
}

// ================= Volksschule 3.–4.: Lesen & Schreiben =================
const NOMEN = ['hund', 'schule', 'garten', 'freund', 'apfel', 'buch', 'tisch', 'wald', 'fenster', 'lehrerin', 'fahrrad', 'pause', 'wolke', 'stift', 'mutter', 'brot', 'blume', 'zimmer'];
const NICHT_NOMEN = [['laufen', 'verb'], ['spielt', 'verb'], ['lacht', 'verb'], ['schläft', 'verb'], ['singen', 'verb'], ['malt', 'verb'], ['schnell', 'adj'], ['groß', 'adj'], ['lustig', 'adj'], ['müde', 'adj'], ['leise', 'adj'], ['warm', 'adj'], ['heute', 'x'], ['und', 'x'], ['sehr', 'x'], ['oft', 'x']];
function nomen() {
  const n = pick(NOMEN);
  return {
    prompt: 'Welches Wort schreibt man groß?', speak: 'Welches Wort schreibt man groß? Es ist ein Nomen.', visual: { type: 'none' }, label: n,
    options: options(n, shuffle(NICHT_NOMEN).map(([w]) => ({ v: w, type: 'grossklein' })), () => pick(NICHT_NOMEN)[0]),
    hint: steps('Nomen (Namenwörter) schreibt man groß. Probe: Kannst du „der“, „die“ oder „das“ davorsetzen? „der Hund“ ✔ – „der lacht“ ✘'),
  };
}
const DOPPEL = [['Sonne', '☀️'], ['Mutter', '👩'], ['Teller', '🍽️'], ['Puppe', '🪆'], ['Kanne', '🫖'], ['Wasser', '💧'], ['Himmel', '🌌'], ['Sommer', '🏖️'], ['Schiff', '🚢'], ['Ball', '⚽'], ['Koffer', '🧳'], ['Bett', '🛏️'], ['Tasse', '☕'], ['Hammer', '🔨'], ['Brille', '👓'], ['Zimmer', '🚪'], ['Kette', '📿'], ['Suppe', '🍲'], ['Pfanne', '🍳'], ['Robbe', '🦭']];
const EINFACH = [['Hose', '👖'], ['Blume', '🌸'], ['Rabe', '🐦‍⬛'], ['Tomate', '🍅'], ['Nase', '👃'], ['Vogel', '🐦'], ['Kino', '🎬'], ['Hut', '🎩'], ['Ofen', '🔥'], ['Esel', '🫏'], ['Gabel', '🍴']];
function variantsDoppel(w) {
  const m = /([bcdfgklmnprstz])\1/.exec(w);
  if (m) {
    const i = m.index;
    return [{ v: w.slice(0, i) + w.slice(i + 1), type: 'doppelkonsonant' }, { v: w.slice(0, i) + 'h' + w.slice(i + 1), type: 'dehnung' }, { v: w.slice(0, i + 2) + w[i] + w.slice(i + 2), type: 'doppelkonsonant' }];
  }
  const i = [...w].findIndex((ch, k) => k > 1 && /[bcdfgklmnprstz]/.test(ch));
  return [{ v: w.slice(0, i) + w[i] + w.slice(i), type: 'doppelkonsonant' }, { v: w.slice(0, i - 1) + w[i - 1] + 'h' + w.slice(i), type: 'dehnung' }, { v: w.slice(0, i - 1) + w[i - 1] + w[i - 1] + w.slice(i), type: 'dehnung' }];
}
function doppel() {
  const [w, e] = Math.random() < .65 ? pick(DOPPEL) : pick(EINFACH);
  return {
    prompt: 'Welches Wort ist richtig geschrieben?', speak: `Welches Wort ist richtig geschrieben? ${w}`, visual: { type: 'emoji', emoji: e, say: w }, label: w,
    options: options(w, variantsDoppel(w), () => w.slice(0, -1) + pick('aeinrst')),
    hint: steps('Sprich das Wort langsam. Ist der Selbstlaut davor kurz und schnell (Son-ne)? Dann kommt meist ein doppelter Mitlaut. Ist er lang (Ro-se)? Dann nur einer.'),
  };
}
const IE = [['Biene', '🐝'], ['Ziege', '🐐'], ['Brief', '✉️'], ['Spiegel', '🪞'], ['Wiese', '🌾'], ['Riese', '🧌'], ['Fliege', '🪰'], ['Tier', '🐾'], ['Papier', '📄'], ['Stiefel', '👢'], ['Dieb', '🦹'], ['Ziel', '🎯']];
const NUR_I = [['Igel', '🦔'], ['Tiger', '🐯'], ['Kino', '🎬'], ['Kind', '🧒'], ['Wind', '🌬️'], ['Fisch', '🐟'], ['Tisch', '🪑'], ['Kirsche', '🍒'], ['Pilz', '🍄'], ['Gift', '☠️'], ['Bild', '🖼️'], ['Krokodil', '🐊']];
function ie() {
  const isIe = Math.random() < .55;
  const [w, e] = pick(isIe ? IE : NUR_I);
  const d = isIe ? [{ v: w.replace('ie', 'i'), type: 'ie_i' }, { v: w.replace('ie', 'ih'), type: 'dehnung' }, { v: w.replace('ie', 'ii'), type: 'ie_i' }, { v: w.replace('ie', 'ei'), type: 'dreher' }]
    : (() => { const i = w.lastIndexOf('i') > 0 ? w.lastIndexOf('i') : w.indexOf('i'); return [{ v: w.slice(0, i) + 'ie' + w.slice(i + 1), type: 'ie_i' }, { v: w.slice(0, i) + 'ih' + w.slice(i + 1), type: 'dehnung' }, { v: w.slice(0, i) + 'ei' + w.slice(i + 1), type: 'dreher' }]; })();
  return {
    prompt: 'Welches Wort ist richtig geschrieben?', speak: `Welches Wort ist richtig geschrieben? ${w}`, visual: { type: 'emoji', emoji: e, say: w }, label: w,
    options: options(w, d, () => w + 'e'),
    hint: steps('Hör genau hin: Ein langes i (wie in Bi-ene) schreibt man meistens „ie“. Ein kurzes i (wie in Kind) schreibt man nur „i“.'),
  };
}
const MIT_H = [['Uhr', '⌚'], ['Kuh', '🐮'], ['Zahn', '🦷'], ['Huhn', '🐔'], ['Stuhl', '🪑'], ['Bohne', '🫘'], ['Sahne', '🍦'], ['Fahne', '🚩'], ['Ohr', '👂'], ['Schuh', '👟'], ['Höhle', '🕳️'], ['Mehl', '🌾'], ['Bahn', '🚆'], ['Floh', '🦟']];
const OHNE_H = [['Rose', '🌹'], ['Hose', '👖'], ['Tal', '🏞️'], ['Name', '📛'], ['Schal', '🧣'], ['Rad', '🛞'], ['Brot', '🍞'], ['Zug', '🚂'], ['Tor', '🥅'], ['Glas', '🥛']];
function dehnung() {
  const withH = Math.random() < .6;
  const [w, e] = pick(withH ? MIT_H : OHNE_H);
  let d;
  if (withH) { const i = w.indexOf('h', 1); d = [{ v: w.slice(0, i) + w.slice(i + 1), type: 'dehnung' }, { v: w.slice(0, i - 1) + w[i - 1] + w[i - 1] + w.slice(i + 1), type: 'dehnung' }, { v: w.slice(0, i - 1) + 'h' + w[i - 1] + w.slice(i + 1), type: 'dreher' }]; }
  else { const i = [...w].findIndex((ch, k) => k > 0 && 'aeiouäöü'.includes(ch)); d = [{ v: w.slice(0, i + 1) + 'h' + w.slice(i + 1), type: 'dehnung' }, { v: w.slice(0, i + 1) + w[i] + w.slice(i + 1), type: 'dehnung' }, { v: w.slice(0, i + 2) + w[i + 1] + w.slice(i + 2), type: 'doppelkonsonant' }]; }
  return {
    prompt: 'Welches Wort ist richtig geschrieben?', speak: `Welches Wort ist richtig geschrieben? ${w}`, visual: { type: 'emoji', emoji: e, say: w }, label: w,
    options: options(w, d, () => w + 'e'),
    hint: steps('Das Dehnungs-h steht nur in manchen Wörtern mit langem Selbstlaut (Kuh, Zahn). Viele Wörter mit langem Selbstlaut haben KEIN h (Rose, Tal). Diese Wörter muss man sich merken – sprich sie mehrmals deutlich.'),
  };
}
function trennen() {
  const pool = WORDS.filter(x => x.w.length >= 5 && x.s.length >= 2 && x.s[0].length > 1 && x.s.at(-1).length > 1 && !x.s.some(s => s.includes(' ')));
  const word = pick(pool), right = word.s.join('-'), w = word.w;
  const cuts = []; let pos = 0; for (const s of word.s.slice(0, -1)) { pos += s.length; cuts.push(pos); }
  const at = ps => { let out = '', last = 0; for (const p of ps) { out += w.slice(last, p) + '-'; last = p; } return out + w.slice(last); };
  const d = [];
  cuts.forEach((c, i) => { for (const sh of [-1, 1, 2]) { const nc = [...cuts]; nc[i] = c + sh; if (nc[i] > 1 && nc[i] < w.length - 1) d.push({ v: at(nc), type: 'trennung' }); } });
  d.push({ v: at([2]), type: 'trennung' }, { v: at([w.length - 2]), type: 'trennung' });
  return {
    prompt: 'Wie trennt man das Wort richtig?', speak: `Wie trennt man ${w}? Sprich es in Silben.`, visual: { type: 'emoji', emoji: word.e, say: w }, label: w,
    options: options(right, d, () => at([rnd(1, w.length - 1)])),
    hint: { text: 'Sprich das Wort langsam und klatsche bei jeder Silbe. Getrennt wird zwischen den Silben. „ck“ und „sch“ werden nie getrennt.', saysyll: word.s },
  };
}
const PLURAL = [['Hund', 'Hunde'], ['Katze', 'Katzen'], ['Baum', 'Bäume'], ['Haus', 'Häuser'], ['Buch', 'Bücher'], ['Maus', 'Mäuse'], ['Apfel', 'Äpfel'], ['Ball', 'Bälle'], ['Kind', 'Kinder'], ['Blume', 'Blumen'], ['Auto', 'Autos'], ['Vogel', 'Vögel'], ['Fisch', 'Fische'], ['Stuhl', 'Stühle'], ['Kuh', 'Kühe'], ['Nuss', 'Nüsse'], ['Zahn', 'Zähne'], ['Hand', 'Hände'], ['Bild', 'Bilder'], ['Ei', 'Eier'], ['Frau', 'Frauen'], ['Tisch', 'Tische']];
function mehrzahl() {
  const [one, many] = pick(PLURAL);
  const d = [one + 'e', one + 'en', one + 'n', one + 's', one + 'er', many.replace(/[äöü]/, ch => ({ ä: 'a', ö: 'o', ü: 'u' }[ch]))].filter(v => v !== many).map(v => ({ v, type: 'plural' }));
  return {
    prompt: `Eins: ${one}. Viele: ?`, speak: `Ein ${one}, viele …?`, visual: { type: 'none' }, label: one,
    options: options(many, d, () => one + pick(['e', 'en', 'er', 's'])),
    hint: steps(`Sag laut: „ein ${one}“ – „viele …“. Hör genau: Ändert sich vielleicht auch der Selbstlaut (a → ä, o → ö, u → ü)?`),
  };
}
const FARBEN = ['rot', 'blau', 'grün', 'gelb', 'lila', 'orange'];
const DINGE = [['einen Ball', 'der Ball'], ['eine Mütze', 'die Mütze'], ['einen Hut', 'der Hut'], ['eine Tasche', 'die Tasche'], ['ein Fahrrad', 'das Fahrrad'], ['einen Drachen', 'der Drachen']];
const ORTE = ['im Garten', 'auf dem Dach', 'unter dem Bett', 'im Keller', 'vor der Tür', 'auf dem Sofa'];
const TIERE = ['der Hund', 'die Katze', 'der Hase', 'die Maus', 'der Igel', 'die Ente'];
function saetze() {
  const n = pick(NAMES), kind = rnd(0, 2);
  if (kind === 0) {
    const [f1, f2] = shuffle(FARBEN), [d1, d2] = shuffle(DINGE);
    const text = `${n} hat ${d1[0]} und ${d2[0]}. ${d1[1][0].toUpperCase() + d1[1].slice(1)} ist ${f1}, ${d2[1]} ist ${f2}.`;
    const q = `Welche Farbe hat ${d2[1]}?`;
    return { prompt: q, speak: text + ' ' + q, visual: { type: 'text', text }, label: 'Farbe ' + d2[1], options: options(f2, [{ v: f1, type: 'sinn' }, ...shuffle(FARBEN.filter(x => x !== f1 && x !== f2)).slice(0, 2).map(v => ({ v, type: 'sonstiges' }))], () => pick(FARBEN)), hint: steps('Lies den Text noch einmal Satz für Satz. Fahre mit dem Finger mit. Wo steht das Wort aus der Frage?') };
  }
  if (kind === 1) {
    const [t1, t2] = shuffle(TIERE), [o1, o2] = shuffle(ORTE);
    const cap = s => s[0].toUpperCase() + s.slice(1);
    const v1 = pick(['schläft', 'sitzt', 'spielt']), v2 = pick(['schläft', 'sitzt', 'versteckt sich']);
    const text = `${cap(t1)} ${v1} ${o1}. ${cap(t2)} ${v2} ${o2}.`;
    const q = `Wo ist ${t2}?`;
    return { prompt: q, speak: text + ' ' + q, visual: { type: 'text', text }, label: 'Ort ' + t2, options: options(o2, [{ v: o1, type: 'sinn' }, ...shuffle(ORTE.filter(x => x !== o1 && x !== o2)).slice(0, 2).map(v => ({ v, type: 'sonstiges' }))], () => pick(ORTE)), hint: steps('Suche im Text das Tier aus der Frage. Was steht direkt danach?') };
  }
  const a = rnd(2, 9), b = until(() => rnd(2, 9), x => x !== a);
  const text = `${n} pflückt ${a} Äpfel und ${b} Birnen. Davon isst ${n} keine einzige.`;
  const q = `Wie viele Birnen hat ${n}?`;
  return { prompt: q, speak: text + ' ' + q, visual: { type: 'text', text }, label: 'Birnen', options: options(b, [{ v: a, type: 'sinn' }, { v: a + b, type: 'sinn' }, { v: b + 1, type: 'sonstiges' }], numFiller(b, 3)), hint: steps('Gefragt sind nur die Birnen – nicht alles zusammen. Lies nach, welche Zahl bei „Birnen“ steht.') };
}

// ================= Unterstufe: Mathematik =================
function negativ() {
  const a = rnd(-12, 12), b = until(() => rnd(-12, 12), x => x !== 0), plus = Math.random() < .5;
  const c = plus ? a + b : a - b;
  const wrongOp = plus ? a - b : a + b;
  return {
    prompt: `${par(a)} ${plus ? '+' : M} ${par(b)} = ?`, speak: `${fmt(a).replace(M, 'minus ')} ${plus ? 'plus' : 'minus'} ${fmt(b).replace(M, 'minus ')}`, visual: { type: 'big' }, label: `${fmt(a)} ${plus ? '+' : '−'} ${par(b)}`,
    options: options(fmt(c), [{ v: fmt(-c), type: 'vorzeichen' }, { v: fmt(wrongOp), type: 'vorzeichen' }, { v: fmt(Math.abs(a) + Math.abs(b)), type: 'vorzeichen' }, { v: fmt(c + 1), type: 'zaehlfehler' }], () => fmt(c + rnd(-6, 6))),
    hint: steps(`Denk an ein Thermometer oder einen Zahlenstrahl: Bei ${fmt(a)} starten. ${plus ? (b > 0 ? `+${b} heißt ${b} Schritte nach rechts.` : `+ (${fmt(b)}) heißt ${-b} Schritte nach links.`) : (b > 0 ? `${M}${b} heißt ${b} Schritte nach links.` : `${M} (${fmt(b)}) heißt ${-b} Schritte nach RECHTS – minus minus wird plus!`)}`),
  };
}
function vorrang() {
  const a = rnd(2, 12), b = rnd(2, 9), c = rnd(2, 9), kind = rnd(0, 3);
  let t, r, wrong;
  if (kind === 0) { t = `${a} + ${b} · ${c}`; r = a + b * c; wrong = (a + b) * c; }
  else if (kind === 1) { const A = a + b * c + rnd(0, 5); t = `${A} ${M} ${b} · ${c}`; r = A - b * c; wrong = (A - b) * c; }
  else if (kind === 2) { t = `(${a} + ${b}) · ${c}`; r = (a + b) * c; wrong = a + b * c; }
  else { t = `${a} · ${b} + ${c}`; r = a * b + c; wrong = a * (b + c); }
  return {
    prompt: `${t} = ?`, speak: t.replace(/·/g, ' mal ').replace(M, ' minus ').replace(/\(/g, ' Klammer auf ').replace(/\)/g, ' Klammer zu '), visual: { type: 'big' }, label: t,
    options: options(r, [{ v: wrong, type: 'punkt_vor_strich' }, { v: r + 1, type: 'zaehlfehler' }, { v: r + 10, type: 'stellenwert' }], numFiller(r, 8)),
    hint: steps('Reihenfolge: 1. Klammern, 2. Punkt (· und :), 3. Strich (+ und −). Rechne zuerst den Teil, der dran ist, und schreib das Zwischenergebnis auf.'),
  };
}
function brucherkennen() {
  const n = rnd(2, 8), k = rnd(1, n - 1);
  return {
    prompt: 'Welcher Teil ist gefärbt?', speak: 'Welcher Bruchteil ist gefärbt?', visual: { type: 'fracbar', n, k }, label: `${k}/${n}`,
    options: options(`${k}/${n}`, [{ v: n - k !== k ? `${n - k}/${n}` : null, type: 'bruch' }, { v: `${n}/${k}`, type: 'bruch' }, { v: `${k}/${n - k}`, type: 'bruch' }, { v: `${k}/${n + 1}`, type: 'sonstiges' }], () => `${rnd(1, 7)}/${rnd(2, 9)}`),
    hint: steps(`Zähle alle Teile: Das ist der Nenner (unten). Zähle die gefärbten Teile: Das ist der Zähler (oben).`),
  };
}
function bruchkuerzen() {
  const [x, y] = until(() => [rnd(1, 7), rnd(2, 9)], ([x, y]) => x < y && gcd(x, y) === 1);
  const k = pick([2, 3, 4, 5, 6]), a = x * k, b = y * k;
  const half = k % 2 === 0 && k > 2 ? `${a / 2}/${b / 2}` : null;
  return {
    prompt: `Kürze so weit wie möglich: ${a}/${b}`, speak: `Kürze ${a} ${b}-tel so weit wie möglich.`, visual: { type: 'none' }, label: `${a}/${b}`,
    options: options(`${x}/${y}`, [{ v: half, type: 'bruch' }, { v: `${y}/${x}`, type: 'bruch' }, { v: `${a - k}/${b - k}`, type: 'bruch' }, { v: `${x}/${b}`, type: 'bruch' }], () => `${rnd(1, 8)}/${rnd(2, 12)}`),
    hint: steps(`Suche die größte Zahl, durch die ${a} UND ${b} teilbar sind. Teile oben und unten durch dieselbe Zahl.`),
  };
}
function bruchplus() {
  if (Math.random() < .5) {
    const n = rnd(3, 12), a = rnd(1, n - 2), b = rnd(1, n - a - 1);
    return {
      prompt: `${a}/${n} + ${b}/${n} = ?`, speak: `${a} ${n}-tel plus ${b} ${n}-tel`, visual: { type: 'big' }, label: `${a}/${n} + ${b}/${n}`,
      options: options(`${a + b}/${n}`, [{ v: `${a + b}/${n + n}`, type: 'bruch' }, { v: `${a * b}/${n}`, type: 'operation' }, { v: `${a + b + 1}/${n}`, type: 'zaehlfehler' }], () => `${rnd(1, 9)}/${rnd(2, 12)}`),
      hint: steps('Gleicher Nenner: Der Nenner bleibt gleich! Nur die Zähler werden addiert.'),
    };
  }
  const [n, m] = pick([[2, 4], [2, 6], [3, 6], [2, 8], [4, 8], [3, 9], [2, 3], [3, 4], [2, 5], [4, 12]]);
  const a = rnd(1, n - 1), b = rnd(1, m - 1), l = n * m / gcd(n, m);
  const z = a * (l / n) + b * (l / m);
  return {
    prompt: `${a}/${n} + ${b}/${m} = ?`, speak: `${a} ${n}-tel plus ${b} ${m}-tel`, visual: { type: 'big' }, label: `${a}/${n} + ${b}/${m}`,
    options: options(frac(z, l), [{ v: `${a + b}/${n + m}`, type: 'bruch' }, { v: frac(a + b, l), type: 'bruch' }, { v: `${a + b}/${n * m}`, type: 'bruch' }], () => `${rnd(1, 9)}/${rnd(2, 12)}`),
    hint: steps(`Erst gleichnamig machen: Gemeinsamer Nenner ist ${l}. ${a}/${n} = ${a * l / n}/${l} und ${b}/${m} = ${b * l / m}/${l}. Dann die Zähler addieren und kürzen.`),
  };
}
function dezimal() {
  if (Math.random() < .5) {
    const a = rnd(1, 9) / 10, b = rnd(11, 89) / 100, c = a + b;
    const naive = Math.round(a * 10) + Math.round(b * 100);
    return {
      prompt: `${dec(a)} + ${dec(b)} = ?`, speak: `${dec(a)} plus ${dec(b)}`, visual: { type: 'big' }, label: `${dec(a)} + ${dec(b)}`,
      options: options(dec(c), [{ v: naive < 100 ? '0,' + String(naive).padStart(2, '0') : dec(naive / 100), type: 'komma' }, { v: dec(c + .1), type: 'zaehlfehler' }, { v: dec(c * 10), type: 'komma' }], () => dec(rnd(10, 190) / 100)),
      hint: steps(`Schreib die Zahlen untereinander – Komma unter Komma! ${dec(a)} = ${dec(a).padEnd(4, '0')}. Dann wie gewohnt addieren.`),
    };
  }
  const base = rnd(1, 9), nums = shuffle([base / 10, (base * 10 - rnd(1, 5)) / 100, base / 100 + rnd(1, 9) / 1000, base / 1000]);
  const max = Math.max(...nums);
  const longest = nums.filter(x => x !== max).sort((x, y) => dec(y).length - dec(x).length)[0];
  return {
    prompt: 'Welche Zahl ist am größten?', speak: 'Welche Zahl ist am größten?', visual: { type: 'none' }, label: 'Vergleich ' + nums.map(dec).join(' '),
    options: options(dec(max), nums.filter(x => x !== max).map(x => ({ v: dec(x), type: x === longest ? 'komma' : 'komma' })), () => dec(rnd(1, 99) / 1000)),
    hint: steps('Vergleiche Stelle für Stelle nach dem Komma: Zehntel zuerst! 0,5 ist größer als 0,45, weil 5 Zehntel mehr sind als 4 Zehntel. Mehr Ziffern heißt NICHT größer.'),
  };
}
function prozent() {
  const p = pick([10, 20, 25, 50, 75, 5, 1, 30]), base = pick({ 1: [100, 200, 300, 500], 5: [20, 40, 60, 80, 100, 200], 10: [30, 50, 70, 90, 120, 250], 20: [50, 80, 150, 200], 25: [40, 80, 120, 200], 30: [50, 100, 200], 50: [30, 46, 90, 120], 75: [40, 80, 120, 200] }[p]);
  const c = base * p / 100;
  return {
    prompt: `${p} % von ${base} = ?`, speak: `${p} Prozent von ${base}`, visual: { type: 'big' }, label: `${p}% von ${base}`,
    options: options(c, [{ v: base - c, type: 'prozent' }, { v: base * p / 10, type: 'prozent' }, { v: p, type: 'prozent' }, { v: Number.isInteger(base / p) && base / p !== c ? base / p : null, type: 'prozent' }], numFiller(c, 10)),
    hint: steps('Merke: 50 % = die Hälfte, 25 % = ein Viertel, 10 % = ein Zehntel, 1 % = ein Hundertstel. Rechne erst 1 % oder 10 % aus und dann weiter.'),
  };
}
function gleichung() {
  const x = rnd(2, 15), a = rnd(2, 12), kind = rnd(0, 3);
  let t, wrong;
  if (kind === 0) { t = `x + ${a} = ${x + a}`; wrong = x + a + a; }
  else if (kind === 1) { t = `x ${M} ${a} = ${x - a}`; wrong = x - a - a; }
  else if (kind === 2) { t = `${a} · x = ${a * x}`; wrong = a * x - a; }
  else { t = `x : ${a} = ${x}`; wrong = x; }
  return {
    prompt: `${t}    x = ?`, speak: `${t.replace(M, 'minus').replace('·', 'mal').replace(':', 'geteilt durch')}. Wie groß ist x?`, visual: { type: 'big' }, label: t,
    options: options(kind === 3 ? x * a : x, [{ v: wrong, type: 'gleichung' }, { v: kind === 3 ? x + a : x + 1, type: 'gleichung' }, { v: kind === 2 ? a * x * a : x + a, type: 'gleichung' }], numFiller(kind === 3 ? x * a : x, 5)),
    hint: steps('Mach die Rechnung rückwärts mit der Gegen-Rechenart: + wird −, − wird +, · wird :, : wird ·. Probe: Setz deine Lösung für x ein!'),
  };
}
const TEILREGEL = { 2: 'letzte Ziffer gerade (0, 2, 4, 6, 8)', 3: 'Quersumme durch 3 teilbar', 4: 'die letzten zwei Ziffern durch 4 teilbar', 5: 'letzte Ziffer 0 oder 5', 9: 'Quersumme durch 9 teilbar', 10: 'letzte Ziffer 0' };
function teilbar() {
  const d = pick([2, 3, 4, 5, 9, 10]);
  const yes = d * rnd(4, 40);
  const no = new Set();
  while (no.size < 6) { const v = rnd(20, 400); if (v % d) no.add(v); }
  return {
    prompt: `Welche Zahl ist durch ${d} teilbar?`, speak: `Welche Zahl ist durch ${d} teilbar?`, visual: { type: 'none' }, label: `teilbar durch ${d}`,
    options: options(yes, [...no].map(v => ({ v, type: 'teilbarkeit' })), () => d * rnd(4, 40) + 1),
    hint: steps(`Teilbarkeitsregel für ${d}: ${TEILREGEL[d]}.`),
  };
}
const HOCH = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' };
function potenz() {
  const kind = rnd(0, 2);
  let b, e;
  if (kind === 0) { b = rnd(2, 15); e = 2; } else if (kind === 1) { b = rnd(2, 5); e = 3; } else { b = pick([2, 10]); e = rnd(3, 6); }
  const c = b ** e;
  return {
    prompt: `${b}${HOCH[e]} = ?`, speak: `${b} hoch ${e}`, visual: { type: 'big' }, label: `${b}^${e}`,
    options: options(c, [{ v: b * e, type: 'potenz' }, { v: b + e, type: 'potenz' }, { v: b ** (e - 1), type: 'potenz' }, { v: c + b, type: 'nachbaraufgabe' }], numFiller(c, 10)),
    hint: steps(`${b}${HOCH[e]} heißt: ${Array(e).fill(b).join(' · ')}. Nicht ${b} · ${e}!`),
  };
}

// ================= Unterstufe: Deutsch =================
const DASDASS = [
  ['Ich hoffe, ___ du morgen kommst.', 'dass'], ['Das Buch, ___ auf dem Tisch liegt, gehört mir.', 'das'], ['Weißt du, ___ heute Ferien sind?', 'dass'], ['___ Fahrrad ist neu.', 'Das'],
  ['Das Kind, ___ dort spielt, ist mein Bruder.', 'das'], ['Ich glaube, ___ es regnen wird.', 'dass'], ['Er sagt, ___ er müde ist.', 'dass'], ['Ich mag ___ Lied sehr.', 'das'],
  ['Es ist schön, ___ du da bist.', 'dass'], ['Das Haus, ___ wir gekauft haben, ist alt.', 'das'], ['Sie freut sich, ___ sie gewonnen hat.', 'dass'], ['Siehst du ___ Pferd dort?', 'das'],
];
function dasdass() {
  const [s, w] = pick(DASDASS);
  const opts = w === 'Das' ? ['Das', 'Dass'] : ['das', 'dass'];
  return {
    prompt: 'Welches Wort passt in die Lücke?', speak: s.replace('___', 'Lücke'), visual: { type: 'text', text: s }, label: s,
    options: shuffle(opts.map(o => ({ label: o, correct: o === w, type: o === w ? null : 'das_dass' }))),
    hint: steps('Probe: Kannst du „dieses“, „jenes“ oder „welches“ einsetzen? Dann schreibst du „das“. Wenn nicht, schreibst du „dass“ (es leitet einen Nebensatz ein, oft nach Wörtern wie sagen, hoffen, glauben).'),
  };
}
const SLAUTE = [['Stra_e', 'ß'], ['Fu_', 'ß'], ['gro_', 'ß'], ['hei_', 'ß'], ['Spa_', 'ß'], ['Gru_', 'ß'], ['flie_en', 'ß'], ['Wa_er', 'ss'], ['Kla_e', 'ss'], ['Ta_e', 'ss'], ['Ku_', 'ss'], ['Flu_', 'ss'], ['e_en', 'ss'], ['Schlo_', 'ss'], ['Ho_e', 's'], ['Ro_e', 's'], ['Gra_', 's'], ['Gla_', 's'], ['le_en', 's'], ['Ha_e', 's']];
function slaute() {
  const [g, l] = pick(SLAUTE), w = g.replace('_', l);
  return {
    prompt: `Welcher Buchstabe fehlt?  ${g.replace('_', ' _ ')}`, speak: `Welcher S-Laut fehlt in ${w}?`, visual: { type: 'none' }, label: w,
    options: shuffle(['s', 'ss', 'ß'].map(o => ({ label: o, correct: o === l, type: o === l ? null : 's_laute' }))),
    hint: steps('Summend gesprochen (Ho-se) → s. Zischend nach KURZEM Selbstlaut (Was-ser) → ss. Zischend nach LANGEM Selbstlaut oder ei/au/eu (Stra-ße, heiß) → ß.'),
  };
}
const VERBEN = [['gehen', 'gehe', 'ging', 'gegangen'], ['laufen', 'laufe', 'lief', 'gelaufen'], ['schreiben', 'schreibe', 'schrieb', 'geschrieben'], ['sehen', 'sehe', 'sah', 'gesehen'], ['kommen', 'komme', 'kam', 'gekommen'],
  ['essen', 'esse', 'aß', 'gegessen'], ['trinken', 'trinke', 'trank', 'getrunken'], ['lesen', 'lese', 'las', 'gelesen'], ['schwimmen', 'schwimme', 'schwamm', 'geschwommen'], ['fahren', 'fahre', 'fuhr', 'gefahren'],
  ['singen', 'singe', 'sang', 'gesungen'], ['finden', 'finde', 'fand', 'gefunden'], ['bringen', 'bringe', 'brachte', 'gebracht'], ['denken', 'denke', 'dachte', 'gedacht'], ['springen', 'springe', 'sprang', 'gesprungen']];
function zeitformen() {
  const [inf, pr, pt, pp] = pick(VERBEN);
  const stem = inf.replace(/en$/, '');
  const text = `Gestern ___ ich. (${inf})`;
  return {
    prompt: 'Welche Form passt? (Präteritum, 1. Vergangenheit)', speak: `Gestern … ich. Verb: ${inf}. Welche Form passt?`, visual: { type: 'text', text }, label: inf,
    options: options(pt, [{ v: stem + 'te', type: 'zeitform' }, { v: pr, type: 'zeitform' }, { v: pp, type: 'zeitform' }, { v: stem + 'ete', type: 'zeitform' }], () => stem + 't'),
    hint: steps(`Viele häufige Verben sind „unregelmäßig“: Sie ändern den Selbstlaut statt -te anzuhängen. Sag laut: „heute ${pr} ich – gestern … ich“.`),
  };
}
const WORTART_SAETZE = [['Der [Hund] bellt laut.', 'Nomen'], ['Die Katze [schläft] auf dem Sofa.', 'Verb'], ['Das Auto ist [schnell].', 'Adjektiv'], ['Wir spielen [im] Garten.', 'Präposition'],
  ['Meine [Freundin] heißt Lea.', 'Nomen'], ['Ben [rennt] zur Schule.', 'Verb'], ['Der Tee ist [heiß].', 'Adjektiv'], ['Das Buch liegt [unter] dem Bett.', 'Präposition'], ['Am Morgen [lesen] wir.', 'Verb'],
  ['Das [Fenster] ist offen.', 'Nomen'], ['Sie trägt ein [rotes] Kleid.', 'Adjektiv'], ['Er wartet [vor] dem Kino.', 'Präposition'], ['Die [Freude] war groß.', 'Nomen'], ['Wir [lachen] viel.', 'Verb']];
function wortarten() {
  const [s, art] = pick(WORTART_SAETZE), word = /\[(.+?)\]/.exec(s)[1];
  return {
    prompt: `Welche Wortart ist „${word}“?`, speak: `${s.replace(/[[\]]/g, '')} Welche Wortart ist ${word}?`, visual: { type: 'text', text: s.replace(/[[\]]/g, '»').replace(/» /, '» ').replace(/»(.+?)»/, '»$1«') }, label: word,
    options: shuffle(['Nomen', 'Verb', 'Adjektiv', 'Präposition'].map(o => ({ label: o, correct: o === art, type: o === art ? null : 'wortart' }))),
    hint: steps('Nomen: der/die/das passt davor. Verb: ich …, du … (was man tut). Adjektiv: wie ist etwas? (schnell, rot). Präposition: kleine Lagewörter (in, auf, unter, vor).'),
  };
}
const NOMINAL = [['Beim ___ bin ich sehr schnell.', 'Laufen'], ['Ich kann sehr schnell ___.', 'laufen'], ['Das ___ macht mir Spaß.', 'Lesen'], ['Wir wollen heute ___.', 'lesen'], ['Zum ___ brauche ich Ruhe.', 'Lernen'],
  ['Ich muss noch ___.', 'lernen'], ['Das ___ im See ist toll.', 'Schwimmen'], ['Im Sommer gehen wir ___.', 'schwimmen'], ['Etwas ___ ist passiert.', 'Lustiges'], ['Der Witz war sehr ___.', 'lustig'], ['Ich wünsche dir alles ___!', 'Gute'], ['Das Essen ist ___.', 'gut']];
function grossklein2() {
  const [s, w] = pick(NOMINAL), other = w[0] === w[0].toUpperCase() ? w[0].toLowerCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1);
  return {
    prompt: 'Groß oder klein?', speak: s.replace('___', w), visual: { type: 'text', text: s }, label: s,
    options: shuffle([{ label: w, correct: true, type: null }, { label: other, correct: false, type: 'grossklein' }]),
    hint: steps('Steht ein Begleiter davor (das, beim, zum, im, etwas, alles, viel)? Dann wird das Wort zum Nomen und groß geschrieben: „beim Laufen“, „etwas Lustiges“.'),
  };
}
const KOMMA = [['Ich bleibe zu Hause', 'weil ich krank bin.'], ['Wir gehen ins Freibad', 'wenn die Sonne scheint.'], ['Lea weiß', 'dass sie gewonnen hat.'], ['Tim lacht', 'obwohl er traurig ist.'],
  ['Ich wollte kommen', 'aber ich hatte keine Zeit.'], ['Er rief mich an', 'als er zu Hause war.'], ['Sie fragt', 'ob wir mitspielen.'], ['Wir essen Eis', 'weil es so heiß ist.']];
function komma() {
  const [h, n] = pick(KOMMA), [first, ...rest] = n.split(' ');
  const right = `${h}, ${n}`;
  const words = h.split(' ');
  const d = [{ v: `${h} ${n}`, type: 'kommasetzung' }, { v: `${h} ${first}, ${rest.join(' ')}`, type: 'kommasetzung' }, { v: `${words[0]}, ${words.slice(1).join(' ')} ${n}`, type: 'kommasetzung' }];
  return {
    prompt: 'Wo steht das Komma richtig?', speak: `Wo steht das Komma richtig? ${h} ${n}`, visual: { type: 'none' }, label: h,
    options: options(right, d, () => right.replace(',', '')),
    hint: steps(`Vor Bindewörtern wie weil, dass, wenn, obwohl, als, ob und aber steht ein Komma. Hier: vor „${first}“.`),
  };
}

export const GEN2 = { plus100, minus100, plus1000, minus1000, malzehner, halbschriftlich, divrest, groessen, sachaufgaben, nomen, doppel, ie, dehnung, trennen, mehrzahl, saetze, negativ, vorrang, brucherkennen, bruchkuerzen, bruchplus, dezimal, prozent, gleichung, teilbar, potenz, dasdass, slaute, zeitformen, wortarten, grossklein2, komma };
