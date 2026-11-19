// Lehrplan: Galaxien, Planeten, Fehlertypen und Freischalt-Logik.
// Wird von App, Coach-Dashboard UND Server gemeinsam genutzt.

export const APP_NAME = 'Lerniversum';

// Stufen (Österreich): Start = Volksschule 1.–2., dann Volksschule 3.–4., dann Unterstufe
// Oben in der App: die Fächer. (Name LEVELS bleibt aus Kompatibilitätsgründen.)
export const LEVELS = [
  { id: 'mathe', name: 'Mathe', sub: 'Rechnen, Zahlen und Mengen', icon: '🔢' },
  { id: 'deutsch', name: 'Deutsch', sub: 'Lesen, Schreiben und Sprache', icon: '🔤' },
];
// Themen-Galaxien, je Fach in Lern-Reihenfolge (man reist von einer zur nächsten)
export const GALAXIES = [
  { id: 'mengen5', name: 'Mengen & Kraft der 5', short: 'Mathe', icon: '🖐️', level: 'mathe', grade: 'Grundlagen', desc: 'Mengen erfassen, Fünferbündel, Zwanzigerfeld' },
  { id: 'zr10', name: 'Zahlenraum 10', short: 'Mathe', icon: '🔟', level: 'mathe', grade: 'ab 1. Klasse', desc: 'Zerlegen, Plus, Minus, Ergänzen' },
  { id: 'zue', name: 'Zehnerübergang', short: 'Mathe', icon: '🔁', level: 'mathe', grade: 'ab 1. Klasse', desc: 'Über die 10 und zurück – Schritt für Schritt' },
  { id: 'zr100', name: 'Zahlenraum 100', short: 'Mathe', icon: '💯', level: 'mathe', grade: 'ab 2. Klasse', desc: 'Stellenwerte, Zahlenstrahl, Rechnen bis 100' },
  { id: 'einmaleins', name: 'Einmaleins', short: 'Mathe', icon: '✖️', level: 'mathe', grade: 'ab 2. Klasse', desc: 'Alle Reihen, Geteilt, gemischt' },
  { id: 'zr1000', name: 'Zahlenraum 1000 & Sachrechnen', short: 'Mathe', icon: '🏰', level: 'mathe', grade: 'ab 3. Klasse', desc: 'Große Zahlen, Größen, Textaufgaben' },
  { id: 'klapustri', name: 'Klapustri', short: 'Mathe', icon: '🧮', level: 'mathe', grade: 'ab 5. Schulstufe', desc: 'Klammer vor Punkt vor Strich' },
  { id: 'brueche', name: 'Brüche', short: 'Mathe', icon: '🍕', level: 'mathe', grade: 'ab 5. Schulstufe', desc: 'Rechnen mit Brüchen' },
  { id: 'zahlenwelt', name: 'Komma, Prozent & Gleichungen', short: 'Mathe', icon: '🌡️', level: 'mathe', grade: 'ab 5. Schulstufe', desc: 'Dezimalzahlen, Prozent, negative Zahlen, Gleichungen' },
  { id: 'laute', name: 'Laute & Buchstaben', short: 'Deutsch', icon: '👂', level: 'deutsch', grade: 'Grundlagen', desc: 'Laute hören und unterscheiden (b/p, d/t …)' },
  { id: 'silben', name: 'Silben, Reime & Lesen', short: 'Deutsch', icon: '🎵', level: 'deutsch', grade: 'ab 1. Klasse', desc: 'Silben, Reime, Wörter und Sätze lesen' },
  { id: 'rechtschreibung', name: 'Rechtschreibung', short: 'Deutsch', icon: '✍️', level: 'deutsch', grade: 'ab 2. Klasse', desc: 'Doppelmitlaute, ie, h, ä/äu, s/ss/ß, das/dass' },
  { id: 'grammatik', name: 'Grammatik', short: 'Deutsch', icon: '🔤', level: 'deutsch', grade: 'ab 2. Klasse', desc: 'Nomen, Mehrzahl, Wortarten, Zeiten, Komma' },
];
/** Galaxien-Kette (gleiche Stufe, gleiches Fach) in Reiseroute-Reihenfolge */
export const chainOf = galaxyId => { const g = GALAXIES.find(x => x.id === galaxyId); return GALAXIES.filter(x => x.level === g.level && x.short === g.short); };
export const prevGalaxy = galaxyId => { const c = chainOf(galaxyId); return c[c.findIndex(x => x.id === galaxyId) - 1] || null; };
export const nextGalaxy = galaxyId => { const c = chainOf(galaxyId); return c[c.findIndex(x => x.id === galaxyId) + 1] || null; };

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

