// Sternenhüpfer – Server ohne externe Abhängigkeiten.
// Liefert die Kinder-App (/), das Coach-Dashboard (/coach) und eine kleine JSON-API.
// Daten liegen in DATA_DIR/db.json (Standard: ./data).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PLANET_BY_ID, DEFAULT_UNLOCKED, ERROR_TYPES, starsFor, TASKS_PER_MISSION } from './public/js/curriculum.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PUBLIC = path.join(__dirname, 'public');
const COACH_TTL = 1000 * 60 * 60 * 12; // 12 Stunden

// ---------- Datenbank (JSON-Datei, atomar geschrieben) ----------
const emptyDb = () => ({
  coach: null, // { salt, hash }
  settings: { practiceName: '', coachName: '', contactUrl: '', welcome: '' },
  kids: [],
});
let db = emptyDb();
function loadDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) db = { ...emptyDb(), ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  if (!db.coach && process.env.COACH_PASSWORD) db.coach = hashPassword(process.env.COACH_PASSWORD);
  saveDb();
}
let saveTimer = null;
function saveDb() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 1));
    fs.renameSync(tmp, DB_FILE);
  }, 50);
}

// ---------- Hilfsfunktionen ----------
function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(String(pw), salt, 64).toString('hex') };
}
function checkPassword(pw, rec) {
  if (!rec) return false;
  const h = crypto.scryptSync(String(pw), rec.salt, 64);
  return crypto.timingSafeEqual(h, Buffer.from(rec.hash, 'hex'));
}
const CODE_WORDS = ['STERN', 'MOND', 'KOMET', 'RAKETE', 'PLANET', 'SONNE', 'ORBIT', 'NOVA', 'GALAXIE', 'ASTRO'];
const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
function newCode() {
  for (;;) {
    const c = `${CODE_WORDS[crypto.randomInt(CODE_WORDS.length)]}-${crypto.randomInt(1000, 10000)}`;
    if (!db.kids.some(k => normCode(k.code) === normCode(c))) return c;
  }
}
const uid = () => crypto.randomBytes(8).toString('hex');
const clip = (s, n) => String(s ?? '').slice(0, n);
const now = () => new Date().toISOString();

const coachSessions = new Map(); // token -> expires
function coachAuth(req) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, '');
  const exp = coachSessions.get(t);
  if (!exp || exp < Date.now()) { coachSessions.delete(t); return false; }
  return true;
}
function kidAuth(req) {
  const code = normCode(req.headers['x-kid-code']);
  return code ? db.kids.find(k => normCode(k.code) === code) : null;
}

// Einfaches Rate-Limit gegen Code-/Passwort-Raten
const attempts = new Map();
function limited(key, max = 10, windowMs = 10 * 60 * 1000) {
  const t = Date.now();
  const list = (attempts.get(key) || []).filter(x => t - x < windowMs);
  list.push(t); attempts.set(key, list);
  return list.length > max;
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 200_000) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(new Error('bad json')); } });
    req.on('error', reject);
  });
}

// Daten, die das Kind über sich sehen darf (keine Notizen der Coachin!)
function kidPublic(k) {
  return {
    name: k.name, avatar: k.avatar, code: k.code, unlocked: k.unlocked, autoAdvance: k.autoAdvance,
    progress: k.progress, messages: k.messages.filter(m => !m.read).map(({ id, text, ts }) => ({ id, text, ts })),
    coachName: db.settings.coachName, practiceName: db.settings.practiceName,
  };
}
function kidSummary(k) {
  const recent = k.sessions.slice(-10);
  const moods = recent.filter(s => s.moodAfter).map(s => s.moodAfter);
  const tasks = recent.reduce((a, s) => a + s.total, 0);
  return {
    id: k.id, name: k.name, avatar: k.avatar, code: k.code, createdAt: k.createdAt, lastActive: k.lastActive,
    stars: Object.values(k.progress).reduce((a, p) => a + (p.bestStars || 0), 0),
    planetsDone: Object.values(k.progress).filter(p => p.bestStars >= 1).length,
    sessions: k.sessions.length, unlockedCount: k.unlocked.length,
    accuracy: tasks ? Math.round(100 * recent.reduce((a, s) => a + s.correct, 0) / tasks) : null,
    mood: moods.length ? Math.round(10 * moods.reduce((a, b) => a + b, 0) / moods.length) / 10 : null,
    unreadMessages: k.messages.filter(m => !m.read).length,
  };
}

