// Aufgaben für Klapustri-Galaxie, Brüche-Galaxie und die Förderwelt (Laut-Galaxie, Zahlen-Insel).
// Auch hier steht jeder falsche Antwortvorschlag für ein Fehlermuster (Fehler-Radar).
import { rnd, pick, shuffle, reverseDigits, options, numFiller } from './util.js';
import { WORDS, allGenerators as gens } from './exercises.js';

const M = '−';
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const until = (gen, ok) => { for (let i = 0; i < 500; i++) { const v = gen(); if (ok(v)) return v; } return gen(); };

// ================= KLAPUSTRI (Klammer vor Punkt vor Strich) =================
const tok = s => s.replace(/−/g, '-').replace(/·/g, '*').replace(/:/g, '/').match(/\d+|[-+*/()]/g);
const OPS = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => a / b };
/** Ein Rechenschritt nach Klapustri: innerste Klammer zuerst, dann Punkt, dann Strich (jeweils von links). */
function reduceOnce(t) {
  let lo = 0, hi = t.length;
  const close = t.indexOf(')');
  if (close >= 0) { const open = t.lastIndexOf('(', close); lo = open + 1; hi = close; }
  const seg = t.slice(lo, hi);
  let i = seg.findIndex(x => x === '*' || x === '/');
  if (i < 0) i = seg.findIndex(x => x === '+' || x === '-');
  if (i < 0) { // Klammer enthält nur noch eine Zahl -> Klammer entfernen
    return [...t.slice(0, lo - 1), seg[0], ...t.slice(hi + 1)];
  }
  const v = OPS[seg[i]](Number(seg[i - 1]), Number(seg[i + 1]));
  const ns = [...seg.slice(0, i - 1), String(v), ...seg.slice(i + 2)];
  const out = [...t.slice(0, lo), ...ns, ...t.slice(hi)];
  if (close >= 0 && ns.length === 1) return [...t.slice(0, lo - 1), ns[0], ...t.slice(hi + 1)];
  return out;
}
const show = t => t.join(' ').replace(/\*/g, '·').replace(/\//g, ':').replace(/ - /g, ` ${M} `).replace(/\( /g, '(').replace(/ \)/g, ')');
export function klapustriSteps(expr) {
  let t = tok(expr); const steps = [show(t)];
  for (let g = 0; g < 30 && t.length > 1; g++) { t = reduceOnce(t); steps.push(show(t)); }
  return { value: Number(t[0]), steps };
}
// Typische Fehler: stur von links nach rechts (Punkt vor Strich missachtet) und Klammern übersehen
function evalLTR(t) { // Klammern beachtet, aber sonst stur von links nach rechts
  const stack = [[]];
  for (const x of t) { if (x === '(') stack.push([]); else if (x === ')') { const inner = ltr(stack.pop()); stack.at(-1).push(String(inner)); } else stack.at(-1).push(x); }
  return ltr(stack[0]);
  function ltr(a) { let v = Number(a[0]); for (let i = 1; i < a.length; i += 2) v = OPS[a[i]](v, Number(a[i + 1])); return v; }
}
const evalNoParens = t => klapustriSteps(show(t.filter(x => x !== '(' && x !== ')'))).value;
function kpsTask(expr, { minusKlammer = false } = {}) {
  const { value, steps } = klapustriSteps(expr), t = tok(expr);
  const d = [{ v: evalLTR(t), type: 'punkt_vor_strich' }, { v: evalNoParens(t), type: minusKlammer ? 'vorzeichen' : 'klammer' }, { v: value + 1, type: 'zaehlfehler' }, { v: value + 10, type: 'stellenwert' }]
    .filter(x => Number.isInteger(x.v) && x.v >= 0);
  return {
    prompt: `${expr} = ?`, speak: expr.replace(/·/g, ' mal ').replace(/:/g, ' geteilt durch ').replace(/−/g, ' minus ').replace(/\(/g, ' Klammer auf ').replace(/\)/g, ' Klammer zu '), visual: { type: 'big' }, label: expr,
    options: options(value, d, numFiller(value, 6)),
    hint: { text: `Klapustri: 1. Klammer, 2. Punkt (· und :), 3. Strich (+ und −). Schritt für Schritt: ${steps.join('  →  ')}` },
  };
}
const R = level => ({ 1: [2, 5, 12], 2: [2, 9, 30], 3: [3, 12, 60] }[level] || [2, 9, 30]);
const n = (level, i = 1) => rnd(R(level)[0], R(level)[1]);
const kpsGen = {
  punkt(level) {
    const [a, b, c] = [rnd(2, R(level)[2]), n(level), n(level)];
    return pick([`${a} + ${b} · ${c}`, `${b} · ${c} + ${a}`, `${a + b * c + rnd(0, 9)} ${M} ${b} · ${c}`, `${b} · ${c} ${M} ${rnd(1, b * c)}`]);
  },
  klammer(level) {
    const [a, b, c] = [n(level), n(level), n(level)];
    const q = n(level), sum = c * q, x = rnd(1, sum - 1);
    return pick([`(${a} + ${b}) · ${c}`, `${c} · (${a} + ${b})`, `(${a + b + c} ${M} ${b}) · ${c}`, `(${x} + ${sum - x}) : ${c}`]);
  },
  geteilt(level) {
    const c = n(level), q = n(level), a = rnd(2, R(level)[2]);
    return pick([`${a} + ${c * q} : ${c}`, `${c * q} : ${c} + ${a}`, `${a + q + rnd(0, 9)} ${M} ${c * q} : ${c}`]);
  },
  kette(level) {
    const [a, b, c, d] = [n(level), n(level), n(level), n(level)];
    const [p, q, r, t] = until(() => [n(level), n(level), n(level), n(level)], ([p, q, r, t]) => p * q >= r * t);
    return pick([`${a * 3} + ${b} · ${c} ${M} ${d}`, `${a} · ${b} + ${c} · ${d}`, `${p} · ${q} ${M} ${r} · ${t}`, `${a} + ${c * d} : ${c} + ${b}`]);
  },
  mix(level) {
    const [a, b, c, d] = [n(level), n(level), n(level), n(level)];
    return pick([`(${a} + ${b}) · ${c} ${M} ${rnd(1, (a + b) * c)}`, `${a} + (${b + c} ${M} ${c}) · ${d}`, `(${a} + ${b}) · (${c + d} ${M} ${d})`, `${a} · (${b} + ${c}) ${M} ${rnd(1, a * (b + c))}`]);
  },
  minus(level) {
    const b = n(level), c = n(level), a = b + c + rnd(2, R(level)[2]);
    return pick([`${a} ${M} (${b} + ${c})`, `${a} ${M} (${b + c} ${M} ${c})`, `${a} + (${b + c} ${M} ${b})`]);
  },
};
function kpsPlanet(kind) { return level => kpsTask(kpsGen[kind](level), { minusKlammer: kind === 'minus' }); }

// ================= BRÜCHE =================
const fr = (z, nn) => { const g = gcd(z, nn); return nn / g === 1 ? String(z / g) : `${z / g}/${nn / g}`; };
const valOf = s => { const m = /^(\d+) (\d+)\/(\d+)$/.exec(s); if (m) return +m[1] + m[2] / m[3]; const f = /^(\d+)\/(\d+)$/.exec(s); if (f) return f[1] / f[2]; return Number(s); };
/** Antworten, bei denen keine falsche Antwort zufällig denselben Wert wie die richtige hat */
function fracOptions(correct, distractors, filler) {
  const cv = valOf(correct);
  const ds = distractors.filter(d => d.v != null && Number.isFinite(valOf(String(d.v))) && Math.abs(valOf(String(d.v)) - cv) > 1e-9 && !/\/0$|\/1$|^0\//.test(String(d.v)));
  return options(correct, ds, () => { let f; do { f = filler(); } while (Math.abs(valOf(f) - cv) < 1e-9); return f; });
}
const fracFill = () => `${rnd(1, 9)}/${rnd(2, 12)}`;
const coprime = (maxN) => until(() => [rnd(1, maxN - 1), rnd(2, maxN)], ([a, b]) => a < b && gcd(a, b) === 1);
const BR = {
  br_erweitern(level) {
    const [a, b] = coprime(level === 1 ? 5 : 9), k = rnd(2, level === 3 ? 9 : 5), c = a * k;
    return {
      prompt: `${a}/${b} = ?/${b * k}`, speak: `${a} ${b}-tel ist gleich wie viele ${b * k}-tel?`, visual: { type: 'big' }, label: `${a}/${b} = _/${b * k}`,
      options: options(c, [{ v: a + b * k - b, type: 'bruch' }, { v: c + a, type: 'nachbaraufgabe' }, { v: c - a || null, type: 'nachbaraufgabe' }, { v: b * k - a, type: 'bruch' }], numFiller(c, 5)),
      hint: { text: `Der Nenner wurde mit ${k} malgenommen (${b} · ${k} = ${b * k}). Erweitern heißt: Zähler UND Nenner mit derselben Zahl malnehmen. Also ${a} · ${k} = ?` },
    };
  },
  br_vergleich(level) {
    let x, y;
    if (level === 1) { const nn = rnd(4, 12); const [p, q] = until(() => [rnd(1, nn - 1), rnd(1, nn - 1)], ([p, q]) => p !== q); x = [p, nn]; y = [q, nn]; }
    else if (level === 2) { const z = rnd(1, 3); const [p, q] = until(() => [rnd(z + 1, 10), rnd(z + 1, 10)], ([p, q]) => p !== q); x = [z, p]; y = [z, q]; }
    else { [x, y] = until(() => [coprime(9), coprime(9)], ([u, v]) => Math.abs(u[0] / u[1] - v[0] / v[1]) > 0.04 && u[1] !== v[1]); }
    const big = x[0] / x[1] > y[0] / y[1] ? x : y, small = big === x ? y : x;
    return {
      prompt: 'Welcher Bruch ist größer?', speak: `Welcher Bruch ist größer: ${x[0]} ${x[1]}-tel oder ${y[0]} ${y[1]}-tel?`, visual: { type: 'none' }, label: `${x.join('/')} vs ${y.join('/')}`,
      options: shuffle([{ label: big.join('/'), correct: true, type: null }, { label: small.join('/'), correct: false, type: 'bruch' }]),
      hint: { text: level === 2 ? 'Gleicher Zähler: Je größer der Nenner, desto KLEINER die Stücke! Eine Pizza in 8 Stücke hat kleinere Stücke als in 3.' : level === 1 ? 'Gleicher Nenner: Die Stücke sind gleich groß – mehr Stücke (größerer Zähler) ist mehr.' : 'Mach die Brüche gleichnamig (gleicher Nenner) oder stell dir eine Pizza vor.', visual: { type: 'fracbar', n: big[1], k: big[0] } },
    };
  },
  br_minus(level) {
    if (level < 3) {
      const nn = rnd(4, 12), a = rnd(2, nn - 1), b = rnd(1, a - 1);
      return {
        prompt: `${a}/${nn} ${M} ${b}/${nn} = ?`, speak: `${a} ${nn}-tel minus ${b} ${nn}-tel`, visual: { type: 'big' }, label: `${a}/${nn} − ${b}/${nn}`,
        options: fracOptions(`${a - b}/${nn}`, [{ v: `${a + b}/${nn}`, type: 'operation' }, { v: `${a - b}/${2 * nn}`, type: 'bruch' }, { v: `${a - b + 1}/${nn}`, type: 'zaehlfehler' }], fracFill),
        hint: { text: 'Gleicher Nenner: Der Nenner bleibt! Nur die Zähler werden subtrahiert.', visual: { type: 'fracbar', n: nn, k: a - b } },
      };
    }
    const [x, y] = pick([[2, 4], [2, 6], [3, 6], [2, 8], [4, 8], [3, 9], [2, 3], [3, 4], [4, 12]]);
    const a = rnd(1, x - 1), b = until(() => rnd(1, y - 1), v => a / x > v / y), l = x * y / gcd(x, y);
    return {
      prompt: `${a}/${x} ${M} ${b}/${y} = ?`, speak: `${a} ${x}-tel minus ${b} ${y}-tel`, visual: { type: 'big' }, label: `${a}/${x} − ${b}/${y}`,
      options: fracOptions(fr(a * l / x - b * l / y, l), [{ v: `${Math.abs(a - b)}/${Math.abs(y - x) || 1}`, type: 'bruch' }, { v: fr(a * l / x + b * l / y, l), type: 'operation' }, { v: `${Math.abs(a - b) || 1}/${l}`, type: 'bruch' }], fracFill),
      hint: { text: `Erst gleichnamig machen: gemeinsamer Nenner ${l}. ${a}/${x} = ${a * l / x}/${l}, ${b}/${y} = ${b * l / y}/${l}. Dann Zähler subtrahieren und kürzen.` },
    };
  },
  br_von(level) {
    const d = pick(level === 1 ? [2, 4, 5, 10] : [2, 3, 4, 5, 6, 8, 10]), z = level === 1 ? 1 : rnd(1, d - 1), base = d * rnd(2, level === 3 ? 12 : 6), c = base / d * z;
    return {
      prompt: `${z}/${d} von ${base} = ?`, speak: `${z} ${d}-tel von ${base}`, visual: { type: 'big' }, label: `${z}/${d} von ${base}`,
      options: options(c, [{ v: base / d !== c ? base / d : null, type: 'bruch' }, { v: base * z !== c ? base * z : null, type: 'bruch' }, { v: base - c, type: 'bruch' }, { v: c + 1, type: 'zaehlfehler' }], numFiller(c, 6)),
      hint: { text: `Erst durch den Nenner teilen: ${base} : ${d} = ${base / d}. Dann mal den Zähler: ${base / d} · ${z}.` },
    };
  },
  br_gemischt(level) {
    const nn = rnd(2, level === 1 ? 4 : 9), w = rnd(1, level === 1 ? 3 : 5), r = rnd(1, nn - 1), z = w * nn + r;
    if (level === 1 || Math.random() < 0.5) {
      return {
        prompt: `${z}/${nn} = ? (gemischte Zahl)`, speak: `${z} ${nn}-tel als gemischte Zahl`, visual: { type: 'big' }, label: `${z}/${nn}`,
        options: fracOptions(`${w} ${r}/${nn}`, [{ v: `${w - 1} ${r + nn}/${nn}`, type: 'bruch' }, { v: `${w} ${r}/${z}`, type: 'bruch' }, { v: `${w + 1} ${r}/${nn}`, type: 'zaehlfehler' }, { v: `${r} ${w}/${nn}`, type: 'zahlendreher' }].filter(x => !/^0 /.test(x.v)), () => `${rnd(1, 5)} ${rnd(1, nn - 1)}/${nn}`),
        hint: { text: `Wie oft passt ${nn} in ${z}? ${w}-mal (${w} · ${nn} = ${w * nn}). Rest: ${r}. Also ${w} Ganze und ${r}/${nn}.` },
      };
    }
    return {
      prompt: `${w} ${r}/${nn} = ?/${nn}`, speak: `${w} Ganze und ${r} ${nn}-tel, wie viele ${nn}-tel sind das?`, visual: { type: 'big' }, label: `${w} ${r}/${nn} = _/${nn}`,
      options: options(z, [{ v: w + r, type: 'bruch' }, { v: w * r + nn, type: 'bruch' }, { v: w * nn, type: 'bruch' }, { v: z + 1, type: 'zaehlfehler' }], numFiller(z, 5)),
      hint: { text: `Ein Ganzes sind ${nn}/${nn}. ${w} Ganze sind ${w} · ${nn} = ${w * nn} ${nn}-tel. Dazu noch ${r}.` },
    };
  },
  br_malzahl(level) {
    const [a, b] = coprime(level === 1 ? 5 : 9), k = rnd(2, level === 3 ? 9 : 5);
    return {
      prompt: `${a}/${b} · ${k} = ?`, speak: `${a} ${b}-tel mal ${k}`, visual: { type: 'big' }, label: `${a}/${b} · ${k}`,
      options: fracOptions(fr(a * k, b), [{ v: `${a * k}/${b * k}`, type: 'bruch' }, { v: `${a}/${b * k}`, type: 'bruch' }, { v: fr(a + k, b), type: 'operation' }], fracFill),
      hint: { text: `Nur der Zähler wird malgenommen: ${a} · ${k} = ${a * k}. Der Nenner bleibt ${b}. Danach kürzen, wenn es geht.` },
    };
  },
  br_mal(level) {
    const [a, b] = coprime(level === 1 ? 5 : 9), [c, d] = coprime(level === 1 ? 5 : 9);
    return {
      prompt: `${a}/${b} · ${c}/${d} = ?`, speak: `${a} ${b}-tel mal ${c} ${d}-tel`, visual: { type: 'big' }, label: `${a}/${b} · ${c}/${d}`,
      options: fracOptions(fr(a * c, b * d), [{ v: `${a + c}/${b + d}`, type: 'bruch' }, { v: fr(a * d, b * c), type: 'bruch' }, { v: `${a * c}/${b + d}`, type: 'bruch' }], fracFill),
      hint: { text: `Zähler mal Zähler (${a} · ${c} = ${a * c}), Nenner mal Nenner (${b} · ${d} = ${b * d}). Dann kürzen.` },
    };
  },
  br_durch(level) {
    const [a, b] = coprime(level === 1 ? 5 : 9), [c, d] = coprime(level === 1 ? 5 : 9);
    return {
      prompt: `${a}/${b} : ${c}/${d} = ?`, speak: `${a} ${b}-tel geteilt durch ${c} ${d}-tel`, visual: { type: 'big' }, label: `${a}/${b} : ${c}/${d}`,
      options: fracOptions(fr(a * d, b * c), [{ v: fr(a * c, b * d), type: 'bruch' }, { v: fr(b * c, a * d), type: 'bruch' }, { v: `${a + d}/${b + c}`, type: 'bruch' }], fracFill),
      hint: { text: `Durch einen Bruch dividieren = mit dem Kehrwert malnehmen: ${a}/${b} · ${d}/${c}. Dann Zähler mal Zähler, Nenner mal Nenner.` },
    };
  },
};

// ================= FÖRDERWELT: LAUTE (Legasthenie) =================
// [Wort, Emoji, Position der Lücke, Länge, Alternativen, Fehlertyp, Verlängerung/Ableitung (für den Hinweis)]
const BP = [['Ball', '⚽'], ['Bär', '🐻'], ['Banane', '🍌'], ['Biene', '🐝'], ['Baum', '🌳'], ['Buch', '📖'], ['Brot', '🍞'], ['Blume', '🌸'], ['Bus', '🚌'], ['Boot', '⛵'],
  ['Pizza', '🍕'], ['Pilz', '🍄'], ['Puppe', '🪆'], ['Paket', '📦'], ['Pinguin', '🐧'], ['Pinsel', '🖌️'], ['Papagei', '🦜'], ['Palme', '🌴'], ['Popcorn', '🍿'], ['Panda', '🐼'],
  ['Raupe', '🐛', 3], ['Lampe', '💡', 3], ['Gabel', '🍴', 2], ['Robbe', '🦭', 2], ['Kabel', '🔌', 2], ['Tulpe', '🌷', 3]];
const DT = [['Dino', '🦕'], ['Dose', '🥫'], ['Delfin', '🐬'], ['Drache', '🐉'], ['Dach', '🛖'], ['Tisch', '🪑'], ['Tiger', '🐯'], ['Tomate', '🍅'], ['Torte', '🎂'], ['Taxi', '🚕'], ['Tasse', '☕'], ['Turm', '🗼'],
  ['Hund', '🐶', -1, 'Hunde'], ['Mond', '🌙', -1, 'Monde'], ['Wald', '🌲', -1, 'Wälder'], ['Rad', '🚲', -1, 'Räder'], ['Hand', '✋', -1, 'Hände'], ['Kleid', '👗', -1, 'Kleider'],
  ['Brot', '🍞', -1, 'Brote'], ['Zelt', '⛺', -1, 'Zelte'], ['Hut', '🎩', -1, 'Hüte'], ['Boot', '⛵', -1, 'Boote'], ['Nest', '🪺', -1, 'Nester']];
const GK = [['Gabel', '🍴'], ['Gans', '🪿'], ['Gurke', '🥒'], ['Geschenk', '🎁'], ['Giraffe', '🦒'], ['Geld', '💰'], ['Katze', '🐱'], ['Kuh', '🐮'], ['Kuchen', '🍰'], ['Krone', '👑'], ['Kerze', '🕯️'], ['Koffer', '🧳'],
  ['Zug', '🚂', -1, 'Züge'], ['Berg', '⛰️', -1, 'Berge'], ['Weg', '🛤️', -1, 'Wege'], ['Flugzeug', '✈️', -1, 'Flugzeuge'], ['Burg', '🏰', -1, 'Burgen'], ['Sack', '🎒', -2, 'Säcke', 2]];
const FWV = [['Fisch', '🐟'], ['Fuchs', '🦊'], ['Feder', '🪶'], ['Frosch', '🐸'], ['Fahrrad', '🚲'], ['Feuer', '🔥'], ['Wal', '🐳'], ['Wolke', '☁️'], ['Wurm', '🪱'], ['Wolf', '🐺'], ['Würfel', '🎲'], ['Wurst', '🌭'],
  ['Vogel', '🐦'], ['Vase', '🏺'], ['Vater', '👨'], ['Vulkan', '🌋'], ['Vampir', '🧛']];
const EIIE = [['Eis', '🍦'], ['Eimer', '🪣'], ['Schwein', '🐷'], ['Stein', '🪨'], ['Zeitung', '📰'], ['Kleid', '👗'], ['Seife', '🧼'], ['Reifen', '🛞'], ['Eichhörnchen', '🐿️'],
  ['Biene', '🐝'], ['Brief', '✉️'], ['Spiegel', '🪞'], ['Ziege', '🐐'], ['Fliege', '🪰'], ['Wiese', '🌾'], ['Tier', '🐾'], ['Stiefel', '👢']];
const UML = [['Käse', '🧀', 'ä', null], ['Säge', '🪚', 'ä', null], ['Hände', '✋', 'ä', 'Hand'], ['Äpfel', '🍎', 'Ä', 'Apfel'], ['Bär', '🐻', 'ä', null], ['Mädchen', '👧', 'ä', null],
  ['Bett', '🛏️', 'e', null], ['Ente', '🦆', 'E', null], ['Herz', '❤️', 'e', null], ['Becher', '🥤', 'e', null], ['Teller', '🍽️', 'e', null], ['Hemd', '👕', 'e', null],
  ['Bäume', '🌳', 'äu', 'Baum'], ['Häuser', '🏘️', 'äu', 'Haus'], ['Mäuse', '🐭', 'äu', 'Maus'], ['Säule', '🏛️', 'äu', null],
  ['Feuer', '🔥', 'eu', null], ['Eule', '🦉', 'Eu', null], ['Euro', '💶', 'Eu', null], ['Kreuz', '✝️', 'eu', null], ['Freund', '🧑‍🤝‍🧑', 'eu', null]];
const capAlt = (alts, right) => (right[0] === right[0].toUpperCase() && right[0] !== right[0].toLowerCase() ? alts.map(a => a[0].toUpperCase() + a.slice(1)) : alts);
function gapTask({ w, e, i, len = 1, alts, type, extra = '', prompt }) {
  const right = w.slice(i, i + len), opts = capAlt(alts, right);
  return {
    prompt, speak: `${prompt} ${w}`, label: w,
    visual: { type: 'gapword', before: w.slice(0, i), after: w.slice(i + len), say: w, emoji: e },
    options: shuffle([...new Set(opts)].map(o => ({ label: o, correct: o === right, type: o === right ? null : type }))),
    hint: { text: extra || 'Sprich das Wort ganz langsam und deutlich. Leg die Hand an den Hals oder vor den Mund – spürst du einen Unterschied?', sayslow: w },
  };
}
const LAUT = {
  f_bp() { const [w, e, i = 0] = pick(BP); return gapTask({ w, e, i, alts: ['b', 'p'], type: 'laut_aehnlich', prompt: 'Wird das Wort mit b oder p geschrieben?', extra: 'Hauchprobe: Halte die Hand vor den Mund. Bei „p“ spürst du einen kräftigen Luftstoß, bei „b“ fast keinen.' }); },
  f_dt() {
    const [w, e, pos = 0, long] = pick(DT), i = pos < 0 ? w.length + pos : pos;
    return gapTask({ w, e, i, alts: ['d', 't'], type: pos < 0 ? 'auslaut' : 'laut_aehnlich', prompt: pos < 0 ? 'd oder t am Ende?' : 'Wird das Wort mit d oder t geschrieben?', extra: pos < 0 ? `Verlängerungsprobe: Sag „${long}“ – jetzt hörst du deutlich, ob es d oder t ist!` : 'Hauchprobe: Bei „t“ spürst du einen Luftstoß an der Hand, bei „d“ nicht.' });
  },
  f_gk() {
    const [w, e, pos = 0, long, len = 1] = pick(GK), i = pos < 0 ? w.length + pos : pos;
    return gapTask({ w, e, i, len, alts: len === 2 ? ['ck', 'g', 'k'] : ['g', 'k'], type: pos < 0 ? 'auslaut' : 'laut_aehnlich', prompt: pos < 0 ? 'Was gehört ans Ende?' : 'Wird das Wort mit g oder k geschrieben?', extra: pos < 0 ? `Verlängerungsprobe: Sag „${long}“ – hörst du jetzt g oder k?` : 'Hauchprobe: Bei „k“ spürst du einen Luftstoß, bei „g“ nicht.' });
  },
  f_fwv() { const [w, e] = pick(FWV); return gapTask({ w, e, i: 0, alts: ['f', 'w', 'v'], type: 'laut_aehnlich', prompt: 'f, w oder v?', extra: '„V“ klingt in Vogel, Vater, Vase wie „f“ – diese Wörter muss man sich merken. „W“ klingt weich und summt.' }); },
  f_eiie() {
    const [w, e] = pick(EIIE), lw = w.toLowerCase(), i = lw.includes('ei') ? lw.indexOf('ei') : lw.indexOf('ie');
    return gapTask({ w, e, i, len: 2, alts: ['ei', 'ie'], type: 'dreher', prompt: 'ei oder ie?', extra: '„ei“ klingt wie in „Eis“ (ai). „ie“ ist ein langes i wie in „Biene“. Tipp: Der zweite Buchstabe sagt, wie es klingt: e-I → „ai“, i-E → „ii“.' });
  },
  f_umlaut() {
    const [w, e, seg, rel] = pick(UML), lw = w.toLowerCase(), i = lw.indexOf(seg.toLowerCase());
    const alts = seg.toLowerCase() === 'äu' || seg.toLowerCase() === 'eu' ? ['äu', 'eu'] : ['ä', 'e'];
    return gapTask({ w, e, i, len: seg.length, alts, type: 'umlaut', prompt: alts[0] === 'äu' ? 'eu oder äu?' : 'e oder ä?', extra: rel ? `Ableitungsprobe: Denk an „${rel}“! Kommt das Wort von einem Wort mit a/au, schreibt man ä/äu.` : 'Gibt es ein verwandtes Wort mit a oder au? Wenn nein, schreibt man meistens e oder eu. Manche Wörter muss man sich merken.' });
  },
  f_lautpos() {
    const L = pick(['M', 'L', 'N', 'F', 'T']);
    const cand = WORDS.filter(x => x.e && !x.w.includes(' ')).map(x => {
      const lw = x.w.toLowerCase(), l = L.toLowerCase(), idx = lw.indexOf(l);
      if (idx < 0 || lw.indexOf(l, idx + 1) >= 0) return null;
      if (/(sch|pf|ng|nk|tz|th|ph|st|ch)/.test(lw.slice(Math.max(0, idx - 2), idx + 3)) && !(idx === 0 && l !== 't')) return null;
      return { ...x, pos: idx === 0 ? 'am Anfang' : idx === lw.length - 1 ? 'am Ende' : 'in der Mitte' };
    }).filter(Boolean);
    const x = pick(cand);
    return {
      prompt: `Wo hörst du das „${L}“?`, speak: `Wo hörst du das ${L} in ${x.w}? Am Anfang, in der Mitte oder am Ende?`, label: `${L} in ${x.w}`,
      visual: { type: 'emoji', emoji: x.e, say: x.w },
      options: shuffle(['am Anfang', 'in der Mitte', 'am Ende'].map(o => ({ label: o, correct: o === x.pos, type: o === x.pos ? null : 'lautposition' }))),
      hint: { text: `Sprich das Wort ganz langsam, Laut für Laut. Klopfe bei jedem Laut auf den Tisch. Wann kommt das „${L}“?`, sayslow: x.w },
    };
  },
};

// ================= FÖRDERWELT: ZAHLEN-INSEL (Dyskalkulie) =================
const scatter = k => { const pts = []; let g = 0; while (pts.length < k && g++ < 2000) { const p = [rnd(8, 92), rnd(10, 90)]; if (pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > 15)) pts.push(p); } return pts; };
const ZAHL = {
  z_mehr(level) {
    const max = { 1: 8, 2: 12, 3: 16 }[level], minDiff = { 1: 3, 2: 1, 3: 1 }[level];
    let a = rnd(1, max), b = level > 1 && Math.random() < 0.2 ? a : until(() => rnd(1, max), v => Math.abs(v - a) >= minDiff && Math.abs(v - a) <= (level === 3 ? 2 : 6));
    const right = a > b ? '⬅️ Links' : b > a ? 'Rechts ➡️' : '🟰 Gleich viele';
    const opts = level === 1 ? ['⬅️ Links', 'Rechts ➡️'] : ['⬅️ Links', 'Rechts ➡️', '🟰 Gleich viele'];
    return {
      prompt: 'Wo sind mehr Punkte?', speak: 'Wo sind mehr Punkte? Links oder rechts?', label: `${a} vs ${b}`, visual: { type: 'compare', a: scatter(a), b: scatter(b) },
      options: shuffle(opts.map(o => ({ label: o, correct: o === right, type: o === right ? null : 'schaetzen' }))),
      hint: { text: 'Lege Paare: Immer einen Punkt links und einen rechts. Wo am Ende Punkte übrig bleiben, sind mehr.' },
    };
  },
  z_nachbar(level) {
    const nn = level === 1 ? rnd(1, 19) : level === 2 ? until(() => rnd(10, 99), v => Math.random() < 0.5 || v % 10 === 9 || v % 10 === 0) : until(() => rnd(100, 999), v => Math.random() < 0.4 || v % 10 === 9 || v % 100 === 0);
    const after = Math.random() < 0.5, c = after ? nn + 1 : nn - 1;
    return {
      prompt: `Welche Zahl kommt direkt ${after ? 'nach' : 'vor'} ${nn}?`, speak: `Welche Zahl kommt direkt ${after ? 'nach' : 'vor'} ${nn}?`, visual: { type: 'big' }, label: `${after ? 'nach' : 'vor'} ${nn}`,
      options: options(c, [{ v: after ? nn - 1 : nn + 1, type: 'zaehlfehler' }, { v: nn, type: 'zaehlfehler' }, { v: after ? c - 10 : c + 10, type: 'stellenwert' }, { v: after ? nn + 10 : nn - 10, type: 'stellenwert' }, { v: reverseDigits(c), type: 'zahlendreher' }].filter(x => x.v > 0), numFiller(c, 3)),
      hint: { text: after ? `Zähle einen Schritt weiter: ${nn}, … Achtung beim Zehnersprung: nach 9 Einern kommt der nächste Zehner!` : `Zähle einen Schritt zurück: … , ${nn}.` },
    };
  },
  z_groesser(level) {
    let a, b;
    if (level === 1) { a = until(() => rnd(12, 98), v => v % 10 !== Math.floor(v / 10) && v % 10 !== 0); b = reverseDigits(a); }
    else if (level === 2) { const [x, y, z] = shuffle([rnd(1, 9), rnd(0, 9), rnd(1, 9)]); a = Number(`${x || 1}${y}${z}`); b = Number(`${x || 1}${z}${y}`); if (a === b) b = a + 10; }
    else { a = rnd(100, 980); b = a + pick([9, 18, 90, -9, -90]); }
    const big = Math.max(a, b), small = Math.min(a, b);
    return {
      prompt: 'Welche Zahl ist größer?', speak: `Welche Zahl ist größer: ${a} oder ${b}?`, visual: { type: 'none' }, label: `${a} vs ${b}`,
      options: shuffle([{ label: String(big), correct: true, type: null }, { label: String(small), correct: false, type: reverseDigits(big) === small ? 'zahlendreher' : 'stellenwert' }]).map(o => ({ ...o, big: true })),
      hint: { text: 'Vergleiche von vorne: Erst die größte Stelle (Hunderter bzw. Zehner). Wer dort mehr hat, ist größer. Nur wenn sie gleich sind, schaust du auf die nächste Stelle.' },
    };
  },
  z_stellen(level) {
    const h = level === 3 ? rnd(1, 3) : 0, t = rnd(1, level === 1 ? 4 : 9), o = rnd(level === 1 ? 1 : 0, 9), c = h * 100 + t * 10 + o;
    return {
      prompt: 'Welche Zahl ist das?', speak: 'Welche Zahl ist das? Eine Stange ist zehn, ein Würfel ist eins.', visual: { type: 'tens', h, t, o }, label: `${h}H ${t}Z ${o}E`,
      options: options(c, [{ v: h * 100 + o * 10 + t, type: 'zahlendreher' }, { v: h + t + o, type: 'stellenwert' }, { v: h * 100 + t * 10 + o + 10, type: 'stellenwert' }, { v: c + 1, type: 'zaehlfehler' }].filter(x => x.v !== c), numFiller(c, 3)),
      hint: { text: `${h ? `Eine Platte = 100. ` : ''}Eine Stange = 10, ein Würfel = 1. Zähle erst ${h ? 'die Platten in Hunderterschritten, dann ' : ''}die Stangen in Zehnerschritten (10, 20, 30 …), dann die Würfel dazu.` },
    };
  },
  z_strahl(level) {
    const cfg = { 1: { max: 10, step: 1, label: 1 }, 2: { max: 20, step: 1, label: 5 }, 3: { max: 100, step: 5, label: 10 } }[level];
    const v = cfg.step * rnd(1, cfg.max / cfg.step - 1);
    return {
      prompt: 'Auf welche Zahl zeigt der Pfeil?', speak: 'Auf welche Zahl zeigt der Pfeil?', visual: { type: 'numline', max: cfg.max, step: cfg.step, label: cfg.label, value: v }, label: `Zahlenstrahl ${v}`,
      options: options(v, [{ v: v + cfg.step, type: 'zaehlfehler' }, { v: v - cfg.step, type: 'zaehlfehler' }, { v: v + cfg.label, type: 'schaetzen' }, { v: v - cfg.label, type: 'schaetzen' }].filter(x => x.v >= 0 && x.v <= cfg.max), numFiller(v, cfg.step * 3)),
      hint: { text: `Such die nächste beschriftete Zahl und zähle die Striche bis zum Pfeil. Jeder Strich ist ${cfg.step === 1 ? 'eins' : cfg.step} weiter.` },
    };
  },
  z_doppel(level) {
    const max = { 1: 5, 2: 10, 3: 50 }[level], half = Math.random() < 0.5, nn = rnd(level === 3 ? 11 : 1, max);
    if (half) {
      const t = nn * 2;
      return {
        prompt: `Die Hälfte von ${t} = ?`, speak: `Was ist die Hälfte von ${t}?`, visual: level === 1 ? { type: 'tenframe', groups: [{ n: nn, color: 'a' }, { n: nn, color: 'b' }] } : { type: 'big' }, label: `Hälfte von ${t}`,
        options: options(nn, [{ v: t - 2, type: 'operation' }, { v: nn + 1, type: 'zaehlfehler' }, { v: nn - 1 || null, type: 'zaehlfehler' }, { v: t, type: 'operation' }, { v: reverseDigits(nn), type: 'zahlendreher' }], numFiller(nn, 3)),
        hint: { text: `Halbieren heißt gerecht auf zwei verteilen: Was plus dasselbe ergibt ${t}?` },
      };
    }
    const c = nn * 2;
    return {
      prompt: `Das Doppelte von ${nn} = ?`, speak: `Was ist das Doppelte von ${nn}?`, visual: level === 1 ? { type: 'tenframe', groups: [{ n: nn, color: 'a' }] } : { type: 'big' }, label: `Doppelt ${nn}`,
      options: options(c, [{ v: nn + 2, type: 'operation' }, { v: c + 1, type: 'zaehlfehler' }, { v: c - 1, type: 'zaehlfehler' }, { v: nn >= 10 ? (Math.floor(nn / 10) * 20 + (nn % 10) * 2) - (nn % 10 >= 5 ? 10 : 0) : null, type: 'uebertrag' }, { v: reverseDigits(c), type: 'zahlendreher' }], numFiller(c, 4)),
      hint: { text: `Verdoppeln heißt: ${nn} + ${nn}.${nn >= 10 ? ` Tipp: Zehner und Einer einzeln verdoppeln: ${Math.floor(nn / 10) * 10} + ${Math.floor(nn / 10) * 10} = ${Math.floor(nn / 10) * 20}, ${nn % 10} + ${nn % 10} = ${(nn % 10) * 2}.` : ''}` },
    };
  },
  z_freunde(level) {
    const target = level === 1 ? 10 : level === 2 ? pick([20, 100]) : 100;
    const a = level === 1 ? rnd(1, 9) : target === 20 ? rnd(11, 19) : level === 2 ? 10 * rnd(1, 9) : until(() => rnd(11, 89), v => v % 10 !== 0);
    const c = target - a, digitwise = target === 100 && a % 10 ? (10 - Math.floor(a / 10)) * 10 + (10 - a % 10) : null;
    return {
      prompt: `${a} + ? = ${target}`, speak: `${a} plus wie viel ist ${target}?`, visual: level === 1 ? { type: 'tenframe', groups: [{ n: a, color: 'a' }, { n: c, color: 'empty' }] } : { type: 'big' }, label: `${a} + _ = ${target}`,
      options: options(c, [{ v: digitwise, type: 'zerlegung' }, { v: c + 1, type: 'zaehlfehler' }, { v: c - 1 || null, type: 'zaehlfehler' }, { v: c + 10, type: 'stellenwert' }, { v: reverseDigits(c), type: 'zahlendreher' }], numFiller(c, 4)),
      hint: { text: target === 100 && a % 10 ? `Erst bis zum nächsten Zehner: ${a} + ${10 - a % 10} = ${a + 10 - a % 10}. Dann bis ${target}: noch ${target - a - 10 + a % 10}. Zusammen?` : `Welche Zahl fehlt noch bis ${target}? Zähle von ${a} aus weiter.` },
    };
  },
};

// ================= MENGEN & KRAFT DER 5 =================
const five = (nn, color = 'a') => ({ type: 'tenframe2', groups: [{ n: nn, color }], mark5: true });
const K5 = {
  k5_fuenfer(level) {
    const nn = rnd(level === 1 ? 3 : 5, 10);
    return {
      prompt: level === 1 ? 'Wie viele Punkte? Denk an die Kraft der 5!' : 'Blitzblick! Wie viele Punkte waren es?', speak: 'Wie viele Punkte siehst du?', label: `Fünfer ${nn}`,
      visual: { type: 'tenframe', groups: [{ n: nn, color: 'a' }], mark5: true }, flash: level > 1,
      options: options(nn, [{ v: nn - 1, type: 'zaehlfehler' }, { v: nn + 1, type: 'zaehlfehler' }, { v: nn >= 5 ? nn - 5 : null, type: 'schaetzen' }, { v: nn <= 5 ? nn + 5 : null, type: 'schaetzen' }], numFiller(nn, 3)),
      hint: { text: `Die obere Reihe ist voll – das sind 5. Dann nur noch die unteren zählen: 5 und ${Math.max(0, nn - 5)}.`, visual: { type: 'tenframe', groups: [{ n: nn, color: 'a' }], mark5: true } },
    };
  },
  k5_finger(level) {
    const nn = rnd(level === 1 ? 1 : 3, 10);
    return {
      prompt: 'Wie viele Finger zeigen die Hände?', speak: 'Wie viele Finger zeigen die Hände?', label: `Finger ${nn}`, visual: { type: 'hands', n: nn }, flash: level === 3,
      options: options(nn, [{ v: nn - 1, type: 'zaehlfehler' }, { v: nn + 1, type: 'zaehlfehler' }, { v: nn > 5 ? nn - 5 : null, type: 'schaetzen' }, { v: nn < 5 ? 5 + nn : null, type: 'schaetzen' }], numFiller(nn, 3)),
      hint: { text: nn > 5 ? `Eine ganze Hand sind 5 Finger. Dazu noch ${nn - 5} – das musst du nicht einzeln zählen!` : 'Zähle die gestreckten Finger. Eine ganze Hand wären 5.' },
    };
  },
  k5_plus5(level) {
    const k = rnd(1, level === 1 ? 5 : 9), [a, b] = Math.random() < 0.5 ? [5, k] : [k, 5], base = level === 3 ? 10 * rnd(1, 3) : 0;
    const A = a + (a === 5 ? base : 0), c = A + b;
    return {
      prompt: `${A} + ${b} = ?`, speak: `${A} plus ${b}`, visual: level < 3 && c <= 20 ? five(c) : { type: 'big' }, label: `${A} + ${b}`,
      options: options(c, [{ v: c - 1, type: 'zaehlfehler' }, { v: c + 1, type: 'zaehlfehler' }, { v: c + 10, type: 'stellenwert' }, { v: Math.abs(A - b), type: 'operation' }], numFiller(c, 3)),
      hint: { text: `Die 5 ist eine volle Fünferreihe. Dazu ${a === 5 ? b : a}: ${A} und noch ${a === 5 ? b : a}.` },
    };
  },
  k5_zerlegen(level) {
    const total = level === 1 ? rnd(6, 10) : level === 2 ? rnd(6, 15) : rnd(11, 20), part = total > 10 && level > 1 ? 10 : 5, c = total - part;
    return {
      prompt: `${total} = ${part} + ?`, speak: `${total} ist ${part} plus wie viel?`, visual: total <= 20 ? five(total) : { type: 'big' }, label: `${total} = ${part} + _`,
      options: options(c, [{ v: c + 1, type: 'zaehlfehler' }, { v: c - 1 || null, type: 'zaehlfehler' }, { v: total, type: 'zerlegung' }, { v: part === 5 ? c + 5 : c - 5 > 0 ? c - 5 : null, type: 'zerlegung' }], numFiller(c, 3)),
      hint: { text: `Schau ins Feld: ${part === 10 ? 'Eine volle Zehnerreihe' : 'Eine volle Fünferreihe'} ist ${part}. Wie viele sind noch dazu?` },
    };
  },
  k5_zwanzig(level) {
    const nn = rnd(level === 1 ? 6 : 8, 20);
    return {
      prompt: level === 3 ? 'Blitzblick! Welche Zahl war es?' : 'Welche Zahl siehst du?', speak: 'Welche Zahl siehst du im Zwanzigerfeld?', label: `Zwanzig ${nn}`, visual: five(nn), flash: level === 3,
      options: options(nn, [{ v: nn - 1, type: 'zaehlfehler' }, { v: nn + 1, type: 'zaehlfehler' }, { v: nn > 10 ? nn - 10 : nn + 10, type: 'stellenwert' }, { v: nn - 5 > 0 ? nn - 5 : null, type: 'schaetzen' }, { v: reverseDigits(nn), type: 'zahlendreher' }], numFiller(nn, 3)),
      hint: { text: 'Ein volles Feld oben sind 10. Jede Fünferreihe sind 5. Zähle in 10ern und 5ern, dann den Rest.' },
    };
  },
};
// ================= ZAHLENRAUM 10 =================
const ZR10 = {
  zr10_ergaenzen(level) {
    const max = level === 1 ? 6 : 10, total = rnd(3, max), a = rnd(1, total - 1), c = total - a;
    return {
      prompt: `${a} + ? = ${total}`, speak: `${a} plus wie viel ist ${total}?`, visual: level === 1 ? { type: 'tenframe', groups: [{ n: a, color: 'a' }, { n: c, color: 'empty' }] } : { type: 'big' }, label: `${a} + _ = ${total}`,
      options: options(c, [{ v: total + a <= 20 ? total + a : null, type: 'operation' }, { v: total, type: 'zerlegung' }, { v: c + 1, type: 'zaehlfehler' }, { v: c - 1 || null, type: 'zaehlfehler' }], numFiller(c, 3)),
      hint: { text: `Zähle von ${a} weiter bis ${total}. Wie viele Schritte sind das? Oder rechne rückwärts: ${total} − ${a}.` },
    };
  },
  zr10_platzhalter(level) {
    const kind = rnd(0, level === 1 ? 1 : 2), x = rnd(1, 9);
    let t, c, d;
    if (kind === 0) { const b = rnd(1, 10 - x); t = `? + ${b} = ${x + b}`; c = x; d = [{ v: x + 2 * b <= 20 ? x + 2 * b : null, type: 'operation' }]; }
    else if (kind === 1) { const b = rnd(1, x); t = `? ${M} ${b} = ${x - b}`; c = x; d = [{ v: Math.abs(x - 2 * b) !== x ? Math.abs(x - 2 * b) : null, type: 'operation' }]; }
    else { const b = rnd(1, x); t = `${x} ${M} ? = ${x - b}`; c = b; d = [{ v: x + x - b <= 20 ? x + x - b : null, type: 'operation' }]; }
    return {
      prompt: t, speak: t.replace('?', 'wie viel').replace(M, 'minus'), visual: { type: 'big' }, label: t,
      options: options(c, [...d, { v: c + 1, type: 'zaehlfehler' }, { v: c - 1 || null, type: 'zaehlfehler' }], numFiller(c, 3)),
      hint: { text: 'Probiere aus: Setz eine Zahl für das ? ein und rechne nach. Stimmt die Rechnung? Oder rechne mit der Umkehraufgabe.' },
    };
  },
};
// ================= ZEHNERÜBERGANG =================
const ZUE = {
  zue_bis10(level) {
    const tens = level === 1 ? 0 : level === 2 ? 10 : 10 * rnd(1, 8), a = tens + rnd(1, 9), target = tens + 10, c = target - a;
    return {
      prompt: `${a} + ? = ${target}`, speak: `${a} plus wie viel ist ${target}?`, visual: level === 1 ? { type: 'tenframe', groups: [{ n: a, color: 'a' }, { n: c, color: 'empty' }] } : { type: 'big' }, label: `${a} + _ = ${target}`,
      options: options(c, [{ v: c + 1, type: 'zaehlfehler' }, { v: c - 1 || null, type: 'zaehlfehler' }, { v: 10 - c !== c ? 10 - c : null, type: 'zerlegung' }, { v: c + 10, type: 'stellenwert' }], numFiller(c, 3)),
      hint: { text: `Bis zum vollen Zehner (${target}) fehlen noch … Schau auf die Einer: ${a % 10} und ? ergibt 10.` },
    };
  },
  zue_zerlegen(level) {
    const tens = level === 3 ? 10 * rnd(1, 7) : 0;
    const [a0, b] = until(() => [rnd(5, 9), rnd(3, 9)], ([x, y]) => x + y > 10), a = tens + a0, toTen = 10 - a0, rest = b - toTen;
    if (level === 1) {
      const opts = [`${toTen} + ${rest}`, `${rest} + ${toTen}`, `${toTen + 1} + ${rest - 1}`, `${toTen - 1} + ${rest + 1}`].filter((v, i, arr) => arr.indexOf(v) === i && !/(^|\s)0 \+|\+ 0$|-/.test(v));
      return {
        prompt: `${a} + ${b}: Wie zerlegst du die ${b}?`, speak: `${a} plus ${b}. Wie zerlegst du die ${b}, damit du zuerst bis zur 10 kommst?`, label: `${a} + ${b} zerlegen`,
        visual: { type: 'tenframe2', groups: [{ n: a0, color: 'a' }, { n: b, color: 'b' }] },
        options: shuffle(opts.slice(0, 3).map(o => ({ label: o, correct: o === `${toTen} + ${rest}`, type: o === `${toTen} + ${rest}` ? null : 'zerlegung' }))),
        hint: { text: `Erst bis zur 10: ${a0} + ${toTen} = 10. Darum zerlegst du die ${b} in ${toTen} und ${rest}.` },
      };
    }
    return {
      prompt: `${a} + ${b} = ${a} + ${toTen} + ?`, speak: `${a} plus ${b} ist ${a} plus ${toTen} plus wie viel?`, visual: { type: 'big' }, label: `${a} + ${b} = ${a} + ${toTen} + _`,
      options: options(rest, [{ v: toTen, type: 'zerlegung' }, { v: b, type: 'zerlegung' }, { v: rest + 1, type: 'zaehlfehler' }, { v: a + b, type: 'operation' }], numFiller(rest, 3)),
      hint: { text: `${a} + ${toTen} = ${a + toTen} (der volle Zehner). Von den ${b} hast du ${toTen} schon verbraucht – wie viele bleiben übrig?` },
    };
  },
  zue_unter(level) {
    const tens = level === 3 ? 10 * rnd(2, 8) : 10;
    const [o, b] = until(() => [rnd(1, 8), rnd(3, 9)], ([x, y]) => y > x), a = tens + o, rest = b - o;
    if (level === 1) {
      const right = `${o} + ${rest}`;
      const opts = [right, `${rest} + ${o}`, `${o + 1} + ${rest - 1}`, `${Math.max(1, o - 1)} + ${rest + 1}`].filter((v, i, arr) => arr.indexOf(v) === i && !/(^|\s)0 \+|\+ 0$|-/.test(v));
      return {
        prompt: `${a} ${M} ${b}: Wie zerlegst du die ${b}?`, speak: `${a} minus ${b}. Wie zerlegst du die ${b}, damit du zuerst zur 10 kommst?`, label: `${a} − ${b} zerlegen`,
        visual: { type: 'tenframe2', groups: [{ n: a - b, color: 'a' }, { n: b, color: 'gone' }] },
        options: shuffle(opts.slice(0, 3).map(x => ({ label: x, correct: x === right, type: x === right ? null : 'zerlegung' }))),
        hint: { text: `Erst zurück zur ${tens}: ${a} ${M} ${o} = ${tens}. Darum zerlegst du die ${b} in ${o} und ${rest}.` },
      };
    }
    return {
      prompt: `${a} ${M} ${b} = ${a} ${M} ${o} ${M} ?`, speak: `${a} minus ${b} ist ${a} minus ${o} minus wie viel?`, visual: { type: 'big' }, label: `${a} − ${b} = ${a} − ${o} − _`,
      options: options(rest, [{ v: o, type: 'zerlegung' }, { v: b, type: 'zerlegung' }, { v: rest + 1, type: 'zaehlfehler' }, { v: a - b, type: 'operation' }], numFiller(rest, 3)),
      hint: { text: `${a} ${M} ${o} = ${tens} (genau der Zehner). Von den ${b} hast du ${o} schon abgezogen – wie viele fehlen noch?` },
    };
  },
};

const mix = ids => level => { const id = pick(ids); return gens()[id](level); };
export const GEN3 = {
  kps_punkt: kpsPlanet('punkt'), kps_klammer: kpsPlanet('klammer'), kps_geteilt: kpsPlanet('geteilt'), kps_kette: kpsPlanet('kette'), kps_mix: kpsPlanet('mix'), kps_minus: kpsPlanet('minus'),
  ...BR, ...LAUT, ...ZAHL, ...K5, ...ZR10, ...ZUE,
};
GEN3.k5_sonne = mix(['mengen', 'k5_fuenfer', 'k5_finger', 'k5_plus5', 'k5_zerlegen', 'k5_zwanzig']);
GEN3.zr10_sonne = mix(['zerlegen', 'zr10_ergaenzen', 'plus10', 'minus10', 'zr10_platzhalter']);
GEN3.zue_sonne = mix(['zue_bis10', 'zue_zerlegen', 'plus20', 'zue_unter', 'minus20']);
GEN3.kps_sonne = mix(['kps_punkt', 'kps_klammer', 'kps_geteilt', 'kps_kette', 'kps_mix', 'kps_minus']);
GEN3.br_sonne = mix(['br_erweitern', 'br_vergleich', 'br_minus', 'br_von', 'br_gemischt', 'br_malzahl', 'br_mal', 'br_durch']);
GEN3.f_lautsonne = mix(['f_bp', 'f_dt', 'f_gk', 'f_fwv', 'f_eiie', 'f_umlaut', 'f_lautpos']);
GEN3.z_sonne = mix(['z_mehr', 'z_nachbar', 'z_groesser', 'z_stellen', 'z_strahl', 'z_doppel', 'z_freunde']);