const klapustri = [
  { id: 'kps_punkt', label: '·+', name: 'Punkt-Planet', topic: 'Punkt vor Strich' },
  { id: 'kps_klammer', label: '( )', name: 'Klammer-Planet', topic: 'Klammern zuerst rechnen' },
  { id: 'kps_geteilt', label: ':+', name: 'Geteilt-Planet', topic: 'Geteilt kommt vor Plus und Minus' },
  { id: 'kps_kette', label: '+·−', name: 'Ketten-Planet', topic: 'Lange Rechenketten' },
  { id: 'kps_mix', label: '(·)', name: 'Misch-Planet', topic: 'Klammer, Punkt und Strich gemischt' },
  { id: 'kps_minus', label: '−( )', name: 'Minus-Klammer-Planet', topic: 'Minus vor der Klammer' },
  { id: 'kps_sonne', label: 'KPS', name: 'Klapustri-Sonne', topic: 'Alle Klapustri-Regeln – die große Prüfung', boss: true },
];
const brueche = [
  { id: 'br_erweitern', label: '×/×', name: 'Erweitern-Planet', topic: 'Brüche erweitern' },
  { id: 'br_vergleich', label: '<>', name: 'Vergleichs-Planet', topic: 'Welcher Bruch ist größer?' },
  { id: 'br_minus', label: '−', name: 'Bruch-Minus-Planet', topic: 'Brüche subtrahieren' },
  { id: 'br_von', label: 'von', name: 'Bruchteil-Planet', topic: 'Bruchteile von Zahlen (¾ von 20)' },
  { id: 'br_gemischt', label: '1½', name: 'Gemischte-Zahlen-Planet', topic: 'Unechte Brüche und gemischte Zahlen' },
  { id: 'br_malzahl', label: '·n', name: 'Bruch-mal-Zahl-Planet', topic: 'Bruch mal ganze Zahl' },
  { id: 'br_mal', label: '·', name: 'Bruch-mal-Bruch-Planet', topic: 'Bruch mal Bruch' },
  { id: 'br_durch', label: ':', name: 'Bruch-Division-Planet', topic: 'Durch einen Bruch dividieren' },
  { id: 'br_sonne', label: '🍕', name: 'Bruch-Sonne', topic: 'Alles über Brüche – die große Prüfung', boss: true },
];
const laute = [
  { id: 'f_bp', label: 'b p', name: 'B-P-Planet', topic: 'Wird das Wort mit b oder p geschrieben?' },
  { id: 'f_dt', label: 'd t', name: 'D-T-Planet', topic: 'd oder t? Auch am Wortende (Hund – Hunde)' },
  { id: 'f_gk', label: 'g k', name: 'G-K-Planet', topic: 'g oder k? Auch am Wortende (Zug – Züge)' },
  { id: 'f_fwv', label: 'f w v', name: 'F-W-V-Planet', topic: 'f, w oder v?' },
  { id: 'f_eiie', label: 'ei ie', name: 'Ei-Ie-Planet', topic: 'ei oder ie?' },
  { id: 'f_umlaut', label: 'ä äu', name: 'Umlaut-Planet', topic: 'e oder ä? eu oder äu?' },
  { id: 'f_lautpos', label: '👂', name: 'Laut-Detektiv-Planet', topic: 'Wo hörst du den Laut: Anfang, Mitte oder Ende?' },
  { id: 'f_lautsonne', label: '🔊', name: 'Laut-Sonne', topic: 'Alle Laute gemischt', boss: true },
];
const zahleninsel = [
  { id: 'z_mehr', label: '⚖', name: 'Mehr-oder-weniger-Planet', topic: 'Wo sind mehr Punkte?' },
  { id: 'z_nachbar', label: '±1', name: 'Nachbarzahlen-Planet', topic: 'Welche Zahl kommt davor oder danach?' },
  { id: 'z_groesser', label: '34<43', name: 'Zahlendreher-Planet', topic: 'Welche Zahl ist größer? (34 oder 43)' },
  { id: 'z_stellen', label: 'Z E', name: 'Zehner-Einer-Planet', topic: 'Zehner und Einer erkennen' },
  { id: 'z_strahl', label: '|—|', name: 'Zahlenstrahl-Planet', topic: 'Zahlen am Zahlenstrahl finden' },
  { id: 'z_doppel', label: '×2', name: 'Verdoppeln-Planet', topic: 'Verdoppeln und halbieren' },
  { id: 'z_freunde', label: '+?=10', name: 'Zehnerfreunde-Planet', topic: 'Was fehlt bis 10 (bis 100)?' },
  { id: 'z_sonne', label: '🏝️', name: 'Insel-Sonne', topic: 'Alles zur Zahlvorstellung', boss: true },
];

