import { placementPlan, SCHULSTUFEN, stufeLabel, evaluatePlacement, PLACEMENT_STATUS, PLANET_LEVELS, levelStars, levelOpen, nextLevel, stationsOf, stationOpen, STATION_TARGET, chainOf, galaxyDone } from './curriculum.js';
import { APP_NAME, LEVELS, GALAXIES, PLANETS, PLANET_BY_ID, planetsOf, isUnlocked, starsFor, MOODS, TASKS_PER_MISSION, PASS_CORRECT, DEFAULT_UNLOCKED } from './curriculum.js';
import { generateMission, syllablesOf, stationQuiz } from './exercises.js';
import { decodeKidCode, parseKidHash, encodeReport, decodeExtra, unpackExtra, AVATARS } from './codec.js';
import { TROPHIES, emptyStats, award, weekDays, dailyMission, calendarLinks, sound, today, SHIPS, SPACES, rankFor } from './extras.js';
import { cleanWord, syllablesOfCustom, parseWordInput, wordMission } from './words.js';
import { GAMES, renderGame } from './games.js';
import { pick } from './util.js';
import { waLink, mailLink } from './org-model.js';

const $app = document.getElementById('app');
const $modal = document.getElementById('modal-root');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('sh_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('sh_' + k, JSON.stringify(v)); } catch { /* privater Modus */ } },
  del(k) { try { localStorage.removeItem('sh_' + k); } catch { } },
};

const state = {
  mode: null, // 'public' | 'kid'
  kid: null, code: null, info: null, server: false,
  offline: false, // Kind mit Code, aber ohne Server (Fortschritt lokal, Bericht per Text)
  progress: {}, unlocked: [], autoAdvance: true,
  galaxy: store.get('galaxy', 'mengen5'),
  settings: { fontSize: 'm', spacing: false, font: 'verdana', tint: 'none', autoread: false, calm: false, syll: true, sound: true, voiceSpeed: 'normal', ...store.get('settings', {}) },
};

// ---------- Server ----------
async function apiCall(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.code) headers['X-Kid-Code'] = state.code;
  const r = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || 'Fehler'), { status: r.status });
  return data;
}

// ---------- Einstellungen / Vorlesen ----------
function applySettings() {
  const s = state.settings, b = document.body;
  b.className = '';
  if (s.fontSize === 'l') b.classList.add('fs-l');
  if (s.fontSize === 'xl') b.classList.add('fs-xl');
  if (s.spacing) b.classList.add('spacing');
  if (s.font === 'system') b.classList.add('font-system');
  if (s.font === 'comic') b.classList.add('font-comic');
  if (s.tint !== 'none') b.classList.add('tint-' + s.tint);
  if (s.calm) b.classList.add('calm');
  store.set('settings', s);
}
// ---------- Vorlesen ----------
// Natürlich klingende Stimmen bevorzugen (Neural/Natural/Online/Premium), Tempo nicht zu extrem,
// lange Texte satzweise vorlesen (manche Browser brechen lange Texte sonst mittendrin ab).
let voice = null;
const germanVoices = () => (window.speechSynthesis?.getVoices() || []).filter(v => /^de(-|_|$)/i.test(v.lang));
function voiceScore(v) {
  let sc = 0;
  if (/natural|neural|online|premium|enhanced|wavenet/i.test(v.name)) sc += 50;
  if (/google/i.test(v.name)) sc += 25;
  if (/katja|conrad|seraphina|florian|amala|ingrid|jonas|anna|petra|helena|marlene|vicki/i.test(v.name)) sc += 15;
  if (/de-AT/i.test(v.lang)) sc += 8; else if (/de-DE/i.test(v.lang)) sc += 5;
  if (v.localService === false) sc += 5;
  if (/compact|eloquence|espeak/i.test(v.name)) sc -= 30;
  return sc;
}
function pickVoice() {
  const vs = germanVoices();
  voice = vs.find(v => v.name === state.settings.voiceName) || vs.sort((a, b) => voiceScore(b) - voiceScore(a))[0] || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text, rate = 1) {
  if (!('speechSynthesis' in window) || !text) return;
  const synth = speechSynthesis;
  if (synth.speaking || synth.pending) synth.cancel();
  const base = { slow: 0.85, normal: 1, fast: 1.12 }[state.settings.voiceSpeed || 'normal'] || 1;
  const r = Math.min(1.15, Math.max(0.78, rate)) * base * 0.95;
  const parts = String(text).replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+["“”«»]?\s*|[^.!?]+$/g) || [String(text)];
  clearTimeout(speak.t);
  speak.t = setTimeout(() => parts.map(x => x.trim()).filter(Boolean).forEach(x => {
    const u = new SpeechSynthesisUtterance(x);
    u.lang = voice?.lang || 'de-DE'; u.rate = r; u.pitch = 1.03; if (voice) u.voice = voice;
    synth.speak(u);
  }), 80);
}
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200);
}
function confetti(n = 24) {
  if (state.settings.calm) return;
  const items = ['⭐', '✨', '🌟', '💫', '🪐'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti'; c.textContent = items[i % items.length];
    c.style.left = Math.random() * 100 + 'vw'; c.style.animationDelay = Math.random() * .6 + 's';
    document.body.appendChild(c); setTimeout(() => c.remove(), 3000);
  }
}
// Wort mit farbigen Silben (Silbenmethode), wenn eingeschaltet
function wordHtml(w, allowSyll = true) {
  const s = syllablesOf(w);
  if (!allowSyll || !state.settings.syll || !s || s.length < 2) return esc(w);
  return s.map((x, i) => `<span class="syl${(i % 2) + 1}">${esc(x)}</span>`).join('');
}

// ---------- Sternenhimmel ----------
(function starfield() {
  const c = document.getElementById('stars'), ctx = c.getContext('2d');
  let stars = [];
  const resize = () => {
    c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
    stars = Array.from({ length: Math.round(innerWidth * innerHeight / 5000) }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, r: (Math.random() * 1.4 + .3) * devicePixelRatio, p: Math.random() * 6.28, s: Math.random() * .02 + .005 }));
  };
  resize(); addEventListener('resize', resize);
  let shoot = null;
  (function frame() {
    ctx.clearRect(0, 0, c.width, c.height);
    const calm = state.settings.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (const s of stars) {
      if (!calm) s.p += s.s;
      ctx.globalAlpha = .45 + .55 * Math.abs(Math.sin(s.p));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
    }
    if (!calm) {
      if (!shoot && Math.random() < .003) shoot = { x: Math.random() * c.width, y: Math.random() * c.height * .4, l: 0 };
      if (shoot) {
        shoot.l += 1; const len = 80 * devicePixelRatio;
        ctx.globalAlpha = 1 - shoot.l / 40; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * devicePixelRatio;
        ctx.beginPath(); ctx.moveTo(shoot.x + shoot.l * 12, shoot.y + shoot.l * 6); ctx.lineTo(shoot.x + shoot.l * 12 - len, shoot.y + shoot.l * 6 - len / 2); ctx.stroke();
        if (shoot.l > 40) shoot = null;
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  })();
})();

