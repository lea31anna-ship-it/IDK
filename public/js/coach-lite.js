// Serverloses Coach-Dashboard: speichert Kinder privat in der Artifact-Datenbank
// (Pfad data/users/<deine-id>/ – nur für dich lesbar). Ohne Datenbank: im Browser.
import { start } from './coach.js';
import { pinGate, changePin } from './coach-pin.js';
import { PLANET_BY_ID, DEFAULT_UNLOCKED } from './curriculum.js';
import { encodeKidCode, kidHash, decodeReport, decodeKidCode, AVATARS, cleanName, prettyName } from './codec.js';

let KID_APP_URL = document.querySelector('meta[name="sh-kid-app"]')?.content || '';
const MAX_SESSIONS = 400, MAX_ERRORS = 600;
const now = () => new Date().toISOString();
const err = m => { throw new Error(m); };

// ---------- Speicher ----------
let store = null; // { all(): Promise<{kids, settings}>, putKid(k), delKid(id), putSettings(s) }

async function dbStore() {
  for (let i = 0; i < 20 && !window.claude?.use; i++) await new Promise(r => setTimeout(r, 100));
  const claude = window.claude;
  if (!claude?.use) return null;
  const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
  if (!db || !user) return null;
  const uid = await user.id();
  if (!uid) return null;
  const col = db.collection('data/users/' + uid);
  return {
    async all() {
      const snap = await col.get();
      const kids = [], settings = {};
      for (const d of snap.docs) {
        const v = d.data() || {};
        if (d.id === 'settings') Object.assign(settings, v);
        else if (d.id.startsWith('kid-')) kids.push(v);
      }
      return { kids, settings };
    },
    putKid: k => col.doc('kid-' + k.id).set(JSON.parse(JSON.stringify(k))),
    delKid: id => col.doc('kid-' + id).delete(),
    putSettings: s => col.doc('settings').set(s),
    async getPin() { const d = await col.doc('pin').get(); return d.exists ? d.data() : null; },
    putPin: rec => col.doc('pin').set(rec),
  };
}
function localStore() {
  const get = () => { try { return JSON.parse(localStorage.getItem('sh_lite_db')) || { kids: [], settings: {} }; } catch { return { kids: [], settings: {} }; } };
  const put = v => { try { localStorage.setItem('sh_lite_db', JSON.stringify(v)); } catch { } };
  return {
    local: true,
    async all() { return get(); },
    async putKid(k) { const v = get(); v.kids = v.kids.filter(x => x.id !== k.id).concat(k); put(v); },
    async delKid(id) { const v = get(); v.kids = v.kids.filter(x => x.id !== id); put(v); },
    async putSettings(s) { const v = get(); v.settings = s; put(v); },
    async getPin() { return get().pin || null; },
    async putPin(rec) { const v = get(); v.pin = rec; put(v); },
  };
}

// ---------- Daten ----------
let state = { kids: [], settings: { practiceName: '', coachName: '', contactUrl: '', welcome: '' } };
const byId = id => state.kids.find(k => k.id === id) || err('Kind nicht gefunden');
function recode(k) { k.code = encodeKidCode({ name: k.name, id: k.num, avatar: Math.max(0, AVATARS.indexOf(k.avatar)), autoAdvance: k.autoAdvance, unlocked: k.unlocked }); return k; }
async function save(k) {
  if (k.sessions.length > MAX_SESSIONS) k.sessions.splice(0, k.sessions.length - MAX_SESSIONS);
  if (k.errors.length > MAX_ERRORS) k.errors.splice(0, k.errors.length - MAX_ERRORS);
  await store.putKid(k); return k;
}
function newKid(name, avatar, num) {
  const k = { id: 'k' + num, num, name, avatar: AVATARS.includes(avatar) ? avatar : AVATARS[0], createdAt: now(), lastActive: null, unlocked: [...DEFAULT_UNLOCKED], autoAdvance: true, progress: {}, sessions: [], errors: [], messages: [], notes: '' };
  return recode(k);
}
function freeNum() { for (;;) { const n = 1 + Math.floor(Math.random() * 65534); if (!state.kids.some(k => k.num === n)) return n; } }
const daysAgo = ts => ts ? (Date.now() - Date.parse(ts)) / 86400000 : Infinity;
function summary(k) {
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
    unreadMessages: 0, recentSessions: k.sessions.filter(s => daysAgo(s.ts) < 14),
  };
}