const mengen5New = [
  { id: 'k5_fuenfer', label: '⁙⁙', name: 'Fünfer-Blitz-Planet', topic: 'Mengen mit der Kraft der 5 blitzschnell erkennen' },
  { id: 'k5_finger', label: '🖐️', name: 'Finger-Planet', topic: 'Fingerbilder: eine ganze Hand sind 5' },
  { id: 'k5_plus5', label: '5+', name: 'Fünf-und-noch-Planet', topic: '5 und noch … (5 + 3, 5 + 4 …)' },
  { id: 'k5_zerlegen', label: '5|', name: 'Fünfer-Zerlege-Planet', topic: 'Zahlen mit der 5 zerlegen (8 = 5 + 3)' },
  { id: 'k5_zwanzig', label: '20', name: 'Zwanzigerfeld-Planet', topic: 'Zahlen bis 20 im Zwanzigerfeld erkennen' },
  { id: 'k5_sonne', label: '✋', name: 'Fünfer-Sonne', topic: 'Alles zur Kraft der 5', boss: true },
];
const zr10New = [
  { id: 'zr10_ergaenzen', label: '3+?', name: 'Ergänzen-Planet', topic: 'Was fehlt? (3 + ? = 7)' },
  { id: 'zr10_platzhalter', label: '?−2', name: 'Platzhalter-Planet', topic: 'Die fehlende Zahl finden (? − 2 = 5)' },
  { id: 'zr10_sonne', label: '10', name: 'Zehner-Sonne', topic: 'Alles im Zahlenraum 10', boss: true },
];
const zueNew = [
  { id: 'zue_bis10', label: '→10', name: 'Bis-zur-10-Planet', topic: 'Erst bis zur 10 (8 + ? = 10)' },
  { id: 'zue_zerlegen', label: '8+2+3', name: 'Über-die-10-Planet', topic: 'Zehnerüberschreitung: 8 + 5 = 8 + 2 + 3' },
  { id: 'zue_unter', label: '13−3−2', name: 'Unter-die-10-Planet', topic: 'Zehnerunterschreitung: 13 − 5 = 13 − 3 − 2' },
  { id: 'zue_sonne', label: '±10', name: 'Zehnerübergang-Sonne', topic: 'Über und unter die 10 – gemischt', boss: true },
];
// Welche Planeten gehören zu welcher Themen-Galaxie (Reihenfolge = Lernweg)
const TOPIC_PLANETS = {
  mengen5: ['mengen', 'k5_fuenfer', 'k5_finger', 'k5_plus5', 'k5_zerlegen', 'k5_zwanzig', 'z_mehr', 'k5_sonne'],
  zr10: ['zerlegen', 'zr10_ergaenzen', 'plus10', 'minus10', 'zr10_platzhalter', 'zr10_sonne'],
  zue: ['zue_bis10', 'zue_zerlegen', 'plus20', 'zue_unter', 'minus20', 'z_doppel', 'zue_sonne'],
  zr100: ['z_nachbar', 'z_groesser', 'z_stellen', 'z_strahl', 'z_freunde', 'plus100', 'minus100', 'z_sonne'],
  einmaleins: ['mal1', 'mal2', 'mal3', 'mal4', 'mal5', 'mal6', 'mal7', 'mal8', 'mal9', 'mal10', 'geteilt', 'malmix'],
  zr1000: ['malzehner', 'halbschriftlich', 'divrest', 'plus1000', 'minus1000', 'groessen', 'sachaufgaben'],
  klapustri: ['vorrang', 'kps_punkt', 'kps_klammer', 'kps_geteilt', 'kps_kette', 'kps_mix', 'kps_minus', 'kps_sonne'],
  brueche: ['brucherkennen', 'br_erweitern', 'bruchkuerzen', 'br_vergleich', 'bruchplus', 'br_minus', 'br_von', 'br_gemischt', 'br_malzahl', 'br_mal', 'br_durch', 'br_sonne'],
  zahlenwelt: ['dezimal', 'prozent', 'negativ', 'teilbar', 'potenz', 'gleichung'],
  laute: ['anlaut', 'vokale', 'f_bp', 'f_dt', 'f_gk', 'f_fwv', 'bdpq', 'f_lautpos', 'f_lautsonne'],
  silben: ['silben', 'reime', 'trennen', 'lesen', 'saetze'],
  rechtschreibung: ['doppel', 'ie', 'f_eiie', 'dehnung', 'f_umlaut', 'slaute', 'dasdass', 'schreiben'],
  grammatik: ['nomen', 'mehrzahl', 'wortarten', 'zeitformen', 'grossklein2', 'komma'],
};

