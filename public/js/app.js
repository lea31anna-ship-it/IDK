import { APP_NAME, LEVELS, GALAXIES, PLANETS, PLANET_BY_ID, planetsOf, isUnlocked, starsFor, MOODS, TASKS_PER_MISSION, PASS_CORRECT, DEFAULT_UNLOCKED } from './curriculum.js';
import { generateMission, syllablesOf } from './exercises.js';
import { decodeKidCode, parseKidHash, encodeReport, decodeExtra, unpackExtra } from './codec.js';
import { TROPHIES, emptyStats, award, weekDays, dailyMission, calendarLinks, sound, today } from './extras.js';
import { cleanWord, syllablesOfCustom, parseWordInput, wordMission } from './words.js';
import { GAMES, renderGame } from './games.js';
import { pick } from './util.js';

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
  galaxy: store.get('galaxy', 'zahlen'),
  settings: { fontSize: 'm', spacing: false, font: 'verdana', tint: 'none', autoread: false, calm: false, syll: true, sound: true, ...store.get('settings', {}) },
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
let voice = null;
function pickVoice() {
  const vs = window.speechSynthesis?.getVoices() || [];
  voice = vs.find(v => v.lang === 'de-DE' && /Google|Anna|Petra|Helena|Katja/i.test(v.name)) || vs.find(v => v.lang?.startsWith('de')) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text, rate = 0.9) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE'; u.rate = rate; if (voice) u.voice = voice;
  speechSynthesis.speak(u);
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
  if (extra) { k.wordLists = extra.wordLists; k.reward = extra.reward; } // nur aus einem Link der Coachin
  k.inbox ||= [];
  if (message) {
    const mid = String(message.length) + ':' + message.slice(0, 40);
    if (!k.seen.includes(mid) && !k.inbox.some(x => x.id === mid)) k.inbox = [{ id: mid, text: message }];
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

// ---------- Galaxie-Karte ----------
const SPACING = 170;
function planetPos(i) { return { x: 50 + 32 * Math.sin(i * 1.15), y: 90 + i * SPACING }; }

function renderMap(focusId = null) {
  const g = GALAXIES.find(x => x.id === state.galaxy) || GALAXIES[0];
  const list = planetsOf(g.id);
  const totalStars = Object.values(state.progress).reduce((a, p) => a + (p.bestStars || 0), 0);
  const kid = state.mode === 'kid' ? state.kid : null;
  const nextId = list.find(p => open(p.id) && !(state.progress[p.id]?.bestStars >= 1))?.id;
  const height = 90 + (list.length - 1) * SPACING + 120;

  let pathD = '';
  list.forEach((p, i) => { const { x, y } = planetPos(i); pathD += (i ? ' L ' : 'M ') + `${x} ${y}`; });

  const dm = dailyMission(state.progress, open, g.id);
  const doneToday = (getProfile().stats?.days || []).includes(today());
  $app.innerHTML = `
    ${topbar()}
    ${dm ? `<button class="daily" id="daily"><span class="daily-i">🎯</span><span class="daily-t"><b>Tagesmission:</b> ${esc(dm.planet.name)}<small>${doneToday ? '✅ Heute schon geübt – super!' : esc(dm.why)}</small></span><span class="daily-go">Los ➜</span></button>` : ''}
    <nav class="levels" aria-label="Stufe">
      ${LEVELS.map(l => `<button class="level" data-l="${l.id}" aria-pressed="${l.id === g.level}" title="${esc(l.sub)}"><span class="li">${l.icon}</span> ${esc(l.name)}</button>`).join('')}
    </nav>
    <nav class="tabs" role="tablist">
      ${GALAXIES.filter(x => x.level === g.level).map(x => `<button class="tab" role="tab" data-g="${x.id}" aria-selected="${x.id === g.id}">${x.icon} ${esc(x.short)}<small>${esc(x.name)}</small></button>`).join('')}
    </nav>
    <div class="map" id="map" style="height:${height}px">
      <svg class="path" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true"><path d="${pathD}"/></svg>
      ${list.map((p, i) => {
        const { x, y } = planetPos(i);
        const pr = state.progress[p.id];
        const isOpen = open(p.id);
        const stars = pr?.bestStars || 0;
        const flagged = kid && state.unlocked.includes(p.id) && !DEFAULT_UNLOCKED.includes(p.id) && !stars;
        return `<button class="pl ${isOpen ? '' : 'locked'} ${p.id === nextId ? 'next' : ''}" data-id="${p.id}" style="left:${x}%;top:${y}px"
            aria-label="${esc(p.name)}: ${isOpen ? (stars ? stars + ' Sterne' : 'offen') : 'verschlossen'}">
          <span class="orb ${i % 3 === 1 ? 'ring' : ''} ${p.boss ? 'boss' : ''}" style="--h:${p.hue}">${isOpen ? esc(p.label) : '<span class="lock">🔒</span>'}${flagged ? '<span class="flag" title="Von deiner Coachin freigeschaltet">🚩</span>' : ''}</span>
          <span class="pl-name">${esc(p.name)}</span>
          <span class="pl-stars">${isOpen && pr ? [1, 2, 3].map(n => `<span class="${n <= stars ? '' : 'off'}">★</span>`).join('') : ''}</span>
        </button>`;
      }).join('')}
      <div class="rocket" id="rocket" aria-hidden="true">🚀</div>
    </div>
    ${navBar('map')}`;

  bindChrome();
  document.getElementById('daily')?.addEventListener('click', () => {
    if (dm.planet.galaxy !== g.id) { state.galaxy = dm.planet.galaxy; store.set('galaxy', state.galaxy); renderMap(dm.planet.id); }
    else focusPlanet(dm.planet.id);
  });
  $app.querySelectorAll('.tab').forEach(b => b.onclick = () => { state.galaxy = b.dataset.g; store.set('galaxy', state.galaxy); renderMap(); });
  $app.querySelectorAll('.level').forEach(b => b.onclick = () => {
    const same = GALAXIES.filter(x => x.level === b.dataset.l);
    state.galaxy = (same.find(x => x.short === g.short) || same[0]).id; store.set('galaxy', state.galaxy); renderMap();
  });

  // Rakete parken
  const rocketAt = store.get('rocket_' + g.id + (kid ? '_' + kid.code : ''), null);
  const startId = (rocketAt && PLANET_BY_ID[rocketAt] && open(rocketAt)) ? rocketAt : (nextId || list[0].id);
  placeRocket(startId, false);
  const startEl = $app.querySelector(`.pl[data-id="${startId}"]`);
  if (startEl) setTimeout(() => startEl.scrollIntoView({ block: 'center', behavior: state.settings.calm ? 'auto' : 'smooth' }), 50);

  $app.querySelectorAll('.pl').forEach(el => el.onclick = () => {
    const p = PLANET_BY_ID[el.dataset.id];
    if (!open(p.id)) {
      el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle');
      toast(state.mode === 'kid' ? '🔒 Noch verschlossen – schaffe den Planeten davor oder frag deine Coachin!' : '🔒 Noch verschlossen – schaffe erst den Planeten davor!');
      return;
    }
    const moved = placeRocket(p.id, true);
    store.set('rocket_' + g.id + (kid ? '_' + kid.code : ''), p.id);
    setTimeout(() => showPlanetSheet(p), moved && !state.settings.calm ? 950 : 0);
  });

  if (kid && kid.messages?.length) setTimeout(showRadio, 600);
  if (focusId) setTimeout(() => focusPlanet(focusId), 300);
}
function focusPlanet(id) {
  const p = PLANET_BY_ID[id], el = $app.querySelector(`.pl[data-id="${id}"]`);
  if (!p || !el) return;
  el.scrollIntoView({ block: 'center', behavior: state.settings.calm ? 'auto' : 'smooth' });
  const moved = placeRocket(id, true);
  store.set('rocket_' + p.galaxy + (state.mode === 'kid' ? '_' + state.kid.code : ''), id);
  setTimeout(() => showPlanetSheet(p), moved && !state.settings.calm ? 950 : 100);
}
function placeRocket(id, animate) {
  const r = document.getElementById('rocket');
  const p = PLANET_BY_ID[id]; if (!r || !p) return false;
  const { x, y } = planetPos(p.index);
  const oldTop = parseFloat(r.style.top) || 0;
  const target = { left: `calc(${x}% - 48px)`, top: `${y - 52}px` };
  if (r.style.top === target.top) return false;
  r.style.setProperty('--rot', y - 52 < oldTop ? '-45deg' : '135deg');
  if (!animate) r.style.transition = 'none';
  r.style.left = target.left; r.style.top = target.top;
  if (!animate) { void r.offsetWidth; r.style.transition = ''; r.style.setProperty('--rot', '-45deg'); }
  else { r.classList.remove('hop'); void r.offsetWidth; r.classList.add('hop'); setTimeout(() => r.style.setProperty('--rot', '-45deg'), 1000); }
  return true;
}

function showPlanetSheet(p) {
  const pr = state.progress[p.id];
  const sheet = openModal(`
    <div style="text-align:center">
      <span class="orb ${p.boss ? 'boss' : ''}" style="--h:${p.hue}">${esc(p.label)}</span>
      <h2>${esc(p.name)}</h2>
      <p style="margin:.2em 0;color:var(--muted)">${esc(p.topic)}</p>
      ${pr ? `<p class="pl-stars" style="font-size:1.6em">${[1, 2, 3].map(n => `<span class="${n <= pr.bestStars ? '' : 'off'}">★</span>`).join('')}</p>` : `<p>Hier warst du noch nie – auf geht's!</p>`}
      <p class="who-sub">${TASKS_PER_MISSION} Aufgaben · ab ${PASS_CORRECT} richtigen ist der nächste Planet offen · kein Zeitdruck</p>
    </div>
    <div class="sheet-actions">
      <button class="btn primary block" id="start-mission">🚀 Mission starten</button>
      <button class="btn block" id="say-topic">🔊 Vorlesen</button>
      <button class="btn block" id="close">Zurück</button>
    </div>`);
  sheet.querySelector('#start-mission').onclick = () => { closeModal(); moodBefore(p); };
  sheet.querySelector('#say-topic').onclick = () => speak(`${p.name}. ${p.topic}.`);
  sheet.querySelector('#close').onclick = () => closeModal();
  if (state.settings.autoread) speak(`${p.name}. ${p.topic}.`);
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
  const tasks = p.tasks || generateMission(p.id);
  const m = { p, tasks, i: 0, correct: 0, errors: [], tips: 0, started: Date.now(), moodB, active: true };
  runMission.current = m;
  const isMath = p.galaxy === 'zahlen';

  const renderTask = () => {
    const t = tasks[m.i];
    const pct = (m.i / tasks.length) * 100;
    $app.innerHTML = `
      <div class="mission-top">
        <button class="icon-btn" id="quit" aria-label="Mission abbrechen">✕</button>
        <div class="fuel" aria-hidden="true"><div class="fuel-fill" style="width:${pct}%"></div><span class="fuel-rocket" style="left:${pct}%">🚀</span></div>
        <span class="fuel-count">${m.i + 1}/${tasks.length}</span>
      </div>
      <section class="panel task">
        <button class="hint-bulb" id="tip" aria-label="Hinweis vom Astronauten" title="Ich weiß nicht weiter">💡</button>
        <div class="prompt-row">
          <p class="prompt ${isMath && ['big', 'house'].includes(t.visual.type) ? 'math' : ''}">${esc(t.prompt)}</p>
          <button class="icon-btn" id="say" aria-label="Vorlesen">🔊</button>
        </div>
        <div class="visual">${renderVisual(t.visual, p.id)}</div>
        <div class="options ${t.options.some(o => !o.display && o.label.length > 14) ? 'long' : ''} ${t.options.length === 2 ? 'two' : ''}">${t.options.map((o, k) => `<button class="opt ${o.big ? 'big' : ''}" data-k="${k}">${o.emoji ? `<span class="opt-emoji">${o.emoji}</span>` : ''}<span>${o.display ? esc(o.display) : (p.id === 'lesen' || p.id === 'silben' || p.id === 'bdpq' || p.id === 'schreiben' || p.activity ? esc(o.label) : wordHtml(o.label))}</span></button>`).join('')}</div>
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
      if (h.saysyll) speak(h.text + ' ' + h.saysyll.join(' … '), .75);
      else if (h.sayslow) speak(`${h.text} Hör genau: ${h.sayslow.split('').join(' ')} … ${h.sayslow}`, .75);
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
    const next = () => { if (!m.active || runMission.current !== m) return; m.i++; if (m.i < tasks.length) renderTask(); else finish(); };
    document.getElementById('next').onclick = next;

    $app.querySelectorAll('.opt').forEach(btn => btn.onclick = () => {
      const o = t.options[Number(btn.dataset.k)];
      $app.querySelectorAll('.opt').forEach(b => b.disabled = true);
      clearTimeout(runMission.nudge);
      document.getElementById('tip').disabled = true;
      const fb = document.getElementById('fb');
      const right = t.options.findIndex(x => x.correct);
      if (o.correct) {
        m.correct++; btn.classList.add('right');
        const msg = PRAISE[Math.floor(Math.random() * PRAISE.length)];
        fb.className = 'feedback good'; fb.textContent = '⭐ ' + msg;
        if (state.settings.sound) sound('right'); else speak(msg, 1);
        $app.querySelectorAll('.opt').forEach((b, k) => { if (k !== right) b.classList.add('fade'); });
        setTimeout(next, state.settings.calm ? 1400 : 1100);
      } else {
        btn.classList.add('wrong');
        $app.querySelectorAll('.opt')[right].classList.add('right');
        m.errors.push({ task: t.label, given: o.label, expected: t.options[right].label, type: o.type || 'sonstiges' });
        if (state.settings.sound) sound('wrong');
        const msg = COMFORT[Math.floor(Math.random() * COMFORT.length)];
        fb.className = 'feedback soft'; fb.textContent = '🌱 ' + msg;
        showHint(t.options[right].display || t.options[right].label);
        const nb = document.getElementById('next'); nb.classList.remove('hidden'); nb.focus();
      }
    });
    if (t.visual.type === 'listen') setTimeout(() => speak(t.visual.say, .8), 250);
    else if (state.settings.autoread) sayAll();
  };
  renderTask();

  const finish = async () => {
    m.active = false;
    const isAct = !!p.activity;
    const wasFailed = !isAct && (state.progress[p.id]?.attempts || 0) > 0 && !((state.progress[p.id]?.bestStars || 0) >= 1);
    const before = new Set(PLANETS.filter(x => open(x.id)).map(x => x.id));
    const stars = starsFor(m.correct, tasks.length);
    const durationSec = Math.round((Date.now() - m.started) / 1000);
    const prof = getProfile();
    const payload = { planetId: p.id, correct: m.correct, total: tasks.length, errors: m.errors, tips: m.tips, moodBefore: m.moodB, durationSec, trophies: prof.trophies, stats: prof.stats };
    if (state.mode === 'kid' && state.offline) {
      if (!isAct) localResult(p.id, m.correct, tasks.length, stars);
      const ts = new Date().toISOString();
      offlineRecord(k => {
        k.sessions.push({ ts, planetId: p.id, correct: m.correct, total: tasks.length, stars, moodBefore: m.moodB, moodAfter: null, tips: m.tips, durationSec });
        for (const e of m.errors) k.errors.push({ ts, planetId: p.id, ...e });
      });
    } else if (state.mode === 'kid') {
      try { setKid(await apiCall('/api/kid/result', { method: 'POST', body: payload })); }
      catch { toast('📡 Verbindung zur Basis gestört – Ergebnis nur auf diesem Gerät.'); localResult(p.id, m.correct, tasks.length, stars); }
    } else if (!isAct) {
      localResult(p.id, m.correct, tasks.length, stars);
      store.set('public_progress', state.progress);
    }
    const newly = PLANETS.filter(x => open(x.id) && !before.has(x.id));
    renderResult(p, m.correct, tasks.length, stars, newly);
    if (state.settings.sound && stars >= 1) sound('win');
    earn(isAct ? { words: 1, tipsUsed: m.tips } : { missions: 1, perfect: m.correct === tasks.length ? 1 : 0, tipsUsed: m.tips, brave: m.moodB && m.moodB <= 2 ? 1 : 0, comebacks: wasFailed && stars >= 1 ? 1 : 0 });
  };
}
function localResult(id, correct, total, stars) {
  const pr = state.progress[id] ||= { bestStars: 0, attempts: 0, correct: 0, total: 0 };
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
    case 'gapword':
      return `<div><div class="gap-word">${esc(v.before)}<span class="gap">?</span>${esc(v.after)}</div><button class="listen-btn small" data-say="${esc(v.say)}" aria-label="Wort anhören"><span class="lb-i">🔊</span><span>Anhören</span></button></div>`;
    case 'fracbar':
      return `<div class="fracbar" role="img" aria-label="${v.k} von ${v.n} Teilen gefärbt">${Array.from({ length: v.n }, (_, i) => `<span class="${i < v.k ? 'on' : ''}"></span>`).join('')}</div>`;
    default: return '';
  }
}

