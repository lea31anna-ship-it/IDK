// Gemeinsame Hilfsfunktionen für die Aufgaben-Generatoren
export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
export const reverseDigits = n => (n >= 10 && n % 10 !== Math.floor(n / 10) % 10 && n < 100) ? Number(String(n).split('').reverse().join('')) : null;

// Baut (meist 4) Antwortmöglichkeiten: richtige + typisierte Ablenker, aufgefüllt mit Zufallswerten.
export function options(correct, distractors, filler, max = 4) {
  const out = [{ label: String(correct), correct: true, type: null }];
  const seen = new Set([String(correct)]);
  // Erst eindeutig machen (bei gleichem Wert gewinnt der zuerst genannte, spezifischere Fehlertyp),
  // dann zufällig auswählen – so bleibt die Fehler-Diagnose verlässlich.
  const uniq = [], seenD = new Set(seen);
  for (const d of distractors) {
    if (d.v === null || d.v === undefined) continue;
    const key = String(d.v);
    if (seenD.has(key) || (typeof d.v === 'number' && d.v < 0)) continue;
    seenD.add(key); uniq.push({ label: key, correct: false, type: d.type || 'sonstiges' });
  }
  for (const d of shuffle(uniq).slice(0, max - 1)) { seen.add(d.label); out.push(d); }
  let guard = 0;
  while (out.length < max && guard++ < 200) {
    const v = filler();
    const key = String(v);
    if (seen.has(key) || (typeof v === 'number' && v < 0)) continue;
    seen.add(key); out.push({ label: key, correct: false, type: 'sonstiges' });
  }
  return shuffle(out);
}
export const numFiller = (c, spread = 5) => () => Math.max(0, c + rnd(-spread, spread));

