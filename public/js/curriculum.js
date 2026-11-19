// Lehrplan: Galaxien, Planeten, Fehlertypen und Freischalt-Logik.
// Wird von App, Coach-Dashboard UND Server gemeinsam genutzt.

export const APP_NAME = 'Lerniversum';

// Stufen (Österreich): Start = Volksschule 1.–2., dann Volksschule 3.–4., dann Unterstufe
export const LEVELS = [
  { id: 'start', name: 'VS 1–2', sub: 'Volksschule 1.–2. Klasse', icon: '🌱' },
  { id: 'vs34', name: 'VS 3–4', sub: 'Volksschule 3.–4. Klasse', icon: '🚀' },
  { id: 'us', name: 'Unterstufe', sub: '1.–4. Klasse Mittelschule / AHS', icon: '🌠' },
];
export const GALAXIES = [
  { id: 'zahlen', name: 'Zahlen-Galaxie', short: 'Mathe', icon: '🔢', level: 'start', desc: 'Rechnen & Zahlen' },
  { id: 'buchstaben', name: 'Buchstaben-Galaxie', short: 'Deutsch', icon: '🔤', level: 'start', desc: 'Lesen & Schreiben' },
  { id: 'rechnen34', name: 'Rechen-Nebel', short: 'Mathe', icon: '🧮', level: 'vs34', desc: 'Rechnen bis 1000, Größen, Sachaufgaben' },
  { id: 'deutsch34', name: 'Wörter-Nebel', short: 'Deutsch', icon: '📚', level: 'vs34', desc: 'Rechtschreibung & Leseverständnis' },
  { id: 'mathe58', name: 'Mathe-Sternbild', short: 'Mathe', icon: '📐', level: 'us', desc: 'Brüche, Prozent, Gleichungen' },
  { id: 'deutsch58', name: 'Sprach-Sternbild', short: 'Deutsch', icon: '✍️', level: 'us', desc: 'Grammatik & Rechtschreibung' },
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

const rechnen34 = [
  { id: 'plus100', label: '+100', name: 'Hunderter-Plus-Planet', topic: 'Plus bis 100 mit Zehnerübergang' },
  { id: 'minus100', label: '−100', name: 'Hunderter-Minus-Planet', topic: 'Minus bis 100 mit Zehnerübergang' },
  { id: 'malzehner', label: '×10', name: 'Zehner-Mal-Planet', topic: 'Malnehmen mit Zehnerzahlen (z. B. 4 × 30)' },
  { id: 'halbschriftlich', label: '23×4', name: 'Zerlege-Planet', topic: 'Zweistellig mal einstellig (halbschriftlich)' },
  { id: 'divrest', label: 'R', name: 'Rest-Planet', topic: 'Division mit Rest' },
  { id: 'plus1000', label: '+1000', name: 'Tausender-Plus-Planet', topic: 'Plus bis 1000' },
  { id: 'minus1000', label: '−1000', name: 'Tausender-Minus-Planet', topic: 'Minus bis 1000' },
  { id: 'groessen', label: 'm cm', name: 'Maßband-Planet', topic: 'Größen umwandeln (Längen, Gewichte, Zeit, Geld)' },
  { id: 'sachaufgaben', label: '?', name: 'Sachaufgaben-Sonne', topic: 'Textaufgaben lesen und lösen', boss: true },
];
const deutsch34 = [
  { id: 'nomen', label: 'Aa', name: 'Großschreib-Planet', topic: 'Nomen erkennen und großschreiben' },
  { id: 'mehrzahl', label: '1→2', name: 'Mehrzahl-Planet', topic: 'Einzahl und Mehrzahl' },
  { id: 'doppel', label: 'nn', name: 'Doppel-Planet', topic: 'Doppelte Mitlaute (Sonne, Ball)' },
  { id: 'ie', label: 'ie', name: 'ie-Planet', topic: 'ie oder i?' },
  { id: 'dehnung', label: 'h', name: 'Dehnungs-Planet', topic: 'Wörter mit und ohne Dehnungs-h' },
  { id: 'trennen', label: 'Sil-be', name: 'Trenn-Planet', topic: 'Wörter richtig trennen' },
  { id: 'saetze', label: '📖', name: 'Lese-Detektiv-Sonne', topic: 'Kurze Texte verstehen', boss: true },
];
const mathe58 = [
  { id: 'negativ', label: '−3', name: 'Minus-Mond', topic: 'Rechnen mit negativen Zahlen' },
  { id: 'vorrang', label: '·+', name: 'Vorrang-Planet', topic: 'Klammer vor Punkt vor Strich' },
  { id: 'teilbar', label: '÷?', name: 'Teiler-Planet', topic: 'Teilbarkeitsregeln' },
  { id: 'potenz', label: 'x²', name: 'Hoch-Planet', topic: 'Quadratzahlen und Potenzen' },
  { id: 'brucherkennen', label: '½', name: 'Bruch-Planet', topic: 'Brüche erkennen' },
  { id: 'bruchkuerzen', label: '4/8', name: 'Kürz-Planet', topic: 'Brüche kürzen' },
  { id: 'bruchplus', label: '⅓+', name: 'Bruch-Plus-Planet', topic: 'Brüche addieren' },
  { id: 'dezimal', label: '0,5', name: 'Komma-Planet', topic: 'Dezimalzahlen vergleichen und addieren' },
  { id: 'prozent', label: '%', name: 'Prozent-Planet', topic: 'Prozent von einer Zahl' },
  { id: 'gleichung', label: 'x', name: 'Gleichungs-Sonne', topic: 'Einfache Gleichungen lösen', boss: true },
];
const deutsch58 = [
  { id: 'wortarten', label: 'Nomen', name: 'Wortarten-Planet', topic: 'Nomen, Verb, Adjektiv, Präposition' },
  { id: 'zeitformen', label: '⏳', name: 'Zeitreise-Planet', topic: 'Präteritum unregelmäßiger Verben' },
  { id: 'slaute', label: 'ß', name: 'S-Laut-Planet', topic: 's, ss oder ß?' },
  { id: 'grossklein2', label: 'beim L', name: 'Nominalisierungs-Planet', topic: 'Verben und Adjektive als Nomen' },
  { id: 'dasdass', label: 'dass', name: 'das-dass-Planet', topic: 'das oder dass?' },
  { id: 'komma', label: ',', name: 'Komma-Sonne', topic: 'Komma vor Bindewörtern', boss: true },
];

const HUES = [28, 200, 280, 140, 330, 50, 180, 250, 10, 100, 300, 220, 160, 40, 260, 120, 350, 70];

export const PLANETS = [
  ...[...mathBase, ...mal, ...mathEnd].map((p, i) => ({ ...p, galaxy: 'zahlen', index: i, hue: HUES[i % HUES.length] })),
  ...reading.map((p, i) => ({ ...p, galaxy: 'buchstaben', index: i, hue: HUES[(i * 3 + 5) % HUES.length] })),
  ...rechnen34.map((p, i) => ({ ...p, galaxy: 'rechnen34', index: i, hue: HUES[(i * 5 + 2) % HUES.length] })),
  ...deutsch34.map((p, i) => ({ ...p, galaxy: 'deutsch34', index: i, hue: HUES[(i * 7 + 3) % HUES.length] })),
  ...mathe58.map((p, i) => ({ ...p, galaxy: 'mathe58', index: i, hue: HUES[(i * 5 + 9) % HUES.length] })),
  ...deutsch58.map((p, i) => ({ ...p, galaxy: 'deutsch58', index: i, hue: HUES[(i * 7 + 11) % HUES.length] })),
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

// Standard-Freischaltung für neue Kinder: jeweils der erste Planet der Start-Galaxien.
export const DEFAULT_UNLOCKED = GALAXIES.filter(g => g.level === 'start').map(g => planetsOf(g.id)[0].id);

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
  uebertrag: { label: 'Übertrag vergessen', area: 'zahlen', tip: 'Beim Zehner-/Hunderterübergang geht der Übertrag verloren. Mit Stellenwerttafel und Bündelungsmaterial (Zehnerstangen, Hunderterplatten) üben; Übertrag farbig notieren.' },
  teilprodukt: { label: 'Teilprodukt vergessen', area: 'zahlen', tip: 'Beim halbschriftlichen Malnehmen wird nur ein Teil multipliziert. Zerlegung sichtbar machen (Malkreuz, Punktefeld teilen).' },
  rest: { label: 'Rest falsch', area: 'zahlen', tip: 'Rest ist zu groß oder fehlt. Mit Plättchen verteilen lassen; Regel: Der Rest ist immer kleiner als der Teiler.' },
  einheit: { label: 'Umrechnung falsch', area: 'zahlen', tip: 'Umrechnungszahlen (10, 100, 1000, 60) unsicher. Stützpunktvorstellungen aufbauen (1 m = Türbreite …), Einheitentabelle nutzen.' },
  vorzeichen: { label: 'Vorzeichenfehler', area: 'zahlen', tip: 'Negative Zahlen am Zahlenstrahl/Thermometer darstellen; „minus minus wird plus“ handelnd (Schulden wegnehmen) begründen.' },
  punkt_vor_strich: { label: 'Punkt vor Strich missachtet', area: 'zahlen', tip: 'Rechnet stur von links nach rechts. Rechenreihenfolge farbig markieren lassen, Zwischenergebnisse notieren.' },
  bruch: { label: 'Bruch-Fehlvorstellung', area: 'zahlen', tip: 'Zähler und Nenner werden wie natürliche Zahlen behandelt (z. B. Nenner addiert). Brüche immer mit Bild/Material (Pizza, Bruchstreifen) verknüpfen.' },
  komma: { label: 'Dezimalkomma-Fehler', area: 'zahlen', tip: '„Längere Zahl ist größer“-Fehlvorstellung. Stellenwerttafel mit Zehnteln/Hundertsteln, Geld (Euro/Cent) als Modell.' },
  prozent: { label: 'Prozent-Fehler', area: 'zahlen', tip: 'Prozent als Anteil von 100 verankern: Hundertertafel einfärben, Stützwerte (50 %, 25 %, 10 %) üben.' },
  gleichung: { label: 'Umkehroperation falsch', area: 'zahlen', tip: 'Waagemodell nutzen: Auf beiden Seiten dasselbe tun. Immer Probe durch Einsetzen machen lassen.' },
  teilbarkeit: { label: 'Teilbarkeitsregel unsicher', area: 'zahlen', tip: 'Regeln (2, 3, 4, 5, 9, 10) als Merkkarte; Quersumme bewusst üben.' },
  potenz: { label: 'Potenz als Produkt verstanden', area: 'zahlen', tip: '3² wird als 3 · 2 gerechnet. Quadratzahlen als Quadrate legen/zeichnen lassen.' },
  grossklein: { label: 'Groß-/Kleinschreibung', area: 'buchstaben', tip: 'Artikelprobe (der/die/das davor?) und Begleiterwörter (beim, zum, etwas) farbig markieren.' },
  doppelkonsonant: { label: 'Doppelkonsonant', area: 'buchstaben', tip: 'Vokallänge unterscheiden: kurz (Son-ne) → Doppelmitlaut, lang (Ro-se) → einfach. Silbenschwingen mit Betonung.' },
  ie_i: { label: 'ie oder i', area: 'buchstaben', tip: 'Langes i hören → ie; kurzes i → i. Lange/kurze Vokale mit Gesten (langer/kurzer Arm) verbinden.' },
  dehnung: { label: 'Dehnungs-h', area: 'buchstaben', tip: 'Dehnungs-h ist Merkwissen: Wörterkartei mit h-Wörtern (Kuh, Zahn, Stuhl) anlegen, regelmäßig wiederholen.' },
  trennung: { label: 'Silbentrennung', area: 'buchstaben', tip: 'Silben schwingen; Regeln: ck und sch bleiben zusammen, ein einzelner Selbstlaut am Wortrand wird nicht abgetrennt.' },
  plural: { label: 'Mehrzahlbildung', area: 'buchstaben', tip: 'Pluralendungen (-e, -en, -er, -s, Umlaut) sammeln und sortieren; mündlich „ein … – viele …“ spielen.' },
  sinn: { label: 'Leseverständnis', area: 'buchstaben', tip: 'Wort gefunden, aber falsch zugeordnet. Lesestrategien: Frage zuerst lesen, Schlüsselwort im Text markieren, Satz für Satz.' },
  das_dass: { label: 'das / dass', area: 'buchstaben', tip: 'Ersatzprobe: „dieses/welches“ passt → das. Sonst dass (Bindewort nach sagen, glauben, hoffen …).' },
  s_laute: { label: 's / ss / ß', area: 'buchstaben', tip: 'Stimmhaft (summend) → s; stimmlos nach kurzem Vokal → ss; nach langem Vokal/Diphthong → ß. Vokallänge hören üben.' },
  zeitform: { label: 'Zeitformen', area: 'buchstaben', tip: 'Unregelmäßige Verben übergeneralisiert (gehte). Stammformen-Tabelle, mündliche Zeitreise-Spiele (heute/gestern).' },
  wortart: { label: 'Wortarten', area: 'buchstaben', tip: 'Proben nutzen: Artikelprobe (Nomen), ich-Probe (Verb), Wie-Frage (Adjektiv). Wortarten farbig markieren.' },
  kommasetzung: { label: 'Kommasetzung', area: 'buchstaben', tip: 'Bindewörter (weil, dass, wenn, obwohl, als, ob) als Komma-Signalwörter markieren; Haupt- und Nebensatz erkennen.' },
  sonstiges: { label: 'Sonstiger Fehler', area: 'beide', tip: 'Kein typisches Muster – im Gespräch nachfragen, wie das Kind gerechnet bzw. gelesen hat.' },
};

export const MOODS = [
  { v: 1, e: '😟', t: 'nicht gut' },
  { v: 2, e: '😐', t: 'geht so' },
  { v: 3, e: '🙂', t: 'gut' },
  { v: 4, e: '😄', t: 'super' },
];