function renderResult(p, correct, total, stars, newly) {
  const passed = stars >= 1;
  const title = stars === 3 ? 'Perfekt! Alle richtig!' : passed ? (p.activity ? 'Super geübt!' : 'Mission geschafft!') : 'Gut geübt!';
  $app.innerHTML = `
    <section class="panel result">
      <div class="result-stars" aria-label="${stars} von 3 Sternen">${[1, 2, 3].map(n => `<span class="${n <= stars ? '' : 'off'}">⭐</span>`).join('')}</div>
      <h2>${title}</h2>
      <p>Du hast <strong>${correct} von ${total}</strong> Aufgaben richtig gelöst.</p>
      ${!passed && !p.activity ? `<p class="who-sub">Für den nächsten Planeten brauchst du ${PASS_CORRECT} richtige. Jeder Versuch macht dich stärker – probier es gleich nochmal! 💪</p>` : ''}
      ${newly.map(x => `<div class="new-planet">🎉 Neuer Planet entdeckt: <strong>${esc(x.name)}</strong></div>`).join('')}
      <h3 style="margin-bottom:0">Wie fühlst du dich jetzt?</h3>
      ${moodPicker('ma')}
      <div class="sheet-actions">
        <button class="btn primary block" id="back">${p.activity ? '📚 Zurück zu den Lernwörtern' : '🪐 Zurück zur Galaxie'}</button>
        <button class="btn block" id="again">🔁 Nochmal spielen</button>
        ${state.mode === 'kid' && state.offline ? '<button class="btn block" id="send-rep">📤 Bericht an meine Coachin</button>' : ''}
      </div>
      ${state.mode === 'public' && state.info?.contactUrl && !passed ? `<p class="who-sub" style="margin-top:1.4em">Für Eltern: Wenn Rechnen oder Lesen oft schwerfällt, hilft persönliche Begleitung. <a href="${esc(state.info.contactUrl)}" target="_blank" rel="noopener">${esc(state.info.practiceName || 'Beratung')} →</a></p>` : ''}
    </section>`;
  if (passed) confetti(stars * 12);
  speak(`${title} Du hast ${correct} von ${total} richtig.`);
  let moodSent = false;
  $app.querySelectorAll('#ma .mood').forEach(b => b.onclick = () => {
    $app.querySelectorAll('#ma .mood').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    if (state.mode === 'kid' && state.offline) offlineRecord(k => { const last = k.sessions.at(-1); if (last && last.planetId === p.id) last.moodAfter = Number(b.dataset.v); });
    else if (state.mode === 'kid' && !moodSent) { moodSent = true; apiCall('/api/kid/mood', { method: 'POST', body: { planetId: p.id, moodAfter: Number(b.dataset.v) } }).catch(() => { }); }
    toast('Danke, dass du es mir sagst! 💛');
  });
  document.getElementById('back').onclick = () => {
    if (p.back) { p.back(); return; }
    if (newly[0]) { store.set('rocket_' + p.galaxy + (state.kid && state.mode === 'kid' ? '_' + state.kid.code : ''), p.id); }
    renderMap();
    if (newly[0] && newly[0].galaxy === p.galaxy) setTimeout(() => { placeRocket(newly[0].id, true); store.set('rocket_' + p.galaxy + (state.mode === 'kid' ? '_' + state.kid.code : ''), newly[0].id); $app.querySelector(`.pl[data-id="${newly[0].id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 700);
  };
  document.getElementById('again').onclick = () => (p.activity ? runMission({ ...p, tasks: p.regen() }, null) : moodBefore(p));
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
  if (state.mode === 'kid' && state.offline) { const k = offlineKids()[state.kid.id] || {}; return { stats: k.stats, trophies: k.trophies, ownWords: k.ownWords }; }
  return store.get(profileKey(), {});
}
function saveProfile(p) {
  if (state.mode === 'kid' && state.offline) offlineRecord(k => { k.stats = p.stats; k.trophies = p.trophies; k.ownWords = p.ownWords; });
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
function topbar() {
  const kid = state.mode === 'kid' ? state.kid : null;
  const totalStars = Object.values(state.progress).reduce((a, p) => a + (p.bestStars || 0), 0);
  const trophies = Object.keys(getProfile().trophies || {}).length;
  return `<header class="topbar">
      <button class="icon-btn" id="home" aria-label="Zum Start">🏠</button>
      <div class="who">
        <div class="avatar" aria-hidden="true">${kid ? esc(kid.avatar) : '🧑‍🚀'}</div>
        <div style="min-width:0">
          <div class="who-name">${kid ? esc(kid.name) : 'Weltraum-Entdecker'}</div>
          <div class="who-sub">${kid ? (kid.coachName ? 'Mission mit ' + esc(kid.coachName) : 'Coach-Mission') : 'Freie Version'}</div>
        </div>
      </div>
      <span class="star-count" aria-label="${totalStars} Sterne, ${trophies} Pokale">⭐ ${totalStars}${trophies ? ` · 🏆 ${trophies}` : ''}</span>
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
    sheet.querySelector('#readall').onclick = () => speak(l.words.map(cleanWord).join(' … '), .7);
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
function renderGames(opts = {}) {
  let level = store.get('game_level', (GALAXIES.find(x => x.id === state.galaxy) || GALAXIES[0]).level);
  const draw = () => {
    $app.innerHTML = `${topbar()}
      <section class="screen">
        <h2 class="screen-title">🧩 Spiele-Ecke</h2>
        <p class="who-sub" style="margin-top:-6px">Knobeln, Rätseln, Spaß haben – und dabei ganz nebenbei lernen.</p>
        <nav class="levels" aria-label="Schwierigkeit">${LEVELS.map(l => `<button class="level" data-l="${l.id}" aria-pressed="${l.id === level}"><span class="li">${l.icon}</span> ${esc(l.name)}</button>`).join('')}</nav>
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

// ---------- Mehr ----------
const appUrl = () => document.querySelector('meta[name="sh-kid-app"]')?.content || location.origin + location.pathname;
function renderMore() {
  const goal = store.get('week_goal', 3);
  $app.innerHTML = `${topbar()}
    <section class="screen">
      <h2 class="screen-title">☰ Mehr</h2>
      <div class="panel more-list">
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
    <div class="sheet-actions"><button class="btn primary block" id="done">Fertig</button></div>`);
  sheet.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
    const k = b.dataset.k; let v = b.dataset.v;
    if (v === 'true') v = true; else if (v === 'false') v = false;
    s[k] = v; applySettings();
    sheet.querySelectorAll(`[data-k="${k}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  });
  sheet.querySelector('#done').onclick = () => { closeModal(); if (state.mode) (SCREENS[state.screen] || renderMap)(); };
}

// ---------- Start ----------
(async function init() {
  applySettings();
  try {
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