async function importReport(text) {
  const r = await decodeReport(text);
  let k = state.kids.find(x => x.num === r.id), created = false;
  if (!k) {
    // Kind aus dem Code wiederherstellen (z. B. anderes Gerät der Coachin)
    const c = decodeKidCode(r.code || '');
    k = newKid(c?.name || prettyName(cleanName(r.name)), c?.avatar, r.id);
    if (c) { k.unlocked = c.unlocked; k.autoAdvance = c.autoAdvance; recode(k); }
    state.kids.push(k); created = true;
  }
  const seenS = new Set(k.sessions.map(s => s.ts + s.planetId));
  const fresh = r.sessions.filter(s => !seenS.has(s.ts + s.planetId));
  k.sessions = [...k.sessions, ...fresh].sort((a, b) => a.ts.localeCompare(b.ts));
  // Stimmung nachträglich angegeben? -> aktualisieren
  for (const s of r.sessions) { const o = k.sessions.find(x => x.ts === s.ts && x.planetId === s.planetId); if (o && s.moodAfter) o.moodAfter = s.moodAfter; }
  const seenE = new Set(k.errors.map(e => e.ts + e.task + e.given));
  k.errors = [...k.errors, ...r.errors.filter(e => !seenE.has(e.ts + e.task + e.given))].sort((a, b) => a.ts.localeCompare(b.ts));
  for (const [pid, p] of Object.entries(r.progress)) {
    const o = k.progress[pid];
    k.progress[pid] = !o || (p.attempts || 0) >= (o.attempts || 0) ? p : o;
  }
  const last = k.sessions.at(-1)?.ts;
  if (last && (!k.lastActive || last > k.lastActive)) k.lastActive = last;
  await save(k);
  return { kid: k, created, newSessions: fresh.length };
}

// ---------- „API“ wie beim Server ----------
async function call(path, { method = 'GET', body = {} } = {}) {
  if (path === '/api/coach/overview') return { kids: state.kids.map(summary) };
  if (path === '/api/coach/settings') {
    if (method === 'PUT') {
      const url = String(body.contactUrl || '').trim().slice(0, 300);
      state.settings = { practiceName: String(body.practiceName || '').slice(0, 80), coachName: String(body.coachName || '').slice(0, 60), contactUrl: /^https?:\/\//i.test(url) ? url : '', welcome: String(body.welcome || '').slice(0, 400) };
      await store.putSettings(state.settings);
    }
    return state.settings;
  }
  if (path === '/api/coach/logout') return { ok: true };
  if (path === '/api/coach/import') return importReport(body.text);
  if (path === '/api/coach/kids' && method === 'POST') {
    const name = String(body.name || '').trim().slice(0, 40);
    if (!name) err('Bitte einen Namen eingeben');
    const k = newKid(name, body.avatar, freeNum());
    state.kids.push(k); return save(k);
  }
  const m = /^\/api\/coach\/kids\/([^/]+)(\/[a-z]+)?$/.exec(path);
  if (m) {
    const k = byId(m[1]), sub = m[2];
    if (!sub && method === 'GET') return k;
    if (!sub && method === 'PATCH') {
      if (body.name !== undefined) k.name = String(body.name).trim().slice(0, 40) || k.name;
      if (body.avatar !== undefined) k.avatar = AVATARS.includes(body.avatar) ? body.avatar : k.avatar;
      if (Array.isArray(body.unlocked)) k.unlocked = [...new Set(body.unlocked.filter(id => PLANET_BY_ID[id]))];
      if (body.autoAdvance !== undefined) k.autoAdvance = !!body.autoAdvance;
      if (body.notes !== undefined) k.notes = String(body.notes).slice(0, 20000);
      recode(k); return save(k);
    }
    if (!sub && method === 'DELETE') { state.kids = state.kids.filter(x => x !== k); await store.delKid(k.id); return { ok: true }; }
    if (sub === '/reset') { k.progress = {}; k.sessions = []; k.errors = []; return save(k); }
    if (sub === '/messages') {
      const t = String(body.text || '').trim().slice(0, 160);
      if (!t) err('Leere Nachricht');
      k.messages.push({ id: String(Date.now()), text: t, ts: now(), read: false }); return save(k);
    }
  }
  err('Nicht unterstützt');
}

function kidLink(k, message) { return `${KID_APP_URL}#${kidHash(k.code, message)}`; }

let booted = false;
export async function bootLite(hostEl, { onExit = null, kidAppUrl = null } = {}) {
  if (kidAppUrl) KID_APP_URL = kidAppUrl;
  hostEl.innerHTML = '<p style="padding:24px" class="muted">Coach-Bereich wird geladen …</p>';
  if (!booted) {
    try { store = await Promise.race([dbStore(), new Promise(r => setTimeout(() => r(null), 10000))]); } catch { store = null; }
    if (!store) store = localStore();
    try {
      const all = await store.all();
      state.kids = all.kids || [];
      state.settings = { ...state.settings, ...(all.settings || {}) };
    } catch (e) {
      hostEl.innerHTML = `<p style="padding:24px">Die Daten konnten nicht geladen werden (${String(e.message || e.code || e)}). Bitte Seite neu laden.</p>`;
      return;
    }
    booted = true;
  }
  if (!crypto?.subtle) { hostEl.innerHTML = '<p style="padding:24px">Dieser Browser unterstützt die PIN-Sperre nicht. Bitte einen aktuellen Browser verwenden.</p>'; return; }
  await pinGate(hostEl, store);
  const lite = {
    call, kidLink, kidAppUrl: KID_APP_URL, local: !!store.local, onExit,
    async changePin() {
      const done = await changePin(hostEl, store);
      start(lite, hostEl);
      if (done) { const t = hostEl.querySelector('.lv-toast'); t.textContent = 'Neuer PIN gespeichert ✓'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2600); }
    },
  };
  start(lite, hostEl);
}
if (document.querySelector('meta[name="sh-lite"]')) bootLite(document.querySelector('.lv-coach'));
