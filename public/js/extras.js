// Motivation & Alltag: Pokale, Lern-Tage, Tagesmission, Kalender-Erinnerung, Töne.
// Bewusst OHNE klassische „Streak“: Bei Kindern mit Lernangst erzeugt eine abreißende Serie
// Druck. Stattdessen zählen Lern-Tage pro Woche – eine Pause wird nie bestraft.
import { PLANETS, PLANET_BY_ID, GALAXIES, planetsOf } from './curriculum.js';

export const emptyStats = () => ({ missions: 0, perfect: 0, tipsUsed: 0, brave: 0, comebacks: 0, words: 0, games: 0, gameKinds: {}, days: [] });

export const TROPHIES = [
  { id: 'start', icon: '🚀', name: 'Startrakete', desc: 'Deine erste Mission gespielt', test: s => s.missions >= 1 },
  { id: 'm10', icon: '🥉', name: 'Bronze-Rakete', desc: '10 Missionen gespielt', test: s => s.missions >= 10 },
  { id: 'm50', icon: '🥈', name: 'Silber-Rakete', desc: '50 Missionen gespielt', test: s => s.missions >= 50 },
  { id: 'm150', icon: '🥇', name: 'Gold-Rakete', desc: '150 Missionen gespielt', test: s => s.missions >= 150 },
  { id: 'perfect1', icon: '⭐', name: 'Volltreffer', desc: 'Eine Mission ganz ohne Fehler', test: s => s.perfect >= 1 },
  { id: 'perfect10', icon: '🌟', name: 'Sternenregen', desc: '10 Missionen ohne Fehler', test: s => s.perfect >= 10 },
  { id: 'helper', icon: '💡', name: 'Kluge Frage', desc: '5-mal Astronautin Nova um Hilfe gebeten – Fragen ist schlau!', test: s => s.tipsUsed >= 5 },
  { id: 'brave', icon: '🦁', name: 'Löwenmut', desc: 'Gespielt, obwohl du dich nicht so gut gefühlt hast', test: s => s.brave >= 1 },
  { id: 'comeback', icon: '💪', name: 'Stehauf-Pokal', desc: 'Einen Planeten geschafft, der vorher nicht geklappt hat', test: s => s.comebacks >= 1 },
  { id: 'planets5', icon: '🧭', name: 'Entdecker-Kompass', desc: '5 Planeten geschafft', test: (s, p) => done(p) >= 5 },
  { id: 'planets20', icon: '🗺️', name: 'Sternenkarte', desc: '20 Planeten geschafft', test: (s, p) => done(p) >= 20 },
  { id: 'galaxy', icon: '👑', name: 'Galaxie-Krone', desc: 'Alle Planeten einer Galaxie geschafft', test: (s, p) => GALAXIES.some(g => planetsOf(g.id).every(x => (p[x.id]?.bestStars || 0) >= 1)) },
  { id: 'levelup', icon: '🌠', name: 'Stufen-Sprung', desc: 'Einen Planeten aus „VS 3–4“ oder „Unterstufe“ geschafft', test: (s, p) => PLANETS.some(x => x.galaxy && !['zahlen', 'buchstaben'].includes(x.galaxy) && (p[x.id]?.bestStars || 0) >= 1) },
  { id: 'words1', icon: '📚', name: 'Wort-Schatz', desc: 'Lernwörter geübt', test: s => s.words >= 1 },
  { id: 'words10', icon: '📖', name: 'Wort-Pokal', desc: '10-mal Lernwörter geübt', test: s => s.words >= 10 },
  { id: 'game1', icon: '🧩', name: 'Rätsel-Fuchs', desc: 'Dein erstes Rätsel gelöst', test: s => s.games >= 1 },
  { id: 'game10', icon: '🏆', name: 'Rätsel-Pokal', desc: '10 Rätsel gelöst', test: s => s.games >= 10 },
  { id: 'allgames', icon: '🎲', name: 'Spiele-Profi', desc: 'Jedes Spiel aus der Spiele-Ecke einmal gelöst', test: s => ['sudoku', 'kreuzwort', 'wortsuche', 'zahlenmauer'].every(k => s.gameKinds?.[k]) },
  { id: 'week3', icon: '📅', name: 'Dranbleiben', desc: 'An 3 Tagen in einer Woche geübt', test: s => maxDaysInAWeek(s.days) >= 3 },
  { id: 'week5', icon: '🔥', name: 'Wochen-Held', desc: 'An 5 Tagen in einer Woche geübt', test: s => maxDaysInAWeek(s.days) >= 5 },
];
const done = p => Object.values(p || {}).filter(x => (x.bestStars || 0) >= 1).length;

// ---------- Lern-Tage ----------
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function weekKey(iso) { const d = new Date(iso + 'T12:00:00'); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.toISOString().slice(0, 10); }
function maxDaysInAWeek(days = []) { const c = {}; for (const d of days) c[weekKey(d)] = (c[weekKey(d)] || 0) + 1; return Math.max(0, ...Object.values(c)); }
export function weekDays(days = []) {
  const now = new Date(); const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((name, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { name, iso, done: days.includes(iso), isToday: iso === today() };
  });
}
export function markDay(stats) { const t = today(); if (!stats.days.includes(t)) { stats.days.push(t); if (stats.days.length > 120) stats.days.splice(0, stats.days.length - 120); } }