const HUES = [28, 200, 280, 140, 330, 50, 180, 250, 10, 100, 300, 220, 160, 40, 260, 120, 350, 70];

const ALL_DEFS = Object.fromEntries([...mathBase, ...mal, ...mathEnd, ...reading, ...rechnen34, ...deutsch34, ...mathe58, ...deutsch58, ...klapustri, ...brueche, ...laute, ...zahleninsel, ...mengen5New, ...zr10New, ...zueNew].map(p => [p.id, p]));
// Boss-Planeten (Sonnen) nur am Ende eines Themas als Boss darstellen
export const PLANETS = GALAXIES.flatMap((g, gi) => TOPIC_PLANETS[g.id].map((id, i, arr) => {
  const d = ALL_DEFS[id]; if (!d) throw new Error('Planet fehlt: ' + id);
  return { ...d, boss: !!d.boss && i === arr.length - 1, galaxy: g.id, index: i, hue: HUES[(i * 5 + gi * 3) % HUES.length] };
}));

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
export const DEFAULT_UNLOCKED = LEVELS.map(l => planetsOf(GALAXIES.find(g => g.level === l.id).id)[0].id);
/** Ist eine ganze Galaxie geschafft (jeder Planet mindestens Stufe 1)? */
export const galaxyDone = (galaxyId, progress = {}) => planetsOf(galaxyId).every(p => (progress[p.id]?.bestStars || 0) >= 1);

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
  if (p.index === 0) { const pg = prevGalaxy(p.galaxy); return !!(autoAdvance && pg && galaxyDone(pg.id, progress)); } // Weiterreise in die nächste Galaxie
  return autoAdvance && prevDone && isUnlocked(prev.id, { mode, progress, unlocked, autoAdvance });
}

// ---------- Einstufungstest ----------
// Aufgaben von leicht nach schwer: [Thema, Planet, Stufe]. Der Test endet früher, wenn es zu schwer wird.
export const PLACEMENT = {
  mathe: [['mengen5', 'mengen', 1], ['mengen5', 'k5_plus5', 1], ['zr10', 'plus10', 2], ['zr10', 'minus10', 2], ['zr10', 'zr10_ergaenzen', 2],
    ['zue', 'plus20', 2], ['zue', 'minus20', 2], ['zr100', 'z_stellen', 2], ['zr100', 'z_groesser', 2], ['zr100', 'plus100', 2],
    ['einmaleins', 'mal3', 2], ['einmaleins', 'mal7', 2], ['einmaleins', 'geteilt', 2], ['zr1000', 'plus1000', 2], ['zr1000', 'divrest', 2],
    ['klapustri', 'kps_punkt', 2], ['brueche', 'br_vergleich', 2], ['brueche', 'br_von', 2], ['zahlenwelt', 'dezimal', 2], ['zahlenwelt', 'gleichung', 2]],
  deutsch: [['laute', 'anlaut', 1], ['laute', 'f_bp', 1], ['laute', 'vokale', 2], ['laute', 'f_dt', 2], ['silben', 'silben', 2], ['silben', 'reime', 2],
    ['silben', 'lesen', 2], ['rechtschreibung', 'doppel', 2], ['rechtschreibung', 'ie', 2], ['rechtschreibung', 'dehnung', 2], ['silben', 'saetze', 2],
    ['grammatik', 'nomen', 2], ['grammatik', 'mehrzahl', 2], ['rechtschreibung', 'slaute', 2], ['rechtschreibung', 'dasdass', 2],
    ['grammatik', 'wortarten', 2], ['grammatik', 'zeitformen', 2], ['grammatik', 'komma', 2]],
};
/** Auswertung: je Thema sicher / teilweise / üben / offen + empfohlenes Start-Thema */
export function evaluatePlacement(subject, results) {
  const topics = GALAXIES.filter(g => g.level === subject).map(g => {
    const r = results.filter(x => x.topic === g.id), ok = r.filter(x => x.ok).length;
    return { topic: g.id, asked: r.length, ok, status: !r.length ? 'offen' : ok === r.length ? 'sicher' : ok === 0 ? 'ueben' : 'teilweise' };
  });
  const rec = topics.find(t => t.status === 'ueben' || t.status === 'teilweise') || topics.find(t => t.status === 'offen') || topics[topics.length - 1];
  return { topics, recommend: rec.topic };
}
export const PLACEMENT_STATUS = { sicher: { icon: '✅', label: 'sicher' }, teilweise: { icon: '🟡', label: 'teilweise' }, ueben: { icon: '🔴', label: 'noch üben' }, offen: { icon: '⚪', label: 'nicht getestet' } };