// ---------- API ----------
async function api(req, res, url) {
  const p = url.pathname; const m = req.method;
  const ip = req.socket.remoteAddress;

  if (p === '/api/info' && m === 'GET') {
    const { practiceName, coachName, contactUrl, welcome } = db.settings;
    return send(res, 200, { practiceName, coachName, contactUrl, welcome, serverMode: true });
  }

  // --- Kinder ---
  if (p === '/api/kid/login' && m === 'POST') {
    if (limited('kid:' + ip, 20)) return send(res, 429, { error: 'Zu viele Versuche. Bitte warte ein paar Minuten.' });
    const { code } = await readBody(req);
    const k = db.kids.find(x => normCode(x.code) === normCode(code));
    if (!k) return send(res, 404, { error: 'Diesen Code kenne ich nicht. Frag deine Coachin!' });
    k.lastActive = now(); saveDb();
    return send(res, 200, kidPublic(k));
  }
  if (p.startsWith('/api/kid/')) {
    const k = kidAuth(req);
    if (!k) return send(res, 401, { error: 'Code ungültig' });
    if (p === '/api/kid/me' && m === 'GET') return send(res, 200, kidPublic(k));
    if (p === '/api/kid/result' && m === 'POST') {
      const b = await readBody(req);
      if (!PLANET_BY_ID[b.planetId]) return send(res, 400, { error: 'Unbekannter Planet' });
      const total = Math.min(Math.max(Number(b.total) || TASKS_PER_MISSION, 1), 50);
      const correct = Math.min(Math.max(Number(b.correct) || 0, 0), total);
      const stars = starsFor(correct, total);
      const mood = v => (Number.isInteger(v) && v >= 1 && v <= 4 ? v : null);
      const ts = now();
      const pr = k.progress[b.planetId] ||= { bestStars: 0, attempts: 0, correct: 0, total: 0 };
      pr.attempts++; pr.correct += correct; pr.total += total; pr.bestStars = Math.max(pr.bestStars, stars); pr.lastPlayed = ts; pr.lastStars = stars;
      k.sessions.push({ ts, planetId: b.planetId, correct, total, stars, moodBefore: mood(b.moodBefore), moodAfter: mood(b.moodAfter), tips: Math.max(0, Number(b.tips) || 0), durationSec: Math.max(0, Math.round(Number(b.durationSec) || 0)) });
      if (k.sessions.length > 1000) k.sessions.splice(0, k.sessions.length - 1000);
      for (const e of (Array.isArray(b.errors) ? b.errors.slice(0, 50) : [])) {
        k.errors.push({ ts, planetId: b.planetId, task: clip(e.task, 60), given: clip(e.given, 40), expected: clip(e.expected, 40), type: ERROR_TYPES[e.type] ? e.type : 'sonstiges' });
      }
      if (k.errors.length > 3000) k.errors.splice(0, k.errors.length - 3000);
      k.lastActive = ts; saveDb();
      return send(res, 200, kidPublic(k));
    }
    if (p === '/api/kid/mood' && m === 'POST') { // Stimmung nach der Mission nachtragen
      const b = await readBody(req);
      const s = [...k.sessions].reverse().find(x => x.planetId === b.planetId);
      if (s && Number.isInteger(b.moodAfter) && b.moodAfter >= 1 && b.moodAfter <= 4) { s.moodAfter = b.moodAfter; saveDb(); }
      return send(res, 200, { ok: true });
    }
    if (p === '/api/kid/messages/read' && m === 'POST') {
      const { ids = [] } = await readBody(req);
      for (const msg of k.messages) if (ids.includes(msg.id)) { msg.read = true; msg.readAt = now(); }
      saveDb(); return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: 'Nicht gefunden' });
  }

  // --- Coach ---
  if (p === '/api/coach/status' && m === 'GET') return send(res, 200, { setup: !!db.coach, loggedIn: coachAuth(req) });
  if (p === '/api/coach/setup' && m === 'POST') {
    if (db.coach) return send(res, 403, { error: 'Bereits eingerichtet' });
    const { password } = await readBody(req);
    if (!password || String(password).length < 8) return send(res, 400, { error: 'Das Passwort braucht mindestens 8 Zeichen.' });
    db.coach = hashPassword(password); saveDb();
    const token = crypto.randomBytes(24).toString('hex'); coachSessions.set(token, Date.now() + COACH_TTL);
    return send(res, 200, { token });
  }
  if (p === '/api/coach/login' && m === 'POST') {
    if (limited('coach:' + ip, 8)) return send(res, 429, { error: 'Zu viele Versuche. Bitte in 10 Minuten erneut versuchen.' });
    const { password } = await readBody(req);
    if (!checkPassword(password || '', db.coach)) return send(res, 401, { error: 'Passwort falsch' });
    const token = crypto.randomBytes(24).toString('hex'); coachSessions.set(token, Date.now() + COACH_TTL);
    return send(res, 200, { token });
  }
  if (!p.startsWith('/api/coach/')) return send(res, 404, { error: 'Nicht gefunden' });
  if (!coachAuth(req)) return send(res, 401, { error: 'Bitte anmelden' });

  if (p === '/api/coach/logout' && m === 'POST') { coachSessions.delete((req.headers.authorization || '').replace(/^Bearer /, '')); return send(res, 200, { ok: true }); }
  if (p === '/api/coach/password' && m === 'POST') {
    const { oldPassword, newPassword } = await readBody(req);
    if (!checkPassword(oldPassword || '', db.coach)) return send(res, 401, { error: 'Altes Passwort falsch' });
    if (!newPassword || String(newPassword).length < 8) return send(res, 400, { error: 'Mindestens 8 Zeichen' });
    db.coach = hashPassword(newPassword); saveDb(); return send(res, 200, { ok: true });
  }
  if (p === '/api/coach/settings') {
    if (m === 'GET') return send(res, 200, db.settings);
    if (m === 'PUT') {
      const b = await readBody(req);
      const url = clip(b.contactUrl, 300).trim();
      db.settings = { practiceName: clip(b.practiceName, 80), coachName: clip(b.coachName, 60), contactUrl: /^(https?:\/\/|mailto:|tel:)/i.test(url) ? url : '', welcome: clip(b.welcome, 400) };
      saveDb(); return send(res, 200, db.settings);
    }
  }
  if (p === '/api/coach/export' && m === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="sternenhuepfer-backup-${now().slice(0, 10)}.json"` });
    return res.end(JSON.stringify({ exportedAt: now(), settings: db.settings, kids: db.kids }, null, 1));
  }
  if (p === '/api/coach/overview' && m === 'GET') {
    return send(res, 200, { kids: db.kids.map(k => ({ ...kidSummary(k), recentSessions: k.sessions.filter(s => Date.now() - Date.parse(s.ts) < 1000 * 60 * 60 * 24 * 14) })) });
  }
  if (p === '/api/coach/kids' && m === 'POST') {
    const b = await readBody(req);
    const name = clip(b.name, 40).trim();
    if (!name) return send(res, 400, { error: 'Bitte einen Namen eingeben' });
    const k = { id: uid(), name, avatar: clip(b.avatar || '🧑‍🚀', 8), code: newCode(), createdAt: now(), lastActive: null, unlocked: [...DEFAULT_UNLOCKED], autoAdvance: true, progress: {}, sessions: [], errors: [], messages: [], notes: '' };
    db.kids.push(k); saveDb();
    return send(res, 200, k);
  }
  const km = /^\/api\/coach\/kids\/([a-f0-9]+)(\/[a-z]+)?$/.exec(p);
  if (km) {
    const k = db.kids.find(x => x.id === km[1]);
    if (!k) return send(res, 404, { error: 'Kind nicht gefunden' });
    const sub = km[2];
    if (!sub && m === 'GET') return send(res, 200, k);
    if (!sub && m === 'PATCH') {
      const b = await readBody(req);
      if (b.name !== undefined) k.name = clip(b.name, 40).trim() || k.name;
      if (b.avatar !== undefined) k.avatar = clip(b.avatar, 8);
      if (Array.isArray(b.unlocked)) k.unlocked = [...new Set(b.unlocked.filter(id => PLANET_BY_ID[id]))];
      if (b.autoAdvance !== undefined) k.autoAdvance = !!b.autoAdvance;
      if (b.notes !== undefined) k.notes = clip(b.notes, 20000);
      saveDb(); return send(res, 200, k);
    }
    if (!sub && m === 'DELETE') { db.kids = db.kids.filter(x => x !== k); saveDb(); return send(res, 200, { ok: true }); }
    if (sub === '/code' && m === 'POST') { k.code = newCode(); saveDb(); return send(res, 200, k); }
    if (sub === '/reset' && m === 'POST') { k.progress = {}; k.sessions = []; k.errors = []; saveDb(); return send(res, 200, k); }
    if (sub === '/messages' && m === 'POST') {
      const { text } = await readBody(req);
      const t = clip(text, 500).trim();
      if (!t) return send(res, 400, { error: 'Leere Nachricht' });
      k.messages.push({ id: uid(), text: t, ts: now(), read: false }); saveDb();
      return send(res, 200, k);
    }
  }
  return send(res, 404, { error: 'Nicht gefunden' });
}

// ---------- Statische Dateien ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  if (rel === '/coach' || rel === '/coach/') rel = '/coach.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Nicht gefunden'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'",
};

export function createServer() {
  return http.createServer(async (req, res) => {
    for (const [h, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(h, v);
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname.startsWith('/api/')) return await api(req, res, url);
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
      serveStatic(req, res, url);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) send(res, 400, { error: 'Anfrage fehlerhaft' });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadDb();
  createServer().listen(PORT, () => {
    console.log(`🚀 Sternenhüpfer läuft auf http://localhost:${PORT}`);
    console.log(`   Coach-Dashboard: http://localhost:${PORT}/coach`);
    if (!db.coach) console.log('   ⚠ Noch kein Coach-Passwort gesetzt – bitte sofort /coach öffnen und einrichten (oder COACH_PASSWORD setzen).');
  });
}
export { loadDb };