// ---------- Modals ----------
function openModal(html, { center = false, onClose } = {}) {
  $modal.innerHTML = `<div class="sheet-backdrop ${center ? 'center' : ''}"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  const bd = $modal.firstElementChild;
  bd.addEventListener('click', e => { if (e.target === bd) closeModal(onClose); });
  bd.querySelector('button, input')?.focus();
  return bd.querySelector('.sheet');
}
function closeModal(cb) { $modal.innerHTML = ''; cb?.(); }

// ---------- Startbildschirm ----------
function renderStart() {
  state.mode = null;
  document.body.dataset.space = (store.get('prof_public', {}).look || {}).space || 'lila';
  const i = state.info || {};
  $app.innerHTML = `
    <section class="start">
      <div class="logo-rocket" aria-hidden="true">🪐</div>
      <h1 class="logo">${APP_NAME}</h1>
      <p class="tagline">Hüpf von Planet zu Planet und werde ein Rechen- und Lese-Profi!</p>
      ${i.welcome ? `<p class="tagline">${esc(i.welcome)}</p>` : ''}
      <div class="choices panel">
        <button class="btn primary block" id="go-public">🌍 Losfliegen</button>
        <button class="btn block" id="show-code">🔑 Ich habe einen Code</button>
        <form class="code-box hidden" id="code-form" autocomplete="off">
          <label for="code" class="who-sub">Deinen Code bekommst du von deiner Coachin oder deinem Coach.</label>
          <input id="code" class="code-input" placeholder="${state.server ? 'STERN-1234' : 'MIA-ABCD-EFGH-JKLMN'}" inputmode="text" autocapitalize="characters" spellcheck="false" maxlength="40">
          <p class="err" id="code-err"></p>
          <button class="btn primary block" type="submit">Einsteigen ✨</button>
        </form>
        <button class="btn block" id="open-settings">⚙️ Schrift & Farben</button>
      </div>
      ${i.practiceName || i.coachName ? `
      <div class="parents-box panel">
        <h3>👋 Für Eltern</h3>
        <p style="margin:0">${APP_NAME} ist ein Angebot von <strong>${esc(i.practiceName || i.coachName)}</strong>${i.practiceName && i.coachName ? ` (${esc(i.coachName)})` : ''} – Lerncoaching bei Legasthenie und Dyskalkulie.
        Kein Zeitdruck, keine Werbung, keine Daten in der freien Version.</p>
        ${i.contactUrl ? `<p style="margin:.6em 0 0"><a href="${esc(i.contactUrl)}" target="_blank" rel="noopener">Kontakt & Beratung →</a></p>` : ''}
      </div>` : ''}
      <button class="btn coach-login" id="coach-login">🔐 Coach-Login</button>
      <p class="presented">${APP_NAME} · Lerncoaching bei Legasthenie & Dyskalkulie</p>
    </section>`;
  document.getElementById('coach-login').onclick = coachLogin;
  document.getElementById('go-public').onclick = () => { state.mode = 'public'; state.progress = store.get('public_progress', {}); renderMap(); };
  document.getElementById('open-settings').onclick = openSettings;
  const sc = document.getElementById('show-code');
  if (sc) sc.onclick = () => { document.getElementById('code-form').classList.remove('hidden'); sc.classList.add('hidden'); document.getElementById('code').focus(); };
  const form = document.getElementById('code-form');
  if (form) form.onsubmit = async e => {
    e.preventDefault();
    const code = document.getElementById('code').value.trim();
    const err = document.getElementById('code-err');
    if (!code) { err.textContent = 'Bitte gib deinen Code ein.'; return; }
    err.textContent = '';
    const local = decodeKidCode(code);
    if (local) { offlineLogin(local); return; }
    if (!state.server) { err.textContent = 'Dieser Code stimmt nicht. Schau nochmal genau hin – oder frag deine Coachin!'; return; }
    try { await kidLogin(code); } catch (x) { err.textContent = x.message; }
  };
}

async function kidLogin(code) {
  const data = await apiCall('/api/kid/login', { method: 'POST', body: { code } });
  state.code = data.code; store.set('code', data.code);
  setKid(data); state.mode = 'kid';
  renderMap();
}
function setKid(d) {
  state.kid = d; state.progress = d.progress || {}; state.unlocked = d.unlocked || []; state.autoAdvance = d.autoAdvance !== false;
}
// ---------- Code-Kinder ohne Server ----------
const offlineKids = () => store.get('offline_kids', {});
function saveOffline(k) { const all = offlineKids(); all[k.id] = k; store.set('offline_kids', all); store.set('offline_current', k.id); }
function offlineLogin(c, message = null, extra = null) {
  const all = offlineKids();
  const k = all[c.id] || { id: c.id, progress: {}, sessions: [], errors: [], seen: [] };
  Object.assign(k, { name: c.name, avatar: c.avatar, code: c.code, unlocked: c.unlocked, autoAdvance: c.autoAdvance });
  if (extra) { k.wordLists = extra.wordLists; k.reward = extra.reward; if (extra.contact) k.contact = extra.contact; if (extra.stufe != null) k.stufe = extra.stufe; } // nur aus einem Link der Coachin
  k.mailbox ||= [];
  k.inbox ||= [];
  if (message) {
    const mid = String(message.length) + ':' + message.slice(0, 40);
    if (!k.seen.includes(mid) && !k.inbox.some(x => x.id === mid)) k.inbox = [{ id: mid, text: message }];
    if (!k.mailbox.some(x => x.text === message)) k.mailbox.push({ text: message, ts: new Date().toISOString() });
  }
  saveOffline(k);
  state.offline = true; state.code = null; state.mode = 'kid';
  setKid({ ...k, coachName: '', messages: k.inbox });
  renderMap();
}
function offlineRecord(fn) {
  const all = offlineKids(), k = all[state.kid.id];
  if (!k) return;
  fn(k); k.progress = state.progress;
  if (k.sessions.length > 300) k.sessions.splice(0, k.sessions.length - 300);
  if (k.errors.length > 500) k.errors.splice(0, k.errors.length - 500);
  saveOffline(k);
}
async function showReport() {
  const k = offlineKids()[state.kid.id]; if (!k) return;
  const code = await encodeReport(k);
  const text = `🪐 ${APP_NAME}-Bericht von ${k.name}\n${code}`;
  const sheet = openModal(`
    <h2>📤 Bericht an deine Coachin</h2>
    <p>Kopiere diesen Text und schicke ihn deiner Coachin – zum Beispiel per WhatsApp oder E-Mail. Dann sieht sie, was du geschafft hast!</p>
    <textarea id="rep" class="code-input" style="font-size:.6em;letter-spacing:0;text-transform:none;height:140px;text-align:left" readonly></textarea>
    <p class="who-sub">Für Eltern: Der Bericht enthält nur Lernergebnisse und Stimmungs-Smileys, keine persönlichen Daten.</p>
    <div class="sheet-actions"><button class="btn primary block" id="copy-rep">📋 Kopieren</button><button class="btn block" id="close-rep">Fertig</button></div>`, { center: true });
  const ta = sheet.querySelector('#rep'); ta.value = text;
  sheet.querySelector('#copy-rep').onclick = () => {
    const ok = () => toast('Kopiert! Jetzt in WhatsApp oder E-Mail einfügen.');
    try { navigator.clipboard.writeText(text).then(ok, () => { ta.select(); toast('Bitte markierten Text kopieren (Strg+C / lange drücken).'); }); }
    catch { ta.select(); toast('Bitte markierten Text kopieren.'); }
  };
  sheet.querySelector('#close-rep').onclick = () => closeModal();
}

const unlockCtx = () => ({ mode: state.mode, progress: state.progress, unlocked: state.unlocked, autoAdvance: state.autoAdvance });
const open = id => isUnlocked(id, unlockCtx());

// ---------- Galaxie-Karte: ein durchgehender Pfad pro Fach (Galaxie für Galaxie nach unten) ----------
const SPACING = 150, HEAD_H = 300, SECTION_GAP = 60;
// Abschnitt einer Galaxie: Planeten und dazwischen Raumstationen
function mapNodes(gid) {
  const list = planetsOf(gid), sts = stationsOf(gid), nodes = [];
  list.forEach((p, i) => { nodes.push({ kind: 'planet', id: p.id, p }); for (const st of sts.filter(x => x.after === i)) nodes.push({ kind: 'station', id: st.id, st }); });
  return nodes;
}
const STATIONS = Object.fromEntries(GALAXIES.flatMap(g => stationsOf(g.id)).map(st => [st.id, st]));
const galaxyOfNode = id => PLANET_BY_ID[id]?.galaxy || STATIONS[id]?.galaxy;
const stationBest = id => getProfile().stations?.[id] || null;
const levelOfGalaxy = gid => GALAXIES.find(x => x.id === gid)?.level;
const galaxyHue = i => [200, 280, 330, 25, 150, 255, 185, 45, 300][i % 9];
// Gesamte Reiseroute eines Fachs vorberechnen (Positionen für Planeten, Stationen und Überschriften)
let LAYOUT = null;
function chainLayout(gid) {
  const chain = chainOf(gid), pos = {}, sections = [];
  let y = 10;
  chain.forEach((g, si) => {
    const headY = y; y += HEAD_H;
    const nodes = mapNodes(g.id).map((n, i) => { const p = { x: 50 + 30 * Math.sin(i * 1.15), y: y + i * SPACING }; pos[n.id] = p; return { ...n, ...p }; });
    y += (nodes.length - 1) * SPACING + 60 + SECTION_GAP;
    sections.push({ g, si, headY, nodes, hue: galaxyHue(si) });
  });
  return { chain, sections, pos, height: y + 40 };
}
const rocketKey = level => 'rocket_' + level + (state.mode === 'kid' ? '_' + state.kid.code : '');
const galaxyLocked = g => !open(planetsOf(g.id)[0].id);

function renderMap(focusId = null) {
  const g = GALAXIES.find(x => x.id === state.galaxy) || GALAXIES[0];
  const L = LAYOUT = chainLayout(g.id);
  const kid = state.mode === 'kid' ? state.kid : null;
  const allPlanets = L.chain.flatMap(x => planetsOf(x.id));
  const nextId = allPlanets.find(p => open(p.id) && !(state.progress[p.id]?.bestStars >= 1))?.id;
  const calm = state.settings.calm;

  const dm = dailyMission(state.progress, open, g.id);
  const doneToday = (getProfile().stats?.days || []).includes(today());
  const paths = L.sections.map(s => s.nodes.map((n, i) => (i ? ' L ' : 'M ') + `${n.x} ${n.y}`).join('')).join(' ');
  const secProg = s => { const ps = planetsOf(s.g.id); const d = ps.filter(p => (state.progress[p.id]?.bestStars || 0) >= 1).length; return { d, n: ps.length }; };

  $app.innerHTML = `
    ${topbar()}
    ${dm ? `<button class="daily" id="daily"><span class="daily-i">🎯</span><span class="daily-t"><b>Tagesmission:</b> ${esc(dm.planet.name)}<small>${doneToday ? '✅ Heute schon geübt – super!' : esc(dm.why)}</small></span><span class="daily-go">Los ➜</span></button>` : ''}
    <nav class="subjects" role="tablist" aria-label="Fach">
      ${LEVELS.map(l => `<button class="subject" role="tab" data-l="${l.id}" aria-selected="${l.id === g.level}"><span class="sj-i">${l.icon}</span> ${esc(l.name)}</button>`).join('')}
    </nav>
    <nav class="chain" aria-label="Galaxien – zum Springen antippen">${L.chain.map((x, i) => `${i ? '<span class="chain-arrow" aria-hidden="true">›</span>' : ''}<button class="chain-step ${x.id === g.id ? 'cur' : ''} ${galaxyDone(x.id, state.progress) ? 'done' : ''}" data-g="${x.id}">${galaxyDone(x.id, state.progress) ? '✓ ' : ''}${x.icon} ${esc(x.name)}</button>`).join('')}</nav>
    ${getProfile().placement?.[g.level] ? '' : `<button class="placement-cta" id="placement"><span>🧭</span><span><b>Neu hier? Mach den Einstufungstest ${g.level === 'mathe' ? 'Mathe' : 'Deutsch'}</b><small>Ein kurzes Quiz – danach weißt du, wo du starten kannst.</small></span></button>`}
    <div class="gx-sticky" id="gx-sticky" aria-live="polite"></div>
    <div class="map ${calm ? 'calm' : ''}" id="map" style="height:${L.height}px">
      <svg class="path" viewBox="0 0 100 ${L.height}" preserveAspectRatio="none" aria-hidden="true"><path d="${paths}"/></svg>
      ${L.sections.map(s => {
        const { d, n } = secProg(s), locked = galaxyLocked(s.g), done = d === n, prev = L.chain[s.si - 1];
        return `<section class="gx-head ${locked ? 'locked' : ''} ${done ? 'done' : ''}" data-g="${s.g.id}" style="top:${s.headY}px;--h:${s.hue}" aria-label="Galaxie ${s.si + 1}: ${esc(s.g.name)}">
          <span class="gx-stars" aria-hidden="true">${'<i></i>'.repeat(7)}</span>
          <span class="gx-num">Galaxie ${s.si + 1} von ${L.chain.length}</span>
          <span class="gx-icon" aria-hidden="true">${s.g.icon}</span>
          <h2>${esc(s.g.name)}</h2>
          <p>${esc(s.g.grade)} · ${esc(s.g.desc)}</p>
          <span class="gx-bar"><span style="width:${Math.round(100 * d / n)}%"></span></span>
          <small>${done ? '🏆 Galaxie geschafft!' : locked && prev ? `🔒 Schaffe zuerst „${esc(prev.name)}“` : `${d} von ${n} Planeten geschafft`}</small>
        </section>`;
      }).join('')}
      ${L.sections.flatMap(s => s.nodes).map(node => {
        const { x, y } = node;
        if (node.kind === 'station') {
          const st = node.st, ok = stationOpen(st, state.progress), best = stationBest(st.id);
          return `<button class="pl station ${ok ? '' : 'locked'} ${st.final ? 'final' : ''}" data-st="${st.id}" style="left:${x}%;top:${y}px" aria-label="${esc(st.name)}: ${ok ? 'Quiz mit 3 Leben' : 'verschlossen'}">
            <span class="st-orb">${ok ? (st.final ? '🌀' : '🛰️') : '🔒'}</span>
            <span class="pl-name">${esc(st.name)}</span>
            <span class="pl-stars">${best?.best ? '❤️'.repeat(best.best) : ok ? '<span class="st-new">Quiz!</span>' : ''}</span></button>`;
        }
        const p = node.p, pr = state.progress[p.id], ls = levelStars(pr), isOpen = open(p.id), stars = pr?.bestStars || 0;
        const flagged = kid && state.unlocked.includes(p.id) && !DEFAULT_UNLOCKED.includes(p.id) && !stars;
        return `<button class="pl ${isOpen ? '' : 'locked'} ${p.id === nextId ? 'next' : ''}" data-id="${p.id}" style="left:${x}%;top:${y}px"
            aria-label="${esc(p.name)}: ${isOpen ? (stars ? stars + ' Sterne' : 'offen') : 'verschlossen'}">
          <span class="orb ${p.index % 3 === 1 ? 'ring' : ''} ${p.boss ? 'boss' : ''}" style="--h:${p.hue}">${isOpen ? esc(p.label) : '<span class="lock">🔒</span>'}${flagged ? '<span class="flag" title="Von deiner Coachin freigeschaltet">🚩</span>' : ''}</span>
          <span class="pl-name">${esc(p.name)}</span>
          <span class="pl-medals">${isOpen && pr ? PLANET_LEVELS.map(Lv => `<span class="${ls[Lv.n] >= 1 ? '' : 'off'}" title="Stufe ${Lv.n}">${Lv.medal}</span>`).join('') : ''}</span>
        </button>`;
      }).join('')}
      <div class="gx-end" style="top:${L.height - 70}px">🌌 Ende der Reise – du bist ein echter Sternen-Profi!</div>
      <div class="rocket ${look().ship === '🚀' ? '' : 'norot'}" id="rocket" aria-hidden="true">${look().ship}</div>
    </div>
    ${navBar('map')}`;

  bindChrome();
  const stickyEl = document.getElementById('gx-sticky');
  const headEls = [...$app.querySelectorAll('.gx-head')];
  const scrollToGalaxy = (gid, smooth = true) => {
    const el = headEls.find(h => h.dataset.g === gid); if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY - (document.querySelector('.topbar')?.offsetHeight || 60) - 24;
    window.scrollTo({ top, behavior: smooth && !calm ? 'smooth' : 'auto' });
  };
  document.getElementById('placement')?.addEventListener('click', () => startPlacement(g.level));
  document.getElementById('daily')?.addEventListener('click', () => {
    if (levelOfGalaxy(dm.planet.galaxy) !== g.level) { state.galaxy = dm.planet.galaxy; store.set('galaxy', state.galaxy); renderMap(dm.planet.id); }
    else focusPlanet(dm.planet.id);
  });
  $app.querySelectorAll('.chain-step').forEach(b => b.onclick = () => scrollToGalaxy(b.dataset.g));
  headEls.forEach(h => h.onclick = () => {
    if (h.classList.contains('locked')) { h.classList.remove('wiggle'); void h.offsetWidth; h.classList.add('wiggle'); toast('🔒 Schaffe zuerst alle Planeten der Galaxie davor – dann geht die Reise hier weiter!'); }
  });
  $app.querySelectorAll('.subject').forEach(b => b.onclick = () => {
    if (b.dataset.l === g.level) return;
    store.set('galaxy_' + g.level, state.galaxy); // pro Fach merken, wo man zuletzt war
    const same = GALAXIES.filter(x => x.level === b.dataset.l), last = store.get('galaxy_' + b.dataset.l, null);
    state.galaxy = (same.find(x => x.id === last) || same[0]).id; store.set('galaxy', state.galaxy); scrollTo(0, 0); renderMap();
  });

  // Themen-Leiste horizontal mitführen (ohne scrollIntoView – das würde das Scrollen der Seite unterbrechen)
  const centerChainStep = () => { const nav = $app.querySelector('.chain'), b = nav?.querySelector('.chain-step.cur'); if (b) nav.scrollTo({ left: b.offsetLeft - nav.clientWidth / 2 + b.offsetWidth / 2 }); };

  // Überschriften fliegen beim Hineinscrollen ein
  if ('IntersectionObserver' in window && !calm) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.35 });
    headEls.forEach(h => io.observe(h));
  } else headEls.forEach(h => h.classList.add('in'));

  // Mitlaufende Galaxie-Leiste oben (wie ein Kapitel-Banner): zeigt, in welcher Galaxie man gerade ist
  let curG = null;
  const onScroll = () => {
    if (!document.body.contains(stickyEl)) { removeEventListener('scroll', window.__mapScroll); return; }
    const tb = document.querySelector('.topbar')?.offsetHeight || 60, line = tb + 90;
    let cur = headEls[0];
    for (const h of headEls) if (h.getBoundingClientRect().top < line) cur = h;
    const passed = cur.getBoundingClientRect().bottom < tb + 10;
    stickyEl.style.top = tb + 'px';
    stickyEl.classList.toggle('show', passed);
    if (cur.dataset.g === curG) return;
    const first = curG === null; curG = cur.dataset.g;
    const s = L.sections.find(x => x.g.id === curG), { d, n } = secProg(s);
    stickyEl.style.setProperty('--h', s.hue);
    stickyEl.innerHTML = `<span class="gs-icon">${s.g.icon}</span><span class="gs-t"><small>Galaxie ${s.si + 1} von ${L.chain.length}</small><b>${esc(s.g.name)}</b></span><span class="gs-p">${d}/${n} 🪐</span>`;
    if (!first && !calm) { stickyEl.classList.remove('swap'); void stickyEl.offsetWidth; stickyEl.classList.add('swap'); }
    $app.querySelectorAll('.chain-step').forEach(b => b.classList.toggle('cur', b.dataset.g === curG));
    centerChainStep();
    if (state.galaxy !== curG) { state.galaxy = curG; store.set('galaxy', curG); }
  };
  let ticking = false;
  if (window.__mapScroll) removeEventListener('scroll', window.__mapScroll);
  window.__mapScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } };
  addEventListener('scroll', window.__mapScroll, { passive: true });

  // Rakete parken (eine Rakete pro Fach)
  const rocketAt = store.get(rocketKey(g.level), null);
  const valid = id => id && L.pos[id] && (PLANET_BY_ID[id] ? open(id) : stationOpen(STATIONS[id], state.progress));
  const inGalaxy = id => galaxyOfNode(id) === g.id;
  // Startpunkt: gemerkte Position – außer man kommt gezielt in eine andere Galaxie (z. B. aus der Einstufung)
  const startId = valid(rocketAt) && inGalaxy(rocketAt) ? rocketAt
    : (planetsOf(g.id).find(p => open(p.id) && !(state.progress[p.id]?.bestStars >= 1))?.id || (valid(rocketAt) ? rocketAt : null) || nextId || allPlanets[0].id);
  placeRocket(startId, false);
  const startEl = $app.querySelector(`.pl[data-id="${startId}"], .pl[data-st="${startId}"]`);
  if (!focusId && startEl) setTimeout(() => { const r = startEl.getBoundingClientRect(); if (r.bottom > innerHeight - 90 || r.top < 0) startEl.scrollIntoView({ block: 'center', behavior: 'auto' }); onScroll(); }, 30);
  else onScroll();

  $app.querySelectorAll('.pl[data-st]').forEach(el => el.onclick = () => {
    const st = STATIONS[el.dataset.st];
    if (!stationOpen(st, state.progress)) {
      el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle');
      toast(`🔒 Die ${st.name} öffnet sich, wenn du ${st.final ? 'alle Planeten dieser Galaxie' : 'die 4 Planeten davor'} geschafft hast.`);
      return;
    }
    const moved = placeRocket(st.id, true);
    store.set(rocketKey(g.level), st.id);
    setTimeout(() => showStationSheet(st), moved && !calm ? 950 : 0);
  });
  $app.querySelectorAll('.pl[data-id]').forEach(el => el.onclick = () => {
    const p = PLANET_BY_ID[el.dataset.id];
    if (!open(p.id)) {
      el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle');
      toast(state.mode === 'kid' ? '🔒 Noch verschlossen – schaffe den Planeten davor oder frag deine Coachin!' : '🔒 Noch verschlossen – schaffe erst den Planeten davor!');
      return;
    }
    const moved = placeRocket(p.id, true);
    store.set(rocketKey(g.level), p.id);
    if (state.galaxy !== p.galaxy) { state.galaxy = p.galaxy; store.set('galaxy', p.galaxy); }
    setTimeout(() => showPlanetSheet(p), moved && !calm ? 950 : 0);
  });

  if (kid && kid.messages?.length) setTimeout(showRadio, 600);
  if (focusId) setTimeout(() => focusPlanet(focusId), 300);
}
function focusPlanet(id) {
  const p = PLANET_BY_ID[id], el = $app.querySelector(`.pl[data-id="${id}"]`);
  if (!p || !el) return;
  el.scrollIntoView({ block: 'center', behavior: state.settings.calm ? 'auto' : 'smooth' });
  const moved = placeRocket(id, true);
  store.set(rocketKey(levelOfGalaxy(p.galaxy)), id);
  setTimeout(() => showPlanetSheet(p), moved && !state.settings.calm ? 950 : 100);
}
function placeRocket(id, animate) {
  const r = document.getElementById('rocket');
  const pos = LAYOUT?.pos[id]; if (!r || !pos) return false;
  const { x, y } = pos;
  const oldTop = parseFloat(r.style.top) || 0;
  const target = { left: `calc(${x}% - 48px)`, top: `${y - 52}px` };
  if (r.style.top === target.top && r.style.left === target.left) return false;
  r.style.setProperty('--rot', y - 52 < oldTop ? '-45deg' : '135deg');
  if (!animate) r.style.transition = 'none';
  r.style.left = target.left; r.style.top = target.top;
  if (!animate) { void r.offsetWidth; r.style.transition = ''; r.style.setProperty('--rot', '-45deg'); }
  else { r.classList.remove('hop'); void r.offsetWidth; r.classList.add('hop'); setTimeout(() => r.style.setProperty('--rot', '-45deg'), 1000); }
  return true;
}

function showPlanetSheet(p) {
  const pr = state.progress[p.id], ls = levelStars(pr), rec = nextLevel(pr);
  const sheet = openModal(`
    <div style="text-align:center">
      <span class="orb ${p.boss ? 'boss' : ''}" style="--h:${p.hue}">${esc(p.label)}</span>
      <h2>${esc(p.name)}</h2>
      <p style="margin:.2em 0;color:var(--muted)">${esc(p.topic)}</p>
    </div>
    <div class="lvl-list">${PLANET_LEVELS.map(L => {
      const ok = levelOpen(pr, L.n), st = ls[L.n];
      return `<button class="lvl-card ${ok ? '' : 'locked'} ${L.n === rec && ok ? 'rec' : ''}" data-lv="${L.n}" aria-label="Stufe ${L.n} ${L.name}${ok ? '' : ', verschlossen'}">
        <span class="lvl-medal">${ok ? L.medal : '🔒'}</span>
        <span class="lvl-t"><b>Stufe ${L.n}: ${L.name}</b><small>${ok ? esc(L.desc) : `Schaffe zuerst Stufe ${L.n - 1}`}</small></span>
        <span class="lvl-stars">${st ? '★'.repeat(st) + '<span class="off">' + '★'.repeat(3 - st) + '</span>' : ''}</span></button>`;
    }).join('')}</div>
    <p class="who-sub" style="text-align:center">Ab 7 von 10 richtigen ist eine Stufe geschafft · kein Zeitdruck</p>
    <div class="sheet-actions">
      <button class="btn primary block" id="start-mission">🚀 Stufe ${rec} starten</button>
      <button class="btn block" id="say-topic">🔊 Vorlesen</button>
      <button class="btn block" id="close">Zurück</button>
    </div>`);
  const go = n => { closeModal(); moodBefore({ ...p, level: n }); };
  sheet.querySelector('#start-mission').onclick = () => go(rec);
  sheet.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => {
    const n = Number(b.dataset.lv);
    if (!levelOpen(pr, n)) { toast(`🔒 Schaffe zuerst Stufe ${n - 1}!`); return; }
    go(n);
  });
  sheet.querySelector('#say-topic').onclick = () => speak(`${p.name}. ${p.topic}.`);
  sheet.querySelector('#close').onclick = () => closeModal();
  if (state.settings.autoread) speak(`${p.name}. ${p.topic}.`);
}
function showStationSheet(st) {
  const best = stationBest(st.id);
  const names = st.planets.map(id => PLANET_BY_ID[id].name);
  const sheet = openModal(`
    <div style="text-align:center">
      <div class="st-big">${st.final ? '🌀' : '🛰️'}</div>
      <h2>${esc(st.name)}</h2>
      <p style="margin:.2em 0">Großes Quiz mit Aufgaben aus ${st.final ? 'der ganzen Galaxie' : names.length + ' Planeten'}!</p>
      <p class="hearts-big" aria-label="3 Leben">❤️❤️❤️</p>
      <p class="who-sub">Du hast 3 Leben. Schaffe ${STATION_TARGET} richtige Antworten, bevor alle Leben weg sind. Jede falsche Antwort kostet ein Leben – Astronautin Nova erklärt dir dann die Lösung.</p>
      ${best ? `<p>Dein Rekord: ${best.best ? '❤️'.repeat(best.best) + ' gemeistert' : `${best.most || 0} richtige`}</p>` : ''}
      ${st.final ? '' : `<p class="who-sub">Themen: ${names.map(esc).join(' · ')}</p>`}
    </div>
    <div class="sheet-actions">
      <button class="btn primary block" id="start-mission">🛰️ Quiz starten</button>
      <button class="btn block" id="close">Zurück</button>
    </div>`);
  sheet.querySelector('#start-mission').onclick = () => {
    closeModal();
    const regen = () => stationQuiz(st.planets);
    runMission({ id: 'station', st, name: st.name, label: '🛰️', galaxy: st.galaxy, activity: true, station: true, lives: 3, target: STATION_TARGET, tasks: regen(), regen, back: () => { state.galaxy = st.galaxy; renderMap(); } }, null);
  };
  sheet.querySelector('#close').onclick = () => closeModal();
  if (state.settings.autoread) speak(`${st.name}. Quiz mit drei Leben.`);
}

function moodPicker(id) {
  return `<div class="moods" id="${id}" role="group">${MOODS.map(m => `<button class="mood" data-v="${m.v}" aria-pressed="false"><span class="e">${m.e}</span><span class="t">${m.t}</span></button>`).join('')}</div>`;
}
function moodBefore(p) {
  $app.innerHTML = `
    <section class="panel result">
      <div class="radio-head">🧑‍🚀</div>
      <h2>Wie fühlst du dich gerade?</h2>
      <p class="who-sub">Bevor wir zum ${esc(p.name)} fliegen.</p>
      ${moodPicker('mb')}
      <button class="btn" id="skip">Weiter ohne</button>
    </section>`;
  if (state.settings.autoread) speak('Wie fühlst du dich gerade?');
  $app.querySelectorAll('#mb .mood').forEach(b => b.onclick = () => {
    b.setAttribute('aria-pressed', 'true');
    setTimeout(() => runMission(p, Number(b.dataset.v)), 250);
  });
  document.getElementById('skip').onclick = () => runMission(p, null);
}

// ---------- Mission ----------
const PRAISE = ['Super!', 'Klasse!', 'Stark gemacht!', 'Genau richtig!', 'Wow, toll!', 'Spitze!', 'Du bist ein Stern!'];
const COMFORT = ['Fast! Fehler helfen beim Lernen.', 'Nicht schlimm – schau mal, so geht es:', 'Guter Versuch! Hier ist die Lösung:', 'Kein Problem – jetzt weißt du es!'];

function runMission(p, moodB) {
  const tasks = p.tasks || generateMission(p.id, null, p.level || 2);
  const m = { p, tasks, i: 0, correct: 0, errors: [], tips: 0, started: Date.now(), moodB, active: true, lives: p.lives || 0, results: [] };
  runMission.current = m;
  const isMath = p.galaxy === 'zahlen';

  const renderTask = () => {
    const t = tasks[m.i];
    const pct = p.lives ? (m.correct / p.target) * 100 : (m.i / tasks.length) * 100;
    $app.innerHTML = `
      <div class="mission-top">
        <button class="icon-btn" id="quit" aria-label="Mission abbrechen">✕</button>
        <div class="fuel" aria-hidden="true"><div class="fuel-fill" style="width:${pct}%"></div><span class="fuel-rocket ${look().ship === '🚀' ? '' : 'norot'}" style="left:${pct}%">${look().ship}</span></div>
        ${p.lives ? `<span class="hearts" id="hearts" aria-label="${m.lives} Leben">${'❤️'.repeat(m.lives)}${'🤍'.repeat(p.lives - m.lives)}</span><span class="fuel-count">${m.correct}/${p.target}</span>` : `<span class="fuel-count">${p.placement ? '🧭' : `${m.i + 1}/${tasks.length}`}</span>`}
      </div>
      ${p.level ? `<div class="lvl-tag">${PLANET_LEVELS[p.level - 1].medal} ${esc(p.name)} · Stufe ${p.level}</div>` : p.station ? `<div class="lvl-tag">🛰️ ${esc(p.name)}</div>` : p.placement ? `<div class="lvl-tag">🧭 ${esc(p.name)} · Aufgabe ${m.i + 1}</div>` : ''}
      <section class="panel task">
        <button class="hint-bulb ${p.placement ? 'hidden' : ''}" id="tip" aria-label="Hinweis vom Astronauten" title="Ich weiß nicht weiter">💡</button>
        <div class="prompt-row">
          <p class="prompt ${isMath && ['big', 'house'].includes(t.visual.type) ? 'math' : ''}">${esc(t.prompt)}</p>
          <button class="icon-btn" id="say" aria-label="Vorlesen">🔊</button>
        </div>
        <div class="visual">${renderVisual(t.visual, p.id)}</div>
        ${t.flash ? '<button class="btn flash-again hidden" id="flash">👀 Nochmal kurz zeigen</button>' : ''}
        ${t.input === 'number' ? `<div class="num-entry"><div class="num-display" id="numd" aria-live="polite" aria-label="Deine Antwort"></div>
          <div class="g-pad numpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => `<button data-d="${d}">${d}</button>`).join('')}${t.options.some(o => o.label.startsWith('−')) ? '<button data-d="−">−</button>' : '<button data-d="del" aria-label="Löschen">⌫</button>'}<button data-d="0">0</button><button data-d="ok" class="ok" aria-label="Antwort prüfen">✓</button>${t.options.some(o => o.label.startsWith('−')) ? '<button data-d="del" aria-label="Löschen">⌫</button>' : ''}</div></div>` : ''}
        <div class="options ${t.input === 'number' ? 'hidden' : ''} ${t.options.some(o => !o.display && o.label.length > 14) ? 'long' : ''} ${t.options.length === 2 ? 'two' : ''} ${t.options.length === 3 ? 'three' : ''}">${t.options.map((o, k) => `<button class="opt ${o.big ? 'big' : ''}" data-k="${k}">${o.emoji ? `<span class="opt-emoji">${o.emoji}</span>` : ''}<span>${o.display ? esc(o.display) : (p.id === 'lesen' || p.id === 'silben' || p.id === 'bdpq' || p.id === 'schreiben' || p.activity ? esc(o.label) : wordHtml(o.label))}</span></button>`).join('')}</div>
        <div class="feedback" id="fb" aria-live="assertive"></div>
        <div id="hint"></div>
        <div class="mission-bottom">
          <button class="btn primary hidden" id="next">Weiter ➜</button>
        </div>
      </section>`;
    const sayAll = () => speak(t.speak + (t.sayOptions ? '. ' + t.options.map(o => o.label).join(', ') : ''));
    document.getElementById('say').onclick = sayAll;
    const sayBtn = $app.querySelector('[data-say]');
    if (sayBtn) sayBtn.onclick = () => speak(sayBtn.dataset.say, .8);
    document.getElementById('quit').onclick = () => {
      const s = openModal(`<h2>Mission abbrechen?</h2><p>Dein Fortschritt bei dieser Mission geht verloren.</p><div class="sheet-actions"><button class="btn primary block" id="stay">Weiterspielen</button><button class="btn block" id="leave">Abbrechen</button></div>`, { center: true });
      s.querySelector('#stay').onclick = () => closeModal();
      s.querySelector('#leave').onclick = () => { m.active = false; closeModal(); window.speechSynthesis?.cancel(); renderMap(); };
    };
    // Astronaut Nova erklärt: auf Knopfdruck (💡) oder nach einem Fehler
    let tipShown = false;
    const sayHint = h => {
      if (h.saysyll) speak(`${h.text} ${h.saysyll.join(', ')}.`, .85);
      else if (h.sayslow) speak(`${h.text} Hör genau: ${h.sayslow}.`, .85);
      else speak(h.text);
    };
    const showHint = (after = null) => {
      const h = t.hint || {};
      const box = document.getElementById('hint');
      const intro = after ? `Schau mal, so geht's: Die richtige Antwort ist <strong>${esc(after)}</strong>.` : pick(['Kein Problem, ich helfe dir!', 'Gute Idee, dass du fragst!', 'Lass uns das zusammen anschauen.']);
      box.innerHTML = `<div class="astro" role="note" aria-label="Hinweis von Astronaut Nova">
          <div class="astro-figure" aria-hidden="true">🧑‍🚀</div>
          <div class="astro-bubble">
            <div class="astro-name">Astronautin Nova</div>
            <p class="astro-intro">${intro}</p>
            <p>${esc(h.text || '')}</p>
            ${h.visual ? renderVisual(h.visual) : ''}
            ${h.syllables ? `<div class="syl-chips">${h.syllables.map(s => `<span class="syl-chip">${esc(s)}</span>`).join('')}</div>` : ''}
            <button class="btn small-btn" id="astro-say">🔊 Nochmal anhören</button>
          </div></div>`;
      box.querySelector('#astro-say').onclick = () => sayHint(h);
      box.scrollIntoView({ block: 'nearest', behavior: state.settings.calm ? 'auto' : 'smooth' });
      if (!tipShown || after) sayHint(h);
      tipShown = true;
    };
    const bulb = document.getElementById('tip');
    bulb.onclick = () => { if (!tipShown) m.tips++; showHint(); bulb.classList.remove('nudge'); bulb.classList.add('used'); };
    clearTimeout(runMission.nudge);
    runMission.nudge = setTimeout(() => { if (!tipShown && document.body.contains(bulb) && !bulb.disabled) bulb.classList.add('nudge'); }, 25000);
    const next = () => {
      if (!m.active || runMission.current !== m) return;
      m.i++;
      if (p.lives && (m.correct >= p.target || m.lives <= 0)) return finish();
      if (p.placement && p.easier?.length && !m.wentDown && m.results.length === 4 && m.results.filter(x => !x.ok).length >= 2) { // Anfang zu schwer -> leichtere Aufgaben einschieben
        m.wentDown = true; tasks.splice(m.i, 0, ...p.easier); const down = new Set(p.easier.map(x => x.topic)); p.assumed = (p.assumed || []).filter(t => !down.has(t));
      }
      if (p.placement) { const last = m.results.slice(-6); if (last.filter(x => !x.ok).length >= 4) return finish(); } // zu schwer -> freundlich beenden
      if (m.i < tasks.length) renderTask(); else finish();
    };
    document.getElementById('next').onclick = next;

    // Antwort auswerten (Auswahl oder eingetippte Zahl)
    const answer = (o, markRight, markWrong) => {
      $app.querySelectorAll('.opt, .numpad button').forEach(b => b.disabled = true);
      if (p.placement) { // neutral: kein Richtig/Falsch, keine Hinweise
        m.results.push({ topic: t.topic, planet: t.src, ok: !!o.correct });
        if (o.correct) m.correct++; else m.errors.push({ task: t.label, given: o.label, expected: t.options.find(x => x.correct).label, type: o.type || 'sonstiges', planetId: t.src });
        const fb = document.getElementById('fb'); fb.className = 'feedback'; fb.textContent = '👍 Danke! Weiter geht’s.';
        $app.querySelectorAll('.opt').forEach(b => b.classList.add('fade')); document.getElementById('numd')?.classList.add('neutral');
        setTimeout(next, 650); return;
      }
      clearTimeout(runMission.nudge);
      document.getElementById('tip').disabled = true;
      $app.querySelector('.visual')?.classList.remove('flashed'); document.getElementById('flash')?.classList.add('hidden');
      const fb = document.getElementById('fb');
      const right = t.options.find(x => x.correct);
      if (o.correct) {
        m.correct++; markRight();
        const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)];
        fb.className = 'feedback good'; fb.textContent = '⭐ ' + msg;
        if (state.settings.sound) sound('right'); else speak(msg, 1);
        setTimeout(next, state.settings.calm ? 1400 : 1100);
      } else {
        markWrong();
        m.errors.push({ task: t.label, given: o.label, expected: right.label, type: o.type || 'sonstiges', ...(t.src ? { planetId: t.src } : {}) });
        if (state.settings.sound) sound('wrong');
        let msg = COMFORT[Math.floor(Math.random() * COMFORT.length)];
        if (p.lives) {
          m.lives--;
          const h = document.getElementById('hearts'); h.innerHTML = '❤️'.repeat(m.lives) + '🤍'.repeat(p.lives - m.lives); h.classList.add('lost');
          msg = m.lives ? `Ein Leben weg – du hast noch ${m.lives}! ${msg}` : 'Keine Leben mehr – aber schau, so geht es:';
        }
        fb.className = 'feedback soft'; fb.textContent = '🌱 ' + msg;
        showHint(right.display || right.label);
        const nb = document.getElementById('next'); nb.classList.remove('hidden'); nb.focus();
      }
    };
    $app.querySelectorAll('.opt').forEach(btn => btn.onclick = () => {
      const o = t.options[Number(btn.dataset.k)];
      const all = [...$app.querySelectorAll('.opt')], ri = t.options.findIndex(x => x.correct);
      answer(o, () => { btn.classList.add('right'); all.forEach((b, k) => { if (k !== ri) b.classList.add('fade'); }); }, () => { btn.classList.add('wrong'); all[ri].classList.add('right'); });
    });
    if (t.input === 'number') {
      let val = '';
      const disp = document.getElementById('numd');
      const draw = () => { disp.textContent = val || ' '; disp.classList.toggle('empty', !val); };
      const submit = () => {
        if (!val || val === '−') { disp.classList.remove('shake'); void disp.offsetWidth; disp.classList.add('shake'); return; }
        const o = t.options.find(x => x.label === val) || { label: val, correct: false, type: 'sonstiges' };
        const right = t.options.find(x => x.correct);
        answer(o, () => disp.classList.add('right'), () => { disp.classList.add('wrong'); disp.innerHTML = `<s>${esc(val)}</s> → ${esc(right.label)}`; });
      };
      $app.querySelectorAll('.numpad button').forEach(b => b.onclick = () => {
        const d = b.dataset.d;
        if (d === 'ok') return submit();
        if (d === 'del') val = val.slice(0, -1);
        else if (d === '−') val = val.startsWith('−') ? val.slice(1) : '−' + val;
        else if (val.replace('−', '').length < 5) val += d;
        draw();
      });
      draw();
      runMission.keys && document.removeEventListener('keydown', runMission.keys);
      runMission.keys = e => {
        if (!document.getElementById('numd') || document.querySelector('.numpad button:disabled')) return;
        if (/^\d$/.test(e.key)) { val += e.key; draw(); } else if (e.key === 'Backspace') { val = val.slice(0, -1); draw(); } else if (e.key === 'Enter') submit(); else if (e.key === '-') { val = val.startsWith('−') ? val.slice(1) : '−' + val; draw(); }
      };
      document.addEventListener('keydown', runMission.keys);
    }
    if (t.flash) {
      const vis = $app.querySelector('.visual'), again = document.getElementById('flash');
      setTimeout(() => { if (vis.isConnected && !document.querySelector('.opt:disabled, .numpad button:disabled')) { vis.classList.add('flashed'); again.classList.remove('hidden'); } }, 2200);
      again.onclick = () => { m.tips++; vis.classList.remove('flashed'); again.classList.add('hidden'); setTimeout(() => { if (!document.querySelector('.opt:disabled')) { vis.classList.add('flashed'); } }, 1500); };
    }
    if (t.visual.type === 'listen') setTimeout(() => speak(t.visual.say, .8), 250);
    else if (state.settings.autoread) sayAll();
  };
  renderTask();

  const finish = async () => {
    m.active = false;
    const isAct = !!p.activity;
    const wasFailed = !isAct && (state.progress[p.id]?.attempts || 0) > 0 && !((state.progress[p.id]?.bestStars || 0) >= 1);
    const before = new Set(PLANETS.filter(x => open(x.id)).map(x => x.id));
    if (p.placement) return finishPlacement(p, m, tasks);
    const level = p.level || null;
    const played = p.lives ? m.i : tasks.length; // im Stations-Quiz zählen nur die gespielten Aufgaben
    const won = p.lives ? m.correct >= p.target && m.lives > 0 : null;
    const stars = p.lives ? (won ? m.lives : 0) : starsFor(m.correct, tasks.length);
    const durationSec = Math.round((Date.now() - m.started) / 1000);
    if (p.station) { // Rekord der Station (lokal)
      const pf = getProfile(); pf.stations ||= {};
      const old = pf.stations[p.st.id] || { best: 0, most: 0, attempts: 0 };
      pf.stations[p.st.id] = { best: Math.max(old.best, stars), most: Math.max(old.most, m.correct), attempts: old.attempts + 1 };
      saveProfile(pf);
    }
    const prof = getProfile();
    const payload = { planetId: p.id, level, correct: m.correct, total: played, errors: m.errors, tips: m.tips, moodBefore: m.moodB, durationSec, trophies: prof.trophies, stats: prof.stats };
    if (state.mode === 'kid' && state.offline) {
      if (!isAct) localResult(p.id, m.correct, tasks.length, stars, level);
      const ts = new Date().toISOString();
      offlineRecord(k => {
        k.sessions.push({ ts, planetId: p.id, level, correct: m.correct, total: played, stars, moodBefore: m.moodB, moodAfter: null, tips: m.tips, durationSec });
        for (const e of m.errors) k.errors.push({ ts, planetId: p.id, ...e });
      });
    } else if (state.mode === 'kid') {
      try { setKid(await apiCall('/api/kid/result', { method: 'POST', body: payload })); }
      catch { toast('📡 Verbindung zur Basis gestört – Ergebnis nur auf diesem Gerät.'); if (!isAct) localResult(p.id, m.correct, tasks.length, stars, level); }
    } else if (!isAct) {
      localResult(p.id, m.correct, tasks.length, stars, level);
      store.set('public_progress', state.progress);
    }
    const newly = PLANETS.filter(x => open(x.id) && !before.has(x.id));
    renderResult(p, m.correct, played, stars, newly, { won, lives: m.lives });
    if (state.settings.sound && stars >= 1) sound('win');
    earn(p.station ? { stations: won ? 1 : 0, perfectStations: won && m.lives === p.lives ? 1 : 0, tipsUsed: m.tips }
      : isAct ? { words: 1, tipsUsed: m.tips }
      : { missions: 1, perfect: m.correct === tasks.length ? 1 : 0, tipsUsed: m.tips, brave: m.moodB && m.moodB <= 2 ? 1 : 0, comebacks: wasFailed && stars >= 1 ? 1 : 0, profi: level === 3 && stars >= 1 ? 1 : 0 });
  };
}
// ---------- Einstufungstest ----------
// Klasse des Kindes: von der Coachin (Link/Server) oder selbst gewählt
function kidStufe() {
  if (state.mode === 'kid') { const k = state.offline ? offlineKids()[state.kid.id] : state.kid; if (k?.stufe != null && k.stufe !== '') return Number(k.stufe); }
  const own = getProfile().stufe; return own == null || own === '' ? null : Number(own);
}
function startPlacement(subject) {
  const fromCoach = state.mode === 'kid' && (() => { const k = state.offline ? offlineKids()[state.kid.id] : state.kid; return k?.stufe != null && k.stufe !== ''; })();
  let stufe = kidStufe();
  const s = openModal(`<div style="text-align:center"><div class="st-big">🧭</div><h2>Einstufungstest ${subject === 'mathe' ? 'Mathe' : 'Deutsch'}</h2>
    <p>Ein kurzes Quiz mit Aufgaben von leicht bis schwer. Es ist <b>keine Prüfung</b> und es gibt keine Noten!</p></div>
    ${fromCoach ? `<p class="who-sub" style="text-align:center">Passend für: <b>${esc(stufeLabel(stufe))}</b></p>` : `
    <div class="field"><label for="pl-stufe"><b>In welche Klasse gehst du?</b></label>
      <select id="pl-stufe" class="stufe-sel"><option value="">Weiß ich nicht – alles testen</option>${SCHULSTUFEN.map(x => `<option value="${x.n}" ${stufe === x.n ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></div>`}
    <p class="who-sub" style="text-align:center">Wenn es zu schwer wird, hört das Quiz von selbst auf. Danach siehst du, mit welchem Thema du am besten startest.${state.mode === 'kid' ? ' Deine Coachin sieht das Ergebnis auch.' : ''}</p>
    <div class="sheet-actions"><button class="btn primary block" id="start-mission">🧭 Los geht’s</button><button class="btn block" id="close">Später</button></div>`, { center: true });
  s.querySelector('#close').onclick = () => closeModal();
  s.querySelector('#pl-stufe')?.addEventListener('change', e => { stufe = e.target.value === '' ? null : Number(e.target.value); const pf = getProfile(); pf.stufe = stufe; saveProfile(pf); });
  s.querySelector('#start-mission').onclick = () => {
    closeModal();
    const plan = placementPlan(subject, stufe);
    const mk = list => list.map(([topic, pid, lvl]) => { const t = { ...generateMission(pid, 1, lvl)[0], src: pid, topic }; delete t.flash; return t; });
    runMission({ id: 'einstufung', name: `Einstufung ${subject === 'mathe' ? 'Mathe' : 'Deutsch'}`, subject, galaxy: subject, activity: true, placement: true, stufe,
      tasks: mk(plan.items), easier: mk(plan.easier), assumed: plan.assumed }, null);
  };
}
async function finishPlacement(p, m, tasks) {
  const ev = evaluatePlacement(p.subject, m.results, p.assumed || []), ts = new Date().toISOString();
  const pf = getProfile(); pf.placement = { ...(pf.placement || {}), [p.subject]: { ts, ...ev, correct: m.correct, asked: m.results.length, ...(p.stufe != null ? { stufe: p.stufe } : {}) } }; saveProfile(pf);
  const durationSec = Math.round((Date.now() - m.started) / 1000);
  if (state.mode === 'kid' && state.offline) offlineRecord(k => { k.sessions.push({ ts, planetId: 'einstufung', correct: m.correct, total: m.results.length, stars: 0, moodBefore: null, moodAfter: null, tips: 0, durationSec }); for (const e of m.errors) k.errors.push({ ts, ...e }); });
  else if (state.mode === 'kid') { try { setKid(await apiCall('/api/kid/result', { method: 'POST', body: { planetId: 'einstufung', correct: m.correct, total: m.results.length, errors: m.errors, durationSec, placement: { subject: p.subject, ...pf.placement[p.subject] } } })); } catch { } }
  renderPlacementResult(p.subject);
}
function renderPlacementResult(subject) {
  const pl = getProfile().placement?.[subject]; if (!pl) return renderMap();
  const rec = GALAXIES.find(g => g.id === pl.recommend);
  $app.innerHTML = `${topbar()}
    <section class="screen">
      <div class="panel result"><div class="st-big">🧭</div><h2>Geschafft! Danke fürs Mitmachen.</h2>
        <p>Du hast ${pl.asked} Aufgaben gelöst. Hier ist dein Ergebnis für <b>${subject === 'mathe' ? 'Mathe' : 'Deutsch'}</b>:</p>
        <ul class="pl-list">${pl.topics.map(t => { const g = GALAXIES.find(x => x.id === t.topic); return `<li class="pl-${t.status}"><span>${PLACEMENT_STATUS[t.status].icon}</span><span>${g.icon} ${esc(g.name)}</span><small>${PLACEMENT_STATUS[t.status].label}</small></li>`; }).join('')}</ul>
        <div class="new-planet">🚀 Unser Tipp: Starte mit <b>${rec.icon} ${esc(rec.name)}</b></div>
        <div class="sheet-actions"><button class="btn primary block" id="go-rec">Los geht’s mit ${esc(rec.name)}</button><button class="btn block" id="back">Zur Karte</button></div>
      </div></section>${navBar('map')}`;
  bindChrome();
  speak(`Geschafft! Unser Tipp: Starte mit ${rec.name}.`);
  document.getElementById('go-rec').onclick = () => { state.galaxy = rec.id; store.set('galaxy', rec.id); renderMap(planetsOf(rec.id)[0].id); };
  document.getElementById('back').onclick = () => renderMap();
}

function localResult(id, correct, total, stars, level = 2) {
  const pr = state.progress[id] ||= { bestStars: 0, attempts: 0, correct: 0, total: 0 };
  pr.lv = levelStars(pr); // ältere Spielstände übernehmen
  pr.lv[level || 2] = Math.max(pr.lv[level || 2] || 0, stars);
  pr.attempts++; pr.correct += correct; pr.total += total; pr.bestStars = Math.max(pr.bestStars, stars); pr.lastPlayed = new Date().toISOString();
}

function renderVisual(v, planetId) {
  if (!v) return '';
  switch (v.type) {
    case 'tenframe': case 'tenframe2': {
      const size = v.type === 'tenframe2' ? 20 : 10;
      const cells = [];
      for (const g of v.groups) for (let i = 0; i < g.n; i++) cells.push(g.color);
      while (cells.length < size) cells.push('');
      const frames = [];
      for (let f = 0; f < size / 10; f++) frames.push(`<div class="tenframe ${v.mark5 ? 'mark5' : ''}">${cells.slice(f * 10, f * 10 + 10).map(c => `<span class="cell ${c === 'empty' ? '' : c}"></span>`).join('')}</div>`);
      return `<div class="tenframes" role="img" aria-label="Punktefeld">${frames.join('')}</div>`;
    }
    case 'house':
      return `<div class="house" role="img" aria-label="Zahlenhaus"><div class="roof">${v.total}</div><div class="room">${v.a}</div><div class="room q">?</div></div>`;
    case 'array': {
      const rows = Math.min(v.rows, 10), cols = Math.min(v.cols, 10);
      let dots = '';
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dots += `<span class="dot ${r % 2 ? 'alt' : ''}"></span>`;
      return `<div class="array" style="grid-template-columns:repeat(${cols},18px)" role="img" aria-label="${rows} Reihen mit je ${cols} Punkten">${dots}</div>`;
    }
    case 'emoji': {
      const word = v.gap ? `<div class="gap-word">${esc(v.gap[0])}<span class="gap">?</span>${esc(v.gap[1])}</div>` : v.word ? `<div class="word-big">${wordHtml(v.word, planetId !== 'silben')}</div>` : '';
      return `<div><button class="emoji-big" data-say="${esc(v.say)}" aria-label="Wort anhören">${v.emoji}</button>${word}<div class="who-sub">Tippe aufs Bild zum Anhören</div></div>`;
    }
    case 'word':
      return `<div class="word-big">${wordHtml(v.word)}</div>`;
    case 'text':
      return `<div class="story">${esc(v.text)}</div>`;
    case 'listen':
      return `<button class="listen-btn" data-say="${esc(v.say)}" aria-label="Wort anhören"><span class="lb-i">🔊</span><span>Nochmal anhören</span></button>`;
    case 'hands': {
      const hand = k => `<div class="hand">${[0, 1, 2, 3, 4].map(i => `<span class="finger f${i} ${i < k ? 'up' : ''}"></span>`).join('')}<span class="palm"></span></div>`;
      return `<div class="hands" role="img" aria-label="Zwei Hände">${hand(Math.min(5, v.n))}${hand(Math.max(0, v.n - 5))}</div>`;
    }
    case 'compare': {
      const box = pts => `<div class="cmp-box">${pts.map(([x, y]) => `<span class="cmp-dot" style="left:${x}%;top:${y}%"></span>`).join('')}</div>`;
      return `<div class="compare" role="img" aria-label="Zwei Gruppen mit Punkten">${box(v.a)}${box(v.b)}</div>`;
    }
    case 'tens':
      return `<div class="tens" role="img" aria-label="${v.h ? v.h + ' Hunderter, ' : ''}${v.t} Zehner und ${v.o} Einer">${'<span class="t-plate"></span>'.repeat(v.h || 0)}${'<span class="t-bar"></span>'.repeat(v.t)}<span class="t-ones">${'<span class="t-cube"></span>'.repeat(v.o)}</span></div>`;
    case 'numline': {
      const W = 320, L = 16, Rr = 304, X = val => L + (Rr - L) * val / v.max;
      let ticks = '';
      for (let i = 0; i <= v.max; i += v.step) { const big = i % v.label === 0; ticks += `<line x1="${X(i)}" x2="${X(i)}" y1="${big ? 30 : 34}" y2="${big ? 50 : 46}" class="${big ? 'nl-big' : ''}"/>${big ? `<text x="${X(i)}" y="66" text-anchor="middle">${i}</text>` : ''}`; }
      return `<svg class="numline" viewBox="0 0 ${W} 72" role="img" aria-label="Zahlenstrahl von 0 bis ${v.max} mit Pfeil"><line x1="${L}" x2="${Rr}" y1="40" y2="40" class="nl-axis"/>${ticks}<path d="M ${X(v.value)} 26 l -7 -14 h 14 z" class="nl-arrow"/></svg>`;
    }
    case 'gapword':
      return `<div>${v.emoji ? `<button class="emoji-big gap-emoji" data-say="${esc(v.say)}" aria-label="Wort anhören">${v.emoji}</button>` : ''}<div class="gap-word">${esc(v.before)}<span class="gap">?</span>${esc(v.after)}</div><button class="listen-btn small" data-say="${esc(v.say)}" aria-label="Wort anhören"><span class="lb-i">🔊</span><span>Anhören</span></button></div>`;
    case 'fracbar':
      return `<div class="fracbar" role="img" aria-label="${v.k} von ${v.n} Teilen gefärbt">${Array.from({ length: v.n }, (_, i) => `<span class="${i < v.k ? 'on' : ''}"></span>`).join('')}</div>`;
    default: return '';
  }
}

function renderResult(p, correct, total, stars, newly, extra = {}) {
  const passed = stars >= 1;
  const title = p.station ? (extra.won ? `${p.name} gemeistert!` : 'Keine Leben mehr!')
    : stars === 3 ? 'Perfekt! Alle richtig!' : passed ? (p.activity ? 'Super geübt!' : p.level ? `Stufe ${p.level} geschafft!` : 'Mission geschafft!') : 'Gut geübt!';
  const nextLv = !p.activity && p.level && p.level < 3 && passed ? PLANET_LEVELS[p.level] : null;
  $app.innerHTML = `
    <section class="panel result">
      ${p.station ? `<div class="result-stars" aria-label="${extra.lives} Leben übrig">${extra.won ? '❤️'.repeat(extra.lives) + '🤍'.repeat(p.lives - extra.lives) : '🛰️'}</div>`
        : `<div class="result-stars" aria-label="${stars} von 3 Sternen">${[1, 2, 3].map(n => `<span class="${n <= stars ? '' : 'off'}">⭐</span>`).join('')}</div>`}
      <h2>${esc(title)}</h2>
      ${p.station ? (extra.won ? `<p>Du hast ${p.target} Aufgaben geschafft und noch <strong>${extra.lives} ${extra.lives === 1 ? 'Leben' : 'Leben'}</strong> übrig!</p>` : `<p>Du hast <strong>${correct} richtige</strong> Antworten geschafft – du brauchst ${p.target}. Fehler gehören dazu, versuch es gleich nochmal! 💪</p>`)
        : `<p>Du hast <strong>${correct} von ${total}</strong> Aufgaben richtig gelöst.</p>`}
      ${p.level ? `<p class="who-sub">${PLANET_LEVELS[p.level - 1].medal} ${esc(p.name)} · Stufe ${p.level}: ${PLANET_LEVELS[p.level - 1].name}</p>` : ''}
      ${nextLv ? `<div class="new-planet">${nextLv.medal} Neue Stufe offen: <strong>Stufe ${nextLv.n} – ${nextLv.name}</strong></div>` : ''}
      ${!passed && !p.activity && !p.station ? `<p class="who-sub">Für den nächsten Planeten brauchst du ${PASS_CORRECT} richtige. Jeder Versuch macht dich stärker – probier es gleich nochmal! 💪</p>` : ''}
      ${newly.map(x => `<div class="new-planet">🎉 Neuer Planet entdeckt: <strong>${esc(x.name)}</strong></div>`).join('')}
      <h3 style="margin-bottom:0">Wie fühlst du dich jetzt?</h3>
      ${moodPicker('ma')}
      <div class="sheet-actions">
        ${nextLv ? `<button class="btn primary block" id="next-level">${nextLv.medal} Weiter mit Stufe ${nextLv.n}</button>` : ''}
        <button class="btn ${nextLv ? '' : 'primary'} block" id="back">${p.station ? '🪐 Zurück zur Galaxie' : p.activity ? '📚 Zurück zu den Lernwörtern' : '🪐 Zurück zur Galaxie'}</button>
        <button class="btn block" id="again">🔁 ${p.station ? 'Quiz nochmal' : 'Nochmal spielen'}</button>
        ${state.mode === 'kid' && state.offline ? '<button class="btn block" id="send-rep">📤 Bericht an meine Coachin</button>' : ''}
      </div>
      ${state.mode === 'public' && state.info?.contactUrl && !passed ? `<p class="who-sub" style="margin-top:1.4em">Für Eltern: Wenn Rechnen oder Lesen oft schwerfällt, hilft persönliche Begleitung. <a href="${esc(state.info.contactUrl)}" target="_blank" rel="noopener">${esc(state.info.practiceName || 'Beratung')} →</a></p>` : ''}
    </section>`;
  if (passed) confetti(stars * 12);
  speak(p.station ? title : `${title} Du hast ${correct} von ${total} richtig.`);
  let moodSent = false;
  $app.querySelectorAll('#ma .mood').forEach(b => b.onclick = () => {
    $app.querySelectorAll('#ma .mood').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    if (state.mode === 'kid' && state.offline) offlineRecord(k => { const last = k.sessions.at(-1); if (last && last.planetId === p.id) last.moodAfter = Number(b.dataset.v); });
    else if (state.mode === 'kid' && !moodSent) { moodSent = true; apiCall('/api/kid/mood', { method: 'POST', body: { planetId: p.id, moodAfter: Number(b.dataset.v) } }).catch(() => { }); }
    toast('Danke, dass du es mir sagst! 💛');
  });
  document.getElementById('back').onclick = () => {
    if (p.back) { p.back(); return; }
    if (newly[0] && levelOfGalaxy(p.galaxy)) { store.set(rocketKey(levelOfGalaxy(p.galaxy)), p.id); state.galaxy = p.galaxy; }
    renderMap();
    if (newly[0] && levelOfGalaxy(newly[0].galaxy) === levelOfGalaxy(p.galaxy)) setTimeout(() => { placeRocket(newly[0].id, true); store.set(rocketKey(levelOfGalaxy(p.galaxy)), newly[0].id); $app.querySelector(`.pl[data-id="${newly[0].id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 700);
  };
  document.getElementById('again').onclick = () => (p.activity ? runMission({ ...p, tasks: p.regen() }, null) : moodBefore(p));
  document.getElementById('next-level')?.addEventListener('click', () => moodBefore({ ...p, level: p.level + 1 }));
  document.getElementById('send-rep')?.addEventListener('click', showReport);
}

// ---------- Funkspruch der Coachin ----------
function showRadio() {
  const msgs = state.kid?.messages || [];
  if (!msgs.length || $modal.innerHTML) return;
  const from = state.kid.coachName || 'deiner Coachin';
  const s = openModal(`
    <div class="radio-head">📡</div>
    <h2 style="text-align:center">Funkspruch von ${esc(from)}!</h2>
    ${msgs.map(x => `<div class="radio-msg">${esc(x.text)}</div>`).join('')}
    <div class="sheet-actions">
      <button class="btn block" id="say-radio">🔊 Vorlesen</button>
      <button class="btn primary block" id="ok-radio">Verstanden 👍</button>
    </div>`, { center: true });
  const text = `Funkspruch von ${from}! ` + msgs.map(x => x.text).join(' ');
  s.querySelector('#say-radio').onclick = () => speak(text);
  s.querySelector('#ok-radio').onclick = async () => {
    closeModal();
    if (state.offline) offlineRecord(k => { k.seen.push(...msgs.map(x => x.id)); k.inbox = []; });
    else { try { await apiCall('/api/kid/messages/read', { method: 'POST', body: { ids: msgs.map(x => x.id) } }); } catch { } }
    state.kid.messages = [];
  };
  if (state.settings.autoread) speak(text);
}

function askLogout() {
  const s = openModal(`<h2>Zurück zum Start?</h2><p>${state.offline ? 'Dein Fortschritt bleibt auf diesem Gerät gespeichert.' : 'Dein Fortschritt ist bei deiner Coachin gespeichert.'} Auf diesem Gerät angemeldet bleiben?</p>
    <div class="sheet-actions"><button class="btn primary block" id="stay">Angemeldet bleiben</button><button class="btn block" id="logout">Abmelden (Code vergessen)</button><button class="btn block" id="cancel">Hier bleiben</button></div>`, { center: true });
  s.querySelector('#stay').onclick = () => { closeModal(); renderStart(); };
  s.querySelector('#logout').onclick = () => { closeModal(); store.del('code'); store.del('offline_current'); state.code = null; state.kid = null; state.offline = false; renderStart(); };
  s.querySelector('#cancel').onclick = () => closeModal();
}

// ---------- Coach-Login ----------
// Mit Server: Passwort-Login unter /coach. Als claude.ai-Web-App: Anmeldung über das Claude-Konto
// (nur wer die App bearbeiten darf, also die Coachin, kommt hinein).
async function coachLogin() {
  if (state.server) { location.href = '/coach'; return; }
  const sheet = openModal(`<h2>🔐 Coach-Login</h2><p>Anmeldung wird geprüft …</p>`, { center: true });
  let allowed = false;
  try {
    for (let i = 0; i < 20 && !window.claude?.use; i++) await new Promise(r => setTimeout(r, 100));
    const user = window.claude?.use ? await Promise.race([window.claude.use('user'), new Promise(r => setTimeout(() => r(null), 6000))]) : null;
    allowed = user ? (await user.isOwner()) || (await user.canEdit()) : false;
  } catch { allowed = false; }
  if (!sheet.isConnected) return;
  const coachUrl = document.querySelector('meta[name="sh-coach-url"]')?.content;
  if (!allowed && coachUrl && !window.claude?.use) { // öffentliche Website: Coach-Bereich liegt auf claude.ai
    sheet.innerHTML = `<h2>🔐 Coach-Login</h2><p>Der Coach-Bereich öffnet sich in einem neuen Fenster (Anmeldung mit dem Claude-Konto und PIN).</p>
      <div class="sheet-actions"><a class="btn primary block" href="${esc(coachUrl)}" target="_blank" rel="noopener">Zum Coach-Bereich</a><button class="btn block" id="ok">Abbrechen</button></div>`;
    sheet.querySelector('#ok').onclick = () => closeModal();
    return;
  }
  if (!allowed) {
    sheet.innerHTML = `<h2>🔐 Coach-Login</h2>
      <p>Der Coach-Bereich ist nur für das Team von ${APP_NAME}. Öffne die App dafür auf claude.ai und melde dich mit deinem Claude-Konto an.</p>
      <p class="who-sub">Kinder brauchen keinen Login: einfach „Losfliegen“ oder den eigenen Code verwenden.</p>
      <div class="sheet-actions"><button class="btn primary block" id="ok">Verstanden</button></div>`;
    sheet.querySelector('#ok').onclick = () => closeModal();
    return;
  }
  closeModal();
  openCoach();
}
async function openCoach() {
  if (!document.querySelector('link[href="css/coach.css"]')) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/coach.css'; document.head.appendChild(l);
  }
  const el = document.createElement('div');
  el.className = 'lv-coach embedded';
  document.body.appendChild(el);
  const { bootLite } = await import('./coach-lite.js');
  bootLite(el, { onExit: () => { el.remove(); renderStart(); } });
}

// ---------- Profil: Statistik, Pokale, eigene Wörter (pro Kind bzw. Gerät) ----------
const profileKey = () => (state.mode === 'kid' ? 'prof_srv_' + (state.kid?.code || '') : 'prof_public');
function getProfile() {
  if (state.mode === 'kid' && state.offline) { const k = offlineKids()[state.kid.id] || {}; return { stats: k.stats, trophies: k.trophies, ownWords: k.ownWords, look: k.look, placement: k.placement, stations: k.stations }; }
  return store.get(profileKey(), {});
}
function saveProfile(p) {
  if (state.mode === 'kid' && state.offline) offlineRecord(k => { k.stats = p.stats; k.trophies = p.trophies; k.ownWords = p.ownWords; k.look = p.look; k.placement = p.placement; k.stations = p.stations; });
  else store.set(profileKey(), p);
}
function earn(change) {
  const p = getProfile();
  const fresh = award(p, state.progress, change);
  saveProfile(p);
  if (fresh.length) setTimeout(() => showNewTrophies(fresh), 900);
  return fresh;
}
function rewardStatus() {
  const r = state.mode === 'kid' ? state.kid?.reward : null;
  if (!r?.text) return null;
  const have = Object.keys(getProfile().trophies || {}).length;
  return { ...r, have, left: Math.max(0, r.goal - have) };
}
function rewardHtml() {
  const r = rewardStatus(); if (!r) return '';
  return `<div class="reward ${r.left ? '' : 'reached'}"><span class="reward-i">🎁</span><div><b>${r.left ? `Noch ${r.left} ${r.left === 1 ? 'Pokal' : 'Pokale'} bis:` : 'Ziel erreicht! Zeig das deiner Coachin:'}</b><br>${esc(r.text)}
    <div class="reward-bar"><span style="width:${Math.min(100, 100 * r.have / r.goal)}%"></span></div></div></div>`;
}
function showNewTrophies(list) {
  if ($modal.innerHTML) { setTimeout(() => showNewTrophies(list), 1500); return; }
  if (state.settings.sound) sound('trophy');
  confetti(18);
  const t = list[0];
  const s = openModal(`<div class="trophy-pop">
      <div class="trophy-big">${t.icon}</div><h2>Neuer Pokal!</h2>
      <p class="trophy-name">${esc(t.name)}</p><p>${esc(t.desc)}</p>
      ${list.length > 1 ? `<p class="who-sub">Und noch ${list.length - 1} ${list.length > 2 ? 'Pokale' : 'Pokal'} dazu!</p>` : ''}
      ${rewardHtml()}
      <div class="sheet-actions"><button class="btn primary block" id="tp-ok">Juhu! 🎉</button><button class="btn block" id="tp-all">🏆 Alle Pokale ansehen</button></div></div>`, { center: true });
  speak(`Neuer Pokal: ${t.name}! ${t.desc}`);
  s.querySelector('#tp-ok').onclick = () => closeModal();
  s.querySelector('#tp-all').onclick = () => { closeModal(); renderTrophies(); };
}

// ---------- Kopfzeile & Menü-Leiste ----------
// Aussehen des Kindes (Avatar, Spitzname, Raumschiff, Weltraum-Farbe)
function look() {
  const kid = state.mode === 'kid' ? state.kid : null, l = getProfile().look || {};
  const ship = SHIPS.find(x => x.e === l.ship) || SHIPS[0];
  return { avatar: l.avatar || kid?.avatar || '🧑‍🚀', name: l.nick || kid?.name || 'Weltraum-Entdecker', ship: ship.e, space: l.space || 'lila' };
}
function applyLook() { document.body.dataset.space = look().space; }
const totalStars = () => Object.values(state.progress).reduce((a, p) => a + (p.bestStars || 0), 0);
function topbar() {
  const trophies = Object.keys(getProfile().trophies || {}).length, L = look(), rank = rankFor(totalStars());
  applyLook();
  return `<header class="topbar">
      <button class="icon-btn" id="home" aria-label="Zum Start">🏠</button>
      <button class="who" id="me" aria-label="Mein Profil gestalten">
        <div class="avatar" aria-hidden="true">${esc(L.avatar)}</div>
        <div style="min-width:0">
          <div class="who-name">${esc(L.name)}</div>
          <div class="who-sub">${rank.icon} ${esc(rank.name)}</div>
        </div>
      </button>
      <span class="star-count" aria-label="${totalStars()} Sterne, ${trophies} Pokale">⭐ ${totalStars()}${trophies ? ` · 🏆 ${trophies}` : ''}</span>
      <button class="icon-btn" id="settings" aria-label="Einstellungen">⚙️</button>
    </header>`;
}
const NAV = [['map', '🪐', 'Planeten'], ['words', '📚', 'Wörter'], ['games', '🧩', 'Spiele'], ['trophies', '🏆', 'Pokale'], ['more', '☰', 'Mehr']];
const SCREENS = { map: () => renderMap(), words: () => renderWords(), games: () => renderGames(), trophies: () => renderTrophies(), more: () => renderMore() };
function navBar(active) {
  state.screen = active;
  const hasWords = state.mode === 'kid' && (state.kid?.wordLists || []).length;
  return `<nav class="bottom-nav" aria-label="Hauptmenü">${NAV.map(([id, ic, l]) => `<button data-nav="${id}" ${id === active ? 'aria-current="page"' : ''}><span class="ni">${ic}${id === 'words' && hasWords ? '<i class="dot"></i>' : ''}</span><span class="nl">${l}</span></button>`).join('')}</nav>`;
}
function bindChrome() {
  document.getElementById('home')?.addEventListener('click', () => { if (state.mode === 'kid') askLogout(); else renderStart(); });
  document.getElementById('settings')?.addEventListener('click', openSettings);
  document.getElementById('me')?.addEventListener('click', renderProfile);
  $app.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => { window.speechSynthesis?.cancel(); SCREENS[b.dataset.nav](); scrollTo(0, 0); });
  $app.querySelectorAll('[data-say]').forEach(b => b.addEventListener('click', () => speak(b.dataset.say, .8)));
}