/** Statistik nach einer Aktivität aktualisieren und neu verdiente Pokale zurückgeben. */
export function award(profile, progress, change) {
  const s = profile.stats = { ...emptyStats(), ...(profile.stats || {}) };
  profile.trophies ||= {};
  for (const [k, v] of Object.entries(change || {})) {
    if (k === 'gameKind') s.gameKinds[v] = (s.gameKinds[v] || 0) + 1;
    else s[k] = (s[k] || 0) + v;
  }
  markDay(s);
  const fresh = [];
  for (const t of TROPHIES) if (!profile.trophies[t.id] && t.test(s, progress || {})) { profile.trophies[t.id] = today(); fresh.push(t); }
  return fresh;
}

// ---------- Tagesmission ----------
// Vorschlag: der gespielte Planet mit der schwächsten Trefferquote, sonst der nächste offene Planet.
export function dailyMission(progress, isOpen, galaxyId) {
  const played = PLANETS.filter(p => isOpen(p.id) && progress[p.id]?.total);
  const weak = played.map(p => ({ p, acc: progress[p.id].correct / progress[p.id].total })).filter(x => x.acc < 0.85).sort((a, b) => a.acc - b.acc)[0];
  if (weak) return { planet: weak.p, why: 'Hier kannst du noch stärker werden' };
  const next = planetsOf(galaxyId).find(p => isOpen(p.id) && !(progress[p.id]?.bestStars >= 1)) || PLANETS.find(p => isOpen(p.id) && !(progress[p.id]?.bestStars >= 1));
  return next ? { planet: next, why: 'Ein neuer Planet wartet auf dich' } : null;
}

// ---------- Erinnerung (Kalender) ----------
// Web-Apps dürfen keine echten Push-Nachrichten schicken. Der verlässlichste Weg für Eltern:
// ein wiederkehrender Termin im eigenen Kalender, der aufs Handy erinnert.
export function calendarLinks({ time = '16:00', days = ['MO', 'TU', 'WE', 'TH', 'FR'], appUrl = '', appName = 'Lerniversum' }) {
  const [h, m] = time.split(':').map(Number);
  const start = new Date(); start.setHours(h, m, 0, 0); if (start < new Date()) start.setDate(start.getDate() + 1);
  const end = new Date(start.getTime() + 15 * 60000);
  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const text = `🪐 ${appName}: 10 Minuten üben`;
  const details = `Zeit für eine kleine Mission im ${appName}!${appUrl ? '\n' + appUrl : ''}`;
  const g = new URL('https://calendar.google.com/calendar/render');
  g.searchParams.set('action', 'TEMPLATE'); g.searchParams.set('text', text); g.searchParams.set('details', details);
  g.searchParams.set('dates', `${fmt(start)}/${fmt(end)}`); g.searchParams.set('recur', `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')}`);
  const o = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  o.searchParams.set('subject', text); o.searchParams.set('body', details); o.searchParams.set('startdt', start.toISOString()); o.searchParams.set('enddt', end.toISOString());
  return { google: g.toString(), outlook: o.toString() };
}

// ---------- Töne (leise, kurz, abschaltbar) ----------
let ac = null;
export function sound(kind) {
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    const notes = { right: [660, 880], wrong: [330, 294], win: [523, 659, 784, 1047], trophy: [784, 988, 1175, 1568] }[kind] || [440];
    notes.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.11;
      o.type = kind === 'wrong' ? 'sine' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.2);
    });
  } catch { /* Audio nicht verfügbar */ }
}

export const ACTIVITY_NAMES = { lernwoerter: 'Lernwörter-Training' };
export const activityName = id => PLANET_BY_ID[id]?.name || ACTIVITY_NAMES[id] || id;

// ---------- Personalisierung ----------
// Raumschiffe und Weltraum-Farben: einige gibt es erst mit Pokalen (need = Anzahl Pokale)
export const SHIPS = [
  { e: '🚀', name: 'Rakete', need: 0 }, { e: '🛸', name: 'Ufo', need: 0 }, { e: '🛰️', name: 'Satellit', need: 2 },
  { e: '🎈', name: 'Ballon', need: 3 }, { e: '🐉', name: 'Drache', need: 5 }, { e: '🦄', name: 'Einhorn', need: 7 },
  { e: '🐳', name: 'Weltraumwal', need: 9 }, { e: '☄️', name: 'Komet', need: 12 },
];
export const SPACES = [
  { id: 'lila', name: 'Lila Nebel', need: 0, sw: ['#2b1a6e', '#0e3a6e'] }, { id: 'blau', name: 'Tiefsee-Blau', need: 0, sw: ['#0b3a78', '#062a4f'] },
  { id: 'gruen', name: 'Polarlicht', need: 2, sw: ['#0d5c4a', '#1a3d6e'] }, { id: 'rosa', name: 'Zuckerwatte', need: 4, sw: ['#6b1d5c', '#2b1a6e'] },
  { id: 'orange', name: 'Sonnenaufgang', need: 6, sw: ['#7a3412', '#4a1650'] }, { id: 'nacht', name: 'Stille Nacht', need: 8, sw: ['#14142a', '#0a0a14'] },
];
export const RANKS = [
  { min: 0, name: 'Weltraum-Kadett', icon: '🌱' }, { min: 10, name: 'Raketen-Pilot', icon: '🚀' }, { min: 30, name: 'Sternen-Kapitän', icon: '⭐' },
  { min: 60, name: 'Planeten-Kommandant', icon: '🪐' }, { min: 100, name: 'Galaxie-Admiral', icon: '🌌' }, { min: 160, name: 'Universums-Legende', icon: '👑' },
];
export function rankFor(stars) {
  const i = RANKS.reduce((acc, r, idx) => (stars >= r.min ? idx : acc), 0);
  return { ...RANKS[i], next: RANKS[i + 1] || null };
}
