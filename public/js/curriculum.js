// Lehrplan: Galaxien, Planeten, Fehlertypen und Freischalt-Logik.
// Wird von App, Coach-Dashboard UND Server gemeinsam genutzt.

export const GALAXIES = [
  { id: 'zahlen', name: 'Zahlen-Galaxie', icon: '🔢', desc: 'Rechnen & Zahlen' },
  { id: 'buchstaben', name: 'Buchstaben-Galaxie', icon: '🔤', desc: 'Lesen & Schreiben' },
];

const mathBase = [
  { id: 'mengen', label: '⁘', name: 'Punkte-Planet', topic: 'Mengen bis 10 auf einen Blick erkennen' },
  { id: 'zerlegen', label: '🏠', name: 'Zahlenhaus-Planet', topic: 'Zahlen bis 10 zerlegen' },
  { id: 'plus10', label: '+', name: 'Plus-Planet', topic: 'Plus im Zahlenraum bis 10' },
  { id: 'minus10', label: '−', name: 'Minus-Planet', topic: 'Minus im Zahlenraum bis 10' },
  { id: 'plus20', label: '+20', name: 'Zehner-Sprung-Planet', topic: 'Plus bis 20 mit Zehnerübergang' },
  { id: 'minus20', label: '−20', name: 'Zehner-Rückwärts-Planet', topic: 'Minus bis 20 mit Zehnerübergang' },
];
const mal = [];
for (let n = 1; n <= 10; n++) {
  mal.push({ id: `mal${n}`, label: `1×${n}`, name: `${n}er-Planet`, topic: `Einmaleins: die ${n}er-Reihe` });
}
const mathEnd = [
  { id: 'geteilt', label: ':', name: 'Teil-Planet', topic: 'Geteilt-Aufgaben im Einmaleins' },
  { id: 'malmix', label: '☀', name: 'Einmaleins-Sonne', topic: 'Gemischtes Einmaleins – die große Prüfung', boss: true },
];

const reading = [
  { id: 'anlaut', label: 'A', name: 'Anlaut-Planet', topic: 'Den ersten Laut eines Wortes hören' },
  { id: 'vokale', label: 'a e i', name: 'Vokal-Planet', topic: 'Fehlende Selbstlaute (a, e, i, o, u) finden' },
  { id: 'silben', label: 'Sil-be', name: 'Silben-Planet', topic: 'Silben schwingen und zählen' },
  { id: 'reime', label: '♪', name: 'Reim-Planet', topic: 'Reimwörter erkennen' },
  { id: 'bdpq', label: 'b d', name: 'Spiegel-Planet', topic: 'b, d, p und q unterscheiden' },
  { id: 'lesen', label: '👀', name: 'Lese-Planet', topic: 'Wörter lesen und dem Bild zuordnen' },
  { id: 'schreiben', label: '✎', name: 'Schreib-Planet', topic: 'Richtig geschriebene Wörter erkennen', boss: true },
];

const HUES = [28, 200, 280, 140, 330, 50, 180, 250, 10, 100, 300, 220, 160, 40, 260, 120, 350, 70];

export const PLANETS = [
  ...[...mathBase, ...mal, ...mathEnd].map((p, i) => ({ ...p, galaxy: 'zahlen', index: i, hue: HUES[i % HUES.length] })),
  ...reading.map((p, i) => ({ ...p, galaxy: 'buchstaben', index: i, hue: HUES[(i * 3 + 5) % HUES.length] })),
];

export const PLANET_BY_ID = Object.fromEntries(PLANETS.map(p => [p.id, p]));
export const planetsOf = galaxyId => PLANETS.filter(p => p.galaxy === galaxyId);

export const TASKS_PER_MISSION = 10;
export const PASS_CORRECT = 7; // ab 7 von 10 gilt ein Planet als geschafft

export function starsFor(correct, total = TASKS_PER_MISSION) {
  const r = correct / total;
  if (r >= 1) return 3;
  if (r >= 0.9) return 2;
  if (r >= PASS_CORRECT / TASKS_PER_MISSION) return 1;
  return 0;
}

// Standard-Freischaltung für neue Kinder: jeweils der erste Planet jeder Galaxie.
export const DEFAULT_UNLOCKED = GALAXIES.map(g => planetsOf(g.id)[0].id);

/**
 * Ist ein Planet offen?
 * - Öffentliche Version: erster Planet je Galaxie offen, danach jeweils nach Bestehen des Vorgängers.
 * - Code-Kinder: was die Coachin freigeschaltet hat; zusätzlich (wenn autoAdvance aktiv)
 *   der Nachfolger eines geschafften Planeten.
 */