// ---------- Lernwörter ----------
function allWordLists() {
  const lists = state.mode === 'kid' ? (state.kid?.wordLists || []).map(l => ({ ...l, from: 'coach' })) : [];
  const own = getProfile().ownWords || [];
  if (own.length) lists.push({ id: 'own', name: 'Meine eigenen Wörter', words: own, from: 'own' });
  return lists;
}
function wordChip(w) {
  const s = syllablesOfCustom(w);
  if (!s || !state.settings.syll) return esc(cleanWord(w));
  return s.map((x, i) => `<span class="syl${(i % 2) + 1}">${esc(x)}</span>`).join('');
}
function renderWords() {
  const lists = allWordLists(), ownCount = (getProfile().ownWords || []).length;
  $app.innerHTML = `${topbar()}
    <section class="screen">
      <h2 class="screen-title">📚 Lernwörter</h2>
      ${lists.length ? '' : `<div class="panel empty"><p class="empty-i">📝</p>
        <p><b>Hier stehen deine Lernwörter.</b></p>
        <p class="who-sub">${state.mode === 'kid' ? 'Deine Coachin kann dir Wörter schicken. Du kannst auch selbst Wörter aus der Schule eintragen.' : 'Trag Wörter aus der Schule ein – dann kannst du sie anhören, üben und als Rätsel spielen.'}</p></div>`}
      ${lists.map((l, i) => `<article class="panel wl">
        <div class="wl-head"><h3>${l.from === 'coach' ? '🚩' : '✏️'} ${esc(l.name)}</h3><span class="who-sub">${l.words.length} ${l.words.length === 1 ? 'Wort' : 'Wörter'}</span></div>
        <div class="wl-chips">${l.words.slice(0, 14).map(w => `<button class="chip" data-say="${esc(cleanWord(w))}">${wordChip(w)}</button>`).join('')}${l.words.length > 14 ? `<span class="who-sub">+ ${l.words.length - 14} weitere</span>` : ''}</div>
        <div class="wl-actions"><button class="btn primary" data-train="${i}">🚀 Üben</button><button class="btn" data-view="${i}">👀 Alle</button><button class="btn" data-puzzle="${i}">🧩 Rätsel</button></div>
      </article>`).join('')}
      <button class="btn block" id="own">✏️ ${ownCount ? 'Eigene Wörter bearbeiten' : 'Eigene Wörter eintragen'}</button>
      <p class="who-sub" style="text-align:center">Tipp: Wörter mit Bindestrich eintragen (Scho-ko-la-de), dann erscheinen die Silben farbig.</p>
    </section>${navBar('words')}`;
  bindChrome();
  $app.querySelectorAll('[data-train]').forEach(b => b.onclick = () => {
    const l = lists[Number(b.dataset.train)];
    const regen = () => wordMission(l.words);
    runMission({ id: 'lernwoerter', name: 'Lernwörter: ' + l.name, label: '📚', galaxy: 'woerter', activity: true, tasks: regen(), regen, back: renderWords }, null);
  });
  $app.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
    const l = lists[Number(b.dataset.view)];
    const sheet = openModal(`<h2>${esc(l.name)}</h2>
      <div class="word-list">${l.words.map(w => `<button class="word-row" data-w="${esc(cleanWord(w))}"><span class="wr-w">${wordChip(w)}</span><span aria-hidden="true">🔊</span></button>`).join('')}</div>
      <div class="sheet-actions"><button class="btn block" id="readall">🔊 Alle vorlesen</button><button class="btn primary block" id="close">Fertig</button></div>`);
    sheet.querySelectorAll('[data-w]').forEach(x => x.onclick = () => speak(x.dataset.w, .75));
    sheet.querySelector('#readall').onclick = () => speak(l.words.map(cleanWord).join('. ') + '.', .85);
    sheet.querySelector('#close').onclick = () => closeModal();
  });
  $app.querySelectorAll('[data-puzzle]').forEach(b => b.onclick = () => { const l = lists[Number(b.dataset.puzzle)]; renderGames({ words: l.words.map(cleanWord), listName: l.name }); });
  document.getElementById('own').onclick = () => {
    const p = getProfile();
    const sheet = openModal(`<h2>✏️ Eigene Lernwörter</h2>
      <p class="who-sub">Ein Wort pro Zeile. Mit Bindestrich getrennt (Ta-fel) werden die Silben farbig.</p>
      <textarea id="ow" class="word-input" rows="8" placeholder="Fahr-rad&#10;Schu-le&#10;spielen">${esc((p.ownWords || []).join('\n'))}</textarea>
      <div class="sheet-actions"><button class="btn primary block" id="save">Speichern</button><button class="btn block" id="cancel">Abbrechen</button></div>`);
    sheet.querySelector('#save').onclick = () => { p.ownWords = parseWordInput(sheet.querySelector('#ow').value); saveProfile(p); closeModal(); renderWords(); toast('Gespeichert ✓'); };
    sheet.querySelector('#cancel').onclick = () => closeModal();
  };
}