// ---------- Stufen pro Planet (wie Lektionen) ----------
export const PLANET_LEVELS = [
  { n: 1, name: 'Entdecker', medal: '🥉', desc: '3 Antworten zur Auswahl – zum Reinkommen', tasks: 10 },
  { n: 2, name: 'Pilot', medal: '🥈', desc: '4 Antworten zur Auswahl', tasks: 10 },
  { n: 3, name: 'Profi', medal: '🥇', desc: 'Zahlen selbst eintippen, 12 Aufgaben', tasks: 12 },
];
/** Sterne je Stufe. Ältere Spielstände (vor den Stufen) entsprechen Stufe 1 und 2. */
export function levelStars(pr) {
  if (!pr) return { 1: 0, 2: 0, 3: 0 };
  if (pr.lv) return { 1: pr.lv[1] || 0, 2: pr.lv[2] || 0, 3: pr.lv[3] || 0 };
  return { 1: pr.bestStars || 0, 2: pr.bestStars || 0, 3: 0 };
}
export const levelOpen = (pr, n) => n === 1 || levelStars(pr)[n - 1] >= 1;
export const nextLevel = pr => { const s = levelStars(pr); return s[1] < 1 ? 1 : s[2] < 1 ? 2 : s[3] < 1 ? 3 : 3; };

// ---------- Raumstationen: Quiz mit 3 Leben über mehrere Planeten ----------
export const STATION_EVERY = 4;
export const STATION_TARGET = 12; // so viele richtige Antworten, bevor die Leben ausgehen
/** Stationen einer Galaxie: nach je 4 Planeten eine Station, am Ende das Galaxie-Tor (alle Planeten). */
export function stationsOf(galaxyId) {
  const list = planetsOf(galaxyId), out = [];
  for (let i = STATION_EVERY; i < list.length; i += STATION_EVERY) {
    out.push({ id: `st-${galaxyId}-${out.length + 1}`, galaxy: galaxyId, after: i - 1, planets: list.slice(i - STATION_EVERY, i).map(p => p.id), name: `Raumstation ${['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'][out.length] || out.length + 1}`, final: false });
  }
  out.push({ id: `st-${galaxyId}-tor`, galaxy: galaxyId, after: list.length - 1, planets: list.map(p => p.id), name: 'Galaxie-Tor', final: true });
  return out;
}
export const stationOpen = (st, progress) => st.planets.every(id => (progress[id]?.bestStars || 0) >= 1);

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
  klammer: { label: 'Klammer missachtet', area: 'zahlen', tip: 'Klammern werden übersehen. Klammern farbig einkreisen und den Klammer-Inhalt zuerst ausrechnen und darüberschreiben lassen.' },
  auslaut: { label: 'Auslaut (d/t, g/k am Wortende)', area: 'buchstaben', tip: 'Verlängerungsprobe üben: Hund → Hunde, Zug → Züge. Am Wortende hört man oft t/k, schreibt aber d/g.' },
  umlaut: { label: 'e/ä bzw. eu/äu', area: 'buchstaben', tip: 'Ableitungsprobe: Gibt es ein verwandtes Wort mit a/au? Hand → Hände, Haus → Häuser.' },
  lautposition: { label: 'Laut-Position nicht erkannt', area: 'buchstaben', tip: 'Phonologische Bewusstheit: Wörter gedehnt sprechen, Laute mit Fingern oder Plättchen abzählen, Anlaut/Inlaut/Auslaut markieren.' },
  sonstiges: { label: 'Sonstiger Fehler', area: 'beide', tip: 'Kein typisches Muster – im Gespräch nachfragen, wie das Kind gerechnet bzw. gelesen hat.' },
};

export const MOODS = [
  { v: 1, e: '😟', t: 'nicht gut' },
  { v: 2, e: '😐', t: 'geht so' },
  { v: 3, e: '🙂', t: 'gut' },
  { v: 4, e: '😄', t: 'super' },
];