export function isUnlocked(planetId, { mode, progress = {}, unlocked = [], autoAdvance = true }) {
  const p = PLANET_BY_ID[planetId];
  if (!p) return false;
  const prev = planetsOf(p.galaxy)[p.index - 1];
  const prevDone = prev && (progress[prev.id]?.bestStars || 0) >= 1;
  if (mode === 'public') return p.index === 0 || prevDone;
  if (unlocked.includes(planetId)) return true;
  if ((progress[planetId]?.attempts || 0) > 0) return true; // schon gespielt bleibt offen
  return autoAdvance && prevDone && isUnlocked(prev.id, { mode, progress, unlocked, autoAdvance });
}

// Fehler-Radar: Fehlertypen mit Förderhinweisen für die Coachin
export const ERROR_TYPES = {
  zaehlfehler: { label: 'Zählfehler (±1)', area: 'zahlen', tip: 'Zählt vermutlich einzeln ab und verzählt sich. Strukturierte Mengen (Fünfer-/Zehnerfeld, „Kraft der Fünf“) nutzen und Abzählen schrittweise ablösen.' },
  schaetzen: { label: 'Menge verschätzt', area: 'zahlen', tip: 'Mengen werden noch nicht simultan erfasst. Würfelbilder und Blitzblick-Übungen (kurz zeigen, abdecken) trainieren.' },
  zerlegung: { label: 'Teil-Ganzes unsicher', area: 'zahlen', tip: 'Teil-Ganzes-Beziehung handelnd erarbeiten: Schüttelboxen, Zahlenhäuser, Plättchen legen.' },
  operation: { label: 'Rechenart verwechselt', area: 'zahlen', tip: 'Rechenzeichen bewusst machen: farbig markieren, Rechengeschichten erzählen lassen, Handlung zur Aufgabe spielen.' },
  zahlendreher: { label: 'Zahlendreher (21 ↔ 12)', area: 'zahlen', tip: 'Inversion der Zahlschreibweise: Zehner zuerst legen (Stellenwerttafel), Zahlen mit Zehnerstangen und Einern bauen.' },
  stellenwert: { label: 'Stellenwertfehler (±10)', area: 'zahlen', tip: 'Zehnerübergang mit Material darstellen, schrittweise rechnen (erst bis zur 10), Zerlegen der 10 festigen.' },
  nachbaraufgabe: { label: 'Nachbaraufgabe im 1×1', area: 'zahlen', tip: 'Ableiten statt Auswendiglernen: Kernaufgaben (1×, 2×, 5×, 10×) als Stützpunkte und Nachbaraufgaben bewusst nutzen.' },
  laut_aehnlich: { label: 'Ähnliche Laute (d/t, b/p, g/k)', area: 'buchstaben', tip: 'Auditive Differenzierung: Minimalpaare hören und sprechen, Hauchprobe (Hand vor den Mund), Lautgebärden.' },
  spiegel: { label: 'Spiegelbuchstaben (b/d/p/q)', area: 'buchstaben', tip: 'Merkhilfen (z. B. „Bauch nach rechts = b“), Buchstaben groß in die Luft, in Sand oder auf den Rücken schreiben.' },
  vokal: { label: 'Vokale verwechselt', area: 'buchstaben', tip: 'Vokale farbig markieren, Vokal-Gebärden nutzen, Vokale bewusst gedehnt sprechen.' },
  silben: { label: 'Silben falsch gezählt', area: 'buchstaben', tip: 'Silben schwingen/klatschen, Silbenbögen zeichnen. Merke: Jede Silbe hat einen Selbstlaut.' },
  reim: { label: 'Reim nicht erkannt', area: 'buchstaben', tip: 'Phonologische Bewusstheit: Reimpaare sammeln, Reimspiele und Quatschreime mündlich üben.' },
  anlaut_statt_reim: { label: 'Wortanfang statt Reim', area: 'buchstaben', tip: 'Achtet auf den Wortanfang statt auf das Ende – Wortendungen bewusst betonen und vergleichen.' },
  dreher: { label: 'Buchstabendreher', area: 'buchstaben', tip: 'Langsames, silbisches Mitsprechen; Buchstabenfolge mit den Fingern abtippen, Wörter mit Buchstabenkarten legen.' },
  auslassung: { label: 'Buchstabe ausgelassen', area: 'buchstaben', tip: 'Gedehntes Sprechen („Robotersprache“), jeden Laut einzeln abklopfen und mitzählen.' },
  aehnliches_wort: { label: 'Ähnliches Wort verwechselt', area: 'buchstaben', tip: 'Genau hinschauen: Wörter Buchstabe für Buchstabe vergleichen, Lesepfeil oder Lesefenster nutzen.' },
  sonstiges: { label: 'Sonstiger Fehler', area: 'beide', tip: 'Kein typisches Muster – im Gespräch nachfragen, wie das Kind gerechnet bzw. gelesen hat.' },
};

export const MOODS = [
  { v: 1, e: '😟', t: 'nicht gut' },
  { v: 2, e: '😐', t: 'geht so' },
  { v: 3, e: '🙂', t: 'gut' },
  { v: 4, e: '😄', t: 'super' },
];