// ---------- Spiele-Ecke ----------
const GAME_LEVELS = [{ id: 'start', name: 'Leicht', icon: '🌱' }, { id: 'vs34', name: 'Mittel', icon: '🚀' }, { id: 'us', name: 'Schwer', icon: '🌠' }];
function renderGames(opts = {}) {
  let level = store.get('game_level', 'start');
  if (!GAME_LEVELS.some(l => l.id === level)) level = 'start';
  const draw = () => {
    $app.innerHTML = `${topbar()}
      <section class="screen">
        <h2 class="screen-title">🧩 Spiele-Ecke</h2>
        <p class="who-sub" style="margin-top:-6px">Knobeln, Rätseln, Spaß haben – und dabei ganz nebenbei lernen.</p>
        <nav class="levels" aria-label="Schwierigkeit">${GAME_LEVELS.map(l => `<button class="level" data-l="${l.id}" aria-pressed="${l.id === level}"><span class="li">${l.icon}</span> ${esc(l.name)}</button>`).join('')}</nav>
        ${opts.words ? `<div class="panel words-banner">📚 Wort-Rätsel mit deinen Lernwörtern: <b>${esc(opts.listName)}</b> <button class="icon-btn small" id="nowords" aria-label="Lernwörter nicht verwenden">✕</button></div>` : ''}
        <div class="game-grid">${GAMES.map(gm => `<button class="game-card" data-g="${gm.id}"><span class="gc-i">${gm.icon}</span><span class="gc-n">${gm.name}</span><span class="gc-d">${esc(gm.desc[level])}${opts.words && ['kreuzwort', 'wortsuche'].includes(gm.id) ? ' · mit Lernwörtern' : ''}</span></button>`).join('')}</div>
      </section>${navBar('games')}`;
    bindChrome();
    $app.querySelectorAll('.level').forEach(b => b.onclick = () => { level = b.dataset.l; store.set('game_level', level); draw(); });
    document.getElementById('nowords')?.addEventListener('click', () => { opts = {}; draw(); });
    $app.querySelectorAll('.game-card').forEach(b => b.onclick = () => playGame(b.dataset.g, level, opts));
  };
  draw();
}
function playGame(id, level, opts) {
  const gm = GAMES.find(x => x.id === id);
  $app.innerHTML = `${topbar()}
    <section class="screen">
      <div class="game-head"><button class="icon-btn" id="g-back" aria-label="Zurück">←</button><h2>${gm.icon} ${gm.name}</h2><button class="icon-btn" id="g-new" aria-label="Neues Rätsel" title="Neues Rätsel">🔄</button></div>
      <div class="panel game" id="game"></div>
      <div id="g-done"></div>
    </section>${navBar('games')}`;
  bindChrome();
  document.getElementById('g-back').onclick = () => renderGames(opts);
  document.getElementById('g-new').onclick = () => playGame(id, level, opts);
  try {
    renderGame(id, level, document.getElementById('game'), {
      words: ['kreuzwort', 'wortsuche'].includes(id) ? opts.words : null,
      speak: w => speak(w, .8),
      onSolved: () => {
        if (state.settings.sound) sound('win');
        confetti(30); speak('Geschafft! Super gemacht!');
        const d = document.getElementById('g-done');
        d.innerHTML = `<div class="panel solved"><h2>🎉 Geschafft!</h2><p>Du hast das Rätsel gelöst.</p><div class="sheet-actions"><button class="btn primary block" id="g-again">🔄 Noch ein Rätsel</button><button class="btn block" id="g-list">🧩 Andere Spiele</button></div></div>`;
        d.querySelector('#g-again').onclick = () => playGame(id, level, opts);
        d.querySelector('#g-list').onclick = () => renderGames(opts);
        d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        earn({ games: 1, gameKind: id });
      },
    });
  } catch (e) { document.getElementById('game').innerHTML = '<p>Dieses Rätsel konnte nicht erstellt werden. Tippe auf 🔄 für ein neues.</p>'; console.error(e); }
}

// ---------- Pokale & Lern-Tage ----------
function renderTrophies() {
  const prof = getProfile(), have = prof.trophies || {}, stats = { ...emptyStats(), ...(prof.stats || {}) };
  const wd = weekDays(stats.days), goal = store.get('week_goal', 3), n = wd.filter(d => d.done).length;
  $app.innerHTML = `${topbar()}
    <section class="screen">
      <h2 class="screen-title">🏆 Deine Pokale</h2>
      <div class="panel week">
        <h3>Deine Lern-Tage diese Woche</h3>
        <div class="week-days">${wd.map(d => `<div class="wd ${d.done ? 'done' : ''} ${d.isToday ? 'today' : ''}"><span>${d.done ? '⭐' : ''}</span><small>${d.name}</small></div>`).join('')}</div>
        <p class="who-sub">${n >= goal ? `🎉 Wochenziel geschafft: ${n} Lern-Tage!` : `${n} von ${goal} Lern-Tagen. Pausen sind erlaubt – jeder Lern-Tag zählt!`}</p>
      </div>
      ${rewardHtml()}
      <p class="trophy-count">${Object.keys(have).length} von ${TROPHIES.length} Pokalen gesammelt</p>
      <div class="trophy-grid">${TROPHIES.map(t => `<button class="trophy ${have[t.id] ? 'got' : 'locked'}" data-t="${t.id}"><span class="ti">${have[t.id] ? t.icon : '🔒'}</span><span class="tn">${esc(t.name)}</span></button>`).join('')}</div>
    </section>${navBar('trophies')}`;
  bindChrome();
  $app.querySelectorAll('.trophy').forEach(b => b.onclick = () => {
    const t = TROPHIES.find(x => x.id === b.dataset.t), got = have[t.id];
    const s = openModal(`<div class="trophy-pop"><div class="trophy-big">${got ? t.icon : '🔒'}</div><h2>${esc(t.name)}</h2><p>${got ? 'Geschafft: ' : 'So bekommst du ihn: '}${esc(t.desc)}</p>${got ? `<p class="who-sub">Gesammelt am ${new Date(got + 'T12:00:00').toLocaleDateString('de-AT')}</p>` : ''}<div class="sheet-actions"><button class="btn primary block" id="ok">OK</button></div></div>`, { center: true });
    speak(`${t.name}. ${t.desc}`);
    s.querySelector('#ok').onclick = () => closeModal();
  });
}

// ---------- Mein Profil (Personalisierung) ----------
function renderProfile() {
  const prof = getProfile(), L = look(), have = Object.keys(prof.trophies || {}).length, stars = totalStars(), rank = rankFor(stars);
  const kid = state.mode === 'kid' ? state.kid : null;
  const save = patch => { const p = getProfile(); p.look = { ...(p.look || {}), ...patch }; saveProfile(p); };
  $app.innerHTML = `${topbar()}
    <section class="screen profile">
      <h2 class="screen-title">🎨 Mein Profil</h2>
      <div class="panel me-card">
        <div class="me-avatar">${esc(L.avatar)}<span class="me-ship ${L.ship === '🚀' ? '' : 'norot'}">${L.ship}</span></div>
        <div class="me-info"><div class="me-name">${esc(L.name)}</div>
          <div class="me-rank">${rank.icon} ${esc(rank.name)}</div>
          ${rank.next ? `<div class="reward-bar" aria-hidden="true"><span style="width:${Math.min(100, 100 * (stars - rank.min) / (rank.next.min - rank.min))}%"></span></div><small class="who-sub">Noch ${rank.next.min - stars} ⭐ bis ${rank.next.icon} ${esc(rank.next.name)}</small>` : '<small class="who-sub">Höchster Rang erreicht! 👑</small>'}
        </div>
      </div>
      <div class="panel"><h3>Dein Spitzname</h3>
        <form id="nickf" class="nick-row"><input id="nick" class="word-input" maxlength="16" value="${esc(prof.look?.nick || '')}" placeholder="${esc(kid?.name || 'Dein Name')}" autocomplete="off">
        <button class="btn primary">Speichern</button></form>
        <p class="who-sub">${kid ? 'Deine Coachin sieht weiterhin deinen richtigen Namen.' : 'Wird nur auf diesem Gerät gespeichert.'}</p></div>
      <div class="panel"><h3>Dein Avatar</h3>
        <div class="pick-grid avatars">${AVATARS.map(a => `<button class="pick ${a === L.avatar ? 'sel' : ''}" data-av="${a}" aria-label="Avatar ${a}" aria-pressed="${a === L.avatar}">${a}</button>`).join('')}</div>
        ${kid && prof.look?.avatar && prof.look.avatar !== kid.avatar ? `<button class="btn block" id="reset-av" style="margin-top:10px">${esc(kid.avatar)} Avatar von deiner Coachin nehmen</button>` : ''}</div>
      <div class="panel"><h3>Dein Raumschiff</h3>
        <div class="pick-grid ships">${SHIPS.map(x => { const locked = have < x.need; return `<button class="pick ship ${x.e === L.ship ? 'sel' : ''} ${locked ? 'locked' : ''}" data-ship="${x.e}" ${locked ? `data-need="${x.need}"` : ''} aria-label="${esc(x.name)}${locked ? `, ab ${x.need} Pokalen` : ''}"><span>${locked ? '🔒' : x.e}</span><small>${locked ? `ab ${x.need} 🏆` : esc(x.name)}</small></button>`; }).join('')}</div></div>
      <div class="panel"><h3>Deine Weltraum-Farbe</h3>
        <div class="pick-grid spaces">${SPACES.map(x => { const locked = have < x.need; return `<button class="pick space ${x.id === L.space ? 'sel' : ''} ${locked ? 'locked' : ''}" data-space="${x.id}" ${locked ? `data-need="${x.need}"` : ''} style="--a:${x.sw[0]};--b:${x.sw[1]}"><span class="sw">${locked ? '🔒' : ''}</span><small>${locked ? `ab ${x.need} 🏆` : esc(x.name)}</small></button>`; }).join('')}</div>
        <p class="who-sub">Sammle Pokale, um neue Raumschiffe und Farben freizuschalten! Du hast ${have} 🏆.</p></div>
    </section>${navBar('more')}`;
  bindChrome();
  $app.querySelector('#nickf').onsubmit = e => { e.preventDefault(); save({ nick: $app.querySelector('#nick').value.trim().slice(0, 16) }); toast('Gespeichert ✓'); renderProfile(); };
  $app.querySelectorAll('[data-av]').forEach(b => b.onclick = () => { save({ avatar: b.dataset.av }); renderProfile(); });
  document.getElementById('reset-av')?.addEventListener('click', () => { save({ avatar: '' }); renderProfile(); });
  const lockedMsg = b => { toast(`🔒 Das gibt es ab ${b.dataset.need} Pokalen. Du schaffst das!`); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); };
  $app.querySelectorAll('[data-ship]').forEach(b => b.onclick = () => { if (b.dataset.need) return lockedMsg(b); save({ ship: b.dataset.ship }); renderProfile(); });
  $app.querySelectorAll('[data-space]').forEach(b => b.onclick = () => { if (b.dataset.need) return lockedMsg(b); save({ space: b.dataset.space }); renderProfile(); });
}

// ---------- Mehr ----------
const appUrl = () => document.querySelector('meta[name="sh-kid-app"]')?.content || location.origin + location.pathname;
function renderMore() {
  const goal = store.get('week_goal', 3);
  $app.innerHTML = `${topbar()}
    <section class="screen">
      <h2 class="screen-title">☰ Mehr</h2>
      <div class="panel more-list">
        ${coachContact() ? '<button class="more-item" id="m-msg"><span class="mi">💬</span><span>Nachricht an meine Coachin<small>Per WhatsApp oder E-Mail – auch für Eltern</small></span></button>' : ''}
        ${state.mode === 'kid' ? '<button class="more-item" id="m-mail"><span class="mi">📡</span><span>Meine Funksprüche<small>Alle Nachrichten von deiner Coachin</small></span></button>' : ''}
        <button class="more-item" id="m-place"><span class="mi">🧭</span><span>Einstufungstest<small>Wo stehe ich in Mathe und Deutsch?</small></span></button>
        <button class="more-item" id="m-me"><span class="mi">🎨</span><span>Mein Profil<small>Avatar, Spitzname, Raumschiff & Farben</small></span></button>
        <button class="more-item" id="m-settings"><span class="mi">⚙️</span><span>Schrift, Farben & Töne<small>Lesefolie, Silbenfarben, Vorlesen</small></span></button>
        <button class="more-item" id="m-remind"><span class="mi">⏰</span><span>Erinnerung einrichten<small>Für Eltern: Lernzeit im Handy-Kalender</small></span></button>
        <button class="more-item" id="m-goal"><span class="mi">🎯</span><span>Wochenziel<small>${goal} Lern-Tage pro Woche</small></span></button>
        ${state.mode === 'kid' && state.offline ? '<button class="more-item" id="m-report"><span class="mi">📤</span><span>Bericht an meine Coachin<small>Fortschritt per WhatsApp oder E-Mail schicken</small></span></button>' : ''}
        <button class="more-item" id="m-parents"><span class="mi">👨‍👩‍👧</span><span>Für Eltern<small>So unterstützen Sie Ihr Kind</small></span></button>
        <button class="more-item" id="m-home"><span class="mi">🏠</span><span>Zum Startbildschirm<small>${state.mode === 'kid' ? 'Abmelden oder angemeldet bleiben' : 'Code eingeben oder Coach-Login'}</small></span></button>
      </div>
    </section>${navBar('more')}`;
  bindChrome();
  document.getElementById('m-settings').onclick = openSettings;
  document.getElementById('m-me').onclick = renderProfile;
  document.getElementById('m-msg')?.addEventListener('click', openMessageToCoach);
  document.getElementById('m-mail')?.addEventListener('click', () => {
    const box = state.offline ? (offlineKids()[state.kid.id]?.mailbox || []) : (state.kid?.mailbox || []);
    const s = openModal(`<h2>📡 Meine Funksprüche</h2>
      ${box.length ? `<div class="word-list">${[...box].reverse().map(x => `<button class="radio-msg mail-item" data-text="${esc(x.text)}"><small>${new Date(x.ts).toLocaleDateString('de-AT')}</small><br>${esc(x.text)} <span aria-hidden="true">🔊</span></button>`).join('')}</div>` : '<p>Noch keine Funksprüche. Wenn deine Coachin dir schreibt, findest du die Nachrichten hier.</p>'}
      <div class="sheet-actions"><button class="btn primary block" id="ok">Schließen</button></div>`);
    s.querySelectorAll('[data-text]').forEach(b => b.onclick = () => speak(b.dataset.text));
    s.querySelector('#ok').onclick = () => closeModal();
  });
  document.getElementById('m-place').onclick = () => {
    const pl = getProfile().placement || {};
    const s = openModal(`<h2>🧭 Einstufungstest</h2><p>Welches Fach?</p>
      <div class="sheet-actions">${LEVELS.map(l => `<button class="btn block" data-sub="${l.id}">${l.icon} ${esc(l.name)}${pl[l.id] ? ' – nochmal' : ''}</button>${pl[l.id] ? `<button class="btn block small-link" data-res="${l.id}">Letztes Ergebnis ${esc(l.name)} ansehen</button>` : ''}`).join('')}
      <button class="btn block" id="close">Abbrechen</button></div>`, { center: true });
    s.querySelectorAll('[data-sub]').forEach(b => b.onclick = () => { closeModal(); startPlacement(b.dataset.sub); });
    s.querySelectorAll('[data-res]').forEach(b => b.onclick = () => { closeModal(); renderPlacementResult(b.dataset.res); });
    s.querySelector('#close').onclick = () => closeModal();
  };
  document.getElementById('m-remind').onclick = openReminder;
  document.getElementById('m-report')?.addEventListener('click', showReport);
  document.getElementById('m-home').onclick = () => { if (state.mode === 'kid') askLogout(); else renderStart(); };
  document.getElementById('m-goal').onclick = () => {
    const s = openModal(`<h2>🎯 Wochenziel</h2><p>An wie vielen Tagen pro Woche möchtest du üben?</p>
      <div class="seg goal-seg">${[2, 3, 4, 5].map(v => `<button data-v="${v}" aria-pressed="${v === goal}">${v} Tage</button>`).join('')}</div>
      <p class="who-sub">Unser Tipp: Lieber oft und kurz (10 Minuten) als selten und lang.</p>
      <div class="sheet-actions"><button class="btn primary block" id="ok">Fertig</button></div>`);
    s.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { store.set('week_goal', Number(b.dataset.v)); s.querySelectorAll('[data-v]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    s.querySelector('#ok').onclick = () => { closeModal(); renderMore(); };
  };
  document.getElementById('m-parents').onclick = () => {
    const i = state.info || {};
    const s = openModal(`<h2>👨‍👩‍👧 Für Eltern</h2>
      <ul class="tips">
        <li><b>Kurz und regelmäßig:</b> 10 Minuten an 3–5 Tagen bringen mehr als eine Stunde am Wochenende.</li>
        <li><b>Loben Sie die Anstrengung,</b> nicht nur das Ergebnis: „Du bist drangeblieben!“</li>
        <li><b>Fehler sind erlaubt.</b> Die App erklärt jeden Fehler freundlich – es gibt keinen Zeitdruck.</li>
        <li><b>Hilfen nutzen:</b> Vorlesen 🔊, Lesefolie und farbige Silben finden Sie unter ⚙️.</li>
        <li><b>Gefühle ernst nehmen:</b> Vor und nach jeder Mission fragt die App, wie es Ihrem Kind geht.</li>
        <li><b>Lernwörter aus der Schule</b> können Sie unter 📚 selbst eintragen.</li>
      </ul>
      ${i.contactUrl ? `<p><a href="${esc(i.contactUrl)}" target="_blank" rel="noopener">Kontakt zu ${esc(i.practiceName || APP_NAME)} →</a></p>` : `<p class="who-sub">${APP_NAME} – Lerncoaching bei Legasthenie und Dyskalkulie.</p>`}
      <div class="sheet-actions"><button class="btn primary block" id="ok">Schließen</button></div>`);
    s.querySelector('#ok').onclick = () => closeModal();
  };
}
// ---------- Nachricht an die Coachin (Eltern oder Kind) ----------
function coachContact() {
  const c = state.mode === 'kid' ? (state.offline ? offlineKids()[state.kid.id]?.contact : state.kid?.contact) : null;
  const meta = n => document.querySelector(`meta[name="sh-contact-${n}"]`)?.content || '';
  const site = { name: meta('name'), phone: meta('phone'), email: meta('email') };
  const x = c && (c.phone || c.email) ? c : site;
  return x.phone || x.email ? x : null;
}
async function openMessageToCoach() {
  const c = coachContact(); if (!c) return;
  const kidName = state.mode === 'kid' ? state.kid.name : '';
  const s = openModal(`<h2>💬 Nachricht an ${esc(c.name || 'die Coachin')}</h2>
    <p class="who-sub">Für Eltern und Kinder: Schreib eine Nachricht – sie wird per WhatsApp oder E-Mail verschickt.</p>
    <div class="seg" style="margin-bottom:8px">${['Wir haben heute geübt! 💪', 'Ich habe eine Frage: ', 'Können wir den Termin verschieben? '].map((t, i) => `<button data-tpl="${i}">${esc(t.replace(/:? $/, ''))}</button>`).join('')}</div>
    <textarea id="cm" class="word-input" rows="5" maxlength="1500" placeholder="Deine Nachricht …"></textarea>
    ${state.mode === 'kid' && state.offline ? '<label class="check-row"><input type="checkbox" id="cm-rep" checked> Fortschritts-Bericht mitschicken</label>' : ''}
    <div class="sheet-actions">
      ${c.phone ? '<button class="btn primary block" id="cm-wa">🟢 Per WhatsApp senden</button>' : ''}
      ${c.email ? '<button class="btn block" id="cm-mail">✉️ Per E-Mail senden</button>' : ''}
      <button class="btn block" id="cm-copy">📋 Text kopieren</button>
      <button class="btn block" id="cm-close">Abbrechen</button>
    </div>
    ${c.email ? `<p class="who-sub">E-Mail: ${esc(c.email)}</p>` : ''}`);
  const tpls = ['Wir haben heute geübt! 💪', 'Ich habe eine Frage: ', 'Können wir den Termin verschieben? '];
  s.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => { const ta = s.querySelector('#cm'); ta.value = tpls[b.dataset.tpl]; ta.focus(); });
  const build = async () => {
    let t = s.querySelector('#cm').value.trim();
    if (!t) { toast('Bitte zuerst eine Nachricht schreiben.'); return null; }
    if (kidName) t = `${t}\n\n– ${kidName}`;
    if (s.querySelector('#cm-rep')?.checked) { const k = offlineKids()[state.kid.id]; t += `\n\n🪐 ${APP_NAME}-Bericht von ${k.name}\n${await encodeReport(k)}`; }
    return t;
  };
  s.querySelector('#cm-wa')?.addEventListener('click', async () => { const t = await build(); if (t) { window.open(waLink(c.phone, t), '_blank', 'noopener'); closeModal(); toast('WhatsApp wird geöffnet …'); } });
  s.querySelector('#cm-mail')?.addEventListener('click', async () => { const t = await build(); if (t) { location.href = mailLink(c.email, `${APP_NAME}${kidName ? ': ' + kidName : ''}`, t); closeModal(); } });
  s.querySelector('#cm-copy').onclick = async () => { const t = await build(); if (!t) return; try { await navigator.clipboard.writeText(t); toast('Kopiert!'); } catch { toast('Kopieren nicht möglich – bitte Text markieren.'); } };
  s.querySelector('#cm-close').onclick = () => closeModal();
}

function openReminder() {
  const r = store.get('reminder', { time: '16:00', days: ['MO', 'TU', 'WE', 'TH', 'FR'] });
  const DAYS = [['MO', 'Mo'], ['TU', 'Di'], ['WE', 'Mi'], ['TH', 'Do'], ['FR', 'Fr'], ['SA', 'Sa'], ['SU', 'So']];
  const s = openModal(`<h2>⏰ Lern-Erinnerung</h2>
    <p class="who-sub">Für Eltern: Tragen Sie eine wiederkehrende Lernzeit in Ihren Handy-Kalender ein – das Handy erinnert dann automatisch.</p>
    <div class="setting"><span>Uhrzeit</span><input type="time" id="rt" class="time-input" value="${r.time}"></div>
    <div class="setting"><span>Tage</span><div class="seg">${DAYS.map(([k, l]) => `<button data-d="${k}" aria-pressed="${r.days.includes(k)}">${l}</button>`).join('')}</div></div>
    <div class="sheet-actions">
      <a class="btn primary block" id="gcal" target="_blank" rel="noopener">📅 In Google Kalender eintragen</a>
      <a class="btn block" id="ocal" target="_blank" rel="noopener">📅 In Outlook eintragen</a>
    </div>
    <p class="who-sub">iPhone: Öffnen Sie die App „Erinnerungen“ oder den Wecker und stellen Sie eine tägliche Erinnerung um ${r.time} Uhr ein. Hinweis: Web-Apps dürfen aus Datenschutzgründen keine Push-Nachrichten schicken.</p>
    <button class="btn block" id="close">Schließen</button>`);
  const update = () => {
    const days = [...s.querySelectorAll('[data-d][aria-pressed="true"]')].map(b => b.dataset.d);
    const v = { time: s.querySelector('#rt').value || '16:00', days: days.length ? days : ['MO'] };
    store.set('reminder', v);
    const l = calendarLinks({ ...v, appUrl: appUrl(), appName: APP_NAME });
    s.querySelector('#gcal').href = l.google; s.querySelector('#ocal').href = l.outlook;
  };
  s.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); update(); });
  s.querySelector('#rt').onchange = update;
  s.querySelector('#close').onclick = () => closeModal();
  update();
}

// ---------- Einstellungen ----------
function openSettings() {
  const s = state.settings;
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-k="${key}" data-v="${v}" aria-pressed="${String(s[key]) === String(v)}">${l}</button>`).join('')}</div>`;
  const sheet = openModal(`
    <h2>⚙️ So lernst du am besten</h2>
    <div class="setting"><span>Schriftgröße</span>${seg('fontSize', [['m', 'Normal'], ['l', 'Groß'], ['xl', 'Sehr groß']])}</div>
    <div class="setting"><span>Schriftart</span>${seg('font', [['verdana', 'Klar'], ['system', 'Einfach'], ['comic', 'Handschrift']])}</div>
    <div class="setting"><span>Mehr Abstand zwischen Buchstaben</span>${seg('spacing', [[false, 'Aus'], [true, 'An']])}</div>
    <div class="setting"><span>Silben farbig</span>${seg('syll', [[true, '<span class="syl1">An</span><span class="syl2">ge</span>'], [false, 'Aus']])}</div>
    <div class="setting"><span>Farbfolie (Lesefolie)</span>${seg('tint', [['none', 'Keine'], ['gelb', '🟨 Gelb'], ['blau', '🟦 Blau'], ['gruen', '🟩 Grün'], ['rosa', '🩷 Rosa']])}</div>
    <div class="setting"><span>Alles automatisch vorlesen</span>${seg('autoread', [[false, 'Aus'], [true, 'An']])}</div>
    <div class="setting"><span>Ruhiger Modus (weniger Bewegung)</span>${seg('calm', [[false, 'Aus'], [true, 'An']])}</div>
    <div class="setting"><span>Töne bei richtig/falsch</span>${seg('sound', [[true, '🔔 An'], [false, '🔕 Aus']])}</div>
    <div class="setting"><span>Vorlese-Tempo</span>${seg('voiceSpeed', [['slow', '🐢 Langsam'], ['normal', 'Normal'], ['fast', '🐇 Zügig']])}</div>
    <div class="setting"><span>Stimme</span>
      ${germanVoices().length ? `<select id="voice-sel" class="word-input">${germanVoices().sort((a, b) => voiceScore(b) - voiceScore(a)).map(v => `<option value="${esc(v.name)}" ${voice?.name === v.name ? 'selected' : ''}>${esc(v.name.replace(/Microsoft |Google /, ''))} (${esc(v.lang)})${voiceScore(v) >= 50 ? ' ⭐' : ''}</option>`).join('')}</select>` : '<p class="who-sub">Auf diesem Gerät ist keine deutsche Stimme installiert.</p>'}
      <button class="btn block" id="voice-test" style="margin-top:8px">🔊 Probe hören</button>
      <p class="who-sub">⭐ = besonders natürlich klingend. Tipp: Am iPhone/iPad unter Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen eine „erweiterte“ deutsche Stimme laden – die klingt viel flüssiger.</p></div>
    <div class="sheet-actions"><button class="btn primary block" id="done">Fertig</button></div>`);
  sheet.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
    const k = b.dataset.k; let v = b.dataset.v;
    if (v === 'true') v = true; else if (v === 'false') v = false;
    s[k] = v; applySettings();
    sheet.querySelectorAll(`[data-k="${k}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  });
  sheet.querySelector('#voice-sel')?.addEventListener('change', e => { s.voiceName = e.target.value; applySettings(); pickVoice(); speak('So klinge ich. Viel Spaß beim Lernen!'); });
  sheet.querySelector('#voice-test').onclick = () => speak('Hallo! Ich bin deine Vorlese-Stimme. Wie viele Punkte siehst du? Super gemacht!');
  sheet.querySelector('#done').onclick = () => { closeModal(); if (state.mode) (SCREENS[state.screen] || renderMap)(); };
}

// ---------- Start ----------
(async function init() {
  applySettings();
  const webApp = !!document.querySelector('meta[name="sh-kid-app"]'); // Web-App-Version ohne eigenen Server
  try {
    if (webApp) throw new Error('kein Server');
    state.info = await apiCall('/api/info');
    state.server = state.info.serverMode === true; // ohne eigenen Server (z. B. statisch gehostet) nur freie Version
  } catch { state.server = false; state.info = {}; }
  const fromLink = parseKidHash(location.hash);
  if (fromLink) { offlineLogin(fromLink, fromLink.message, unpackExtra(fromLink.extra ? await decodeExtra(fromLink.extra) : null)); return; }
  const cur = store.get('offline_current', null);
  const ok = cur !== null && offlineKids()[cur];
  if (ok) { offlineLogin(decodeKidCode(ok.code) || ok); return; }
  const code = store.get('code', null);
  if (state.server && code) {
    state.code = code;
    try { setKid(await apiCall('/api/kid/me')); state.mode = 'kid'; renderMap(); return; }
    catch (e) { if (e.status === 401) { store.del('code'); state.code = null; } }
  }
  renderStart();
})();
