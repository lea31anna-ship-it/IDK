import { GALAXIES, PLANETS, PLANET_BY_ID, planetsOf, ERROR_TYPES, MOODS, isUnlocked } from './curriculum.js';

import { APP_NAME } from './curriculum.js';
import { TROPHIES, weekDays, activityName } from './extras.js';
import { parseWordInput } from './words.js';
let root = null, host = null, toastEl = null; // werden in start() gesetzt
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { } } };
const S = { token: ls.get('sh_coach_token'), kids: [], settings: {}, view: 'overview', kid: null, tab: 'overview', range: 30, lite: null };
// lite = serverlose Variante (Web-App ohne eigenen Server): { call(path, opts), kidLink(kid, msg), kidAppUrl }
const AVATARS = ['🧑‍🚀', '👩‍🚀', '👨‍🚀', '🦊', '🐼', '🦄', '🐯', '🐸', '🐙', '🦖', '🐱', '🐶', '🦁', '🐧', '🦋', '🤖', '👽', '🌟'];
const moodE = v => MOODS.find(m => m.v === v)?.e || '–';
const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '–';
const fmtDateTime = ts => ts ? new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '–';
const daysAgo = ts => ts ? Math.floor((Date.now() - Date.parse(ts)) / 86400000) : Infinity;
const starsHtml = n => [1, 2, 3].map(i => `<span class="${i <= n ? '' : 'off'}">★</span>`).join('');
const pName = id => activityName(id);

function toast(m) { const t = toastEl; t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); }
async function api(path, opts = {}) {
  if (S.lite) return S.lite.call(path, opts);
  const { method = 'GET', body } = opts;
  const r = await fetch(path, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (S.token || '') }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && !path.includes('/login')) { S.token = null; ls.set('sh_coach_token', null); renderLogin(); throw new Error(d.error || 'Bitte anmelden'); }
  if (!r.ok) throw new Error(d.error || 'Fehler');
  return d;
}

// Eigene Bestätigungsdialoge (window.confirm/prompt sind nicht überall verfügbar)
function ask(text, { okLabel = 'OK', danger = false, typeToConfirm = null } = {}) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.innerHTML = `<form method="dialog"><p style="margin-top:0">${esc(text)}</p>
      ${typeToConfirm ? `<div class="field"><input id="ask-in" type="text" autocomplete="off" aria-label="Bestätigung"></div>` : ''}
      <div class="row"><button class="btn ${danger ? 'danger' : 'primary'}" value="ok">${esc(okLabel)}</button><button class="btn" value="cancel" formnovalidate>Abbrechen</button></div></form>`;
    host.appendChild(d); d.showModal();
    d.addEventListener('close', () => { const ok = d.returnValue === 'ok' && (!typeToConfirm || d.querySelector('#ask-in').value.trim() === typeToConfirm); d.remove(); resolve(ok); });
  });
}
function showCopy(title, text, hint = '') {
  const d = document.createElement('dialog');
  d.innerHTML = `<form method="dialog"><h2 style="margin-top:0">${esc(title)}</h2>${hint ? `<p class="muted">${esc(hint)}</p>` : ''}
    <textarea id="cp" readonly style="min-height:110px"></textarea>
    <div class="row" style="margin-top:10px"><button class="btn primary" type="button" id="cpb">📋 Kopieren</button><button class="btn" value="close">Schließen</button></div></form>`;
  host.appendChild(d); d.showModal();
  const ta = d.querySelector('#cp'); ta.value = text;
  d.querySelector('#cpb').onclick = () => copyText(text, ta);
  d.addEventListener('close', () => d.remove());
}
function copyText(text, fallbackEl) {
  try { navigator.clipboard.writeText(text).then(() => toast('Kopiert'), () => { fallbackEl?.select(); toast('Bitte markierten Text kopieren'); }); }
  catch { fallbackEl?.select(); toast('Bitte markierten Text kopieren'); }
}

// ---------- Login / Einrichtung ----------
async function renderLogin() {
  let status = { setup: true };
  try { status = await (await fetch('/api/coach/status')).json(); } catch { }
  const setup = !status.setup;
  root.innerHTML = `
    <div class="login">
      <div class="card">
        <div class="brand" style="margin-bottom:8px">🪐 ${APP_NAME} <small>Coach-Bereich</small></div>
        <h1 style="font-size:1.3em">${setup ? 'Willkommen! Lege dein Passwort fest' : 'Anmelden'}</h1>
        ${setup ? '<p class="muted">Dieses Passwort schützt alle Daten deiner Kinder. Mindestens 8 Zeichen – am besten ein langer Satz.</p>' : ''}
        <form id="f">
          <div class="field"><label for="pw">Passwort</label><input id="pw" type="password" autocomplete="${setup ? 'new-password' : 'current-password'}" required></div>
          ${setup ? '<div class="field"><label for="pw2">Passwort wiederholen</label><input id="pw2" type="password" autocomplete="new-password" required></div>' : ''}
          <p class="err" id="err"></p>
          <button class="btn primary" type="submit">${setup ? 'Einrichten' : 'Anmelden'}</button>
        </form>
      </div>
      <p class="muted" style="text-align:center;margin-top:14px"><a href="/">← Zur Kinder-App</a></p>
    </div>`;
  document.getElementById('pw').focus();
  document.getElementById('f').onsubmit = async e => {
    e.preventDefault();
    const pw = document.getElementById('pw').value, err = document.getElementById('err');
    if (setup && pw !== document.getElementById('pw2').value) { err.textContent = 'Die Passwörter stimmen nicht überein.'; return; }
    try {
      const d = await api(setup ? '/api/coach/setup' : '/api/coach/login', { method: 'POST', body: { password: pw } });
      S.token = d.token; ls.set('sh_coach_token', d.token); boot();
    } catch (x) { err.textContent = x.message; }
  };
}

async function boot() {
  try {
    const [ov, st] = await Promise.all([api('/api/coach/overview'), api('/api/coach/settings')]);
    S.kids = ov.kids; S.settings = st;
    render();
  } catch { /* renderLogin bereits ausgelöst */ }
}
async function refreshKids() { S.kids = (await api('/api/coach/overview')).kids; }

// ---------- Grundlayout ----------
function render() {
  const sorted = [...S.kids].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  root.innerHTML = `
    <div class="layout">
      <aside class="side collapsed" id="side">
        <div class="row" style="justify-content:space-between">
          <div class="brand">🪐 <span>${APP_NAME}<small>Coach-Bereich${S.settings.coachName ? ' · ' + esc(S.settings.coachName) : ''}</small></span></div>
          <button class="btn small mobile-bar" id="menu">☰ Menü</button>
        </div>
        ${S.lite?.onExit ? '<button class="btn small exit-btn" id="exit">← Zur Lern-App</button>' : ''}
        <div class="collapsible">
          <nav class="nav">
            <button data-v="overview" class="${S.view === 'overview' ? 'active' : ''}">📊 Übersicht</button>
            <button data-v="settings" class="${S.view === 'settings' ? 'active' : ''}">⚙️ Einstellungen</button>
          </nav>
          <div class="row" style="justify-content:space-between"><span class="side-section">Kinder (${S.kids.length})</span><button class="btn small primary" id="add">+ Kind</button></div>
          <input type="text" id="search" placeholder="Suchen …" aria-label="Kind suchen">
          <div class="kid-list" id="kid-list">
            ${sorted.map(k => `<button class="kid-item ${S.view === 'kid' && S.kid?.id === k.id ? 'active' : ''}" data-id="${k.id}" data-name="${esc(k.name.toLowerCase())}">
              <span class="av">${esc(k.avatar)}</span>
              <span><strong>${esc(k.name)}</strong><div class="meta">${k.lastActive ? 'aktiv ' + relDays(k.lastActive) : 'noch nicht gespielt'}</div></span>
              <span class="stars" title="Sterne">★${k.stars}</span></button>`).join('') || '<p class="muted">Noch keine Kinder angelegt.</p>'}
          </div>
          <div style="margin-top:auto" class="row"><a class="btn small" href="${S.lite ? esc(S.lite.kidAppUrl) : '/'}" target="_blank" rel="noopener">Kinder-App ↗</a>${S.lite ? '' : '<button class="btn small" id="logout">Abmelden</button>'}</div>
        </div>
      </aside>
      <main id="main"></main>
    </div>`;
  root.querySelector('#exit')?.addEventListener('click', () => S.lite.onExit());
  root.querySelectorAll('.nav button').forEach(b => b.onclick = () => { S.view = b.dataset.v; render(); });
  root.querySelectorAll('.kid-item').forEach(b => b.onclick = () => openKid(b.dataset.id));
  document.getElementById('add').onclick = newKidDialog;
  document.getElementById('menu').onclick = () => document.getElementById('side').classList.toggle('collapsed');
  if (!S.lite) document.getElementById('logout').onclick = async () => { try { await api('/api/coach/logout', { method: 'POST' }); } catch { } S.token = null; ls.set('sh_coach_token', null); renderLogin(); };
  document.getElementById('search').oninput = e => { const q = e.target.value.toLowerCase(); root.querySelectorAll('.kid-item').forEach(b => b.classList.toggle('hidden', !b.dataset.name.includes(q))); };
  const main = document.getElementById('main');
  if (S.view === 'overview') renderOverview(main);
  else if (S.view === 'settings') renderSettings(main);
  else if (S.view === 'kid' && S.kid) renderKid(main);
}
const relDays = ts => { const d = daysAgo(ts); return d === 0 ? 'heute' : d === 1 ? 'gestern' : `vor ${d} Tagen`; };

// ---------- Übersicht & Frühwarnsystem ----------
function alertsFor(k) {
  const out = [];
  const s = k.recentSessions || [];
  if (!k.lastActive) out.push({ lvl: 'warn', ic: '🛰️', txt: `<strong>${esc(k.name)}</strong> hat den Code noch nicht benutzt.` });
  else if (daysAgo(k.lastActive) >= 10) out.push({ lvl: 'warn', ic: '😴', txt: `<strong>${esc(k.name)}</strong> war seit ${daysAgo(k.lastActive)} Tagen nicht mehr im All.` });
  const lastMoods = s.filter(x => x.moodAfter).slice(-3);
  const bad = lastMoods.find(x => x.moodAfter === 1 || (x.moodBefore && x.moodBefore - x.moodAfter >= 2));
  if (bad) out.push({ lvl: 'bad', ic: '💛', txt: `<strong>${esc(k.name)}</strong> fühlte sich nach „${esc(pName(bad.planetId))}“ ${moodE(bad.moodAfter)} – evtl. in der nächsten Stunde ansprechen.`, tab: 'mood' });
  const fails = {};
  for (const x of s) if (x.stars === 0) fails[x.planetId] = (fails[x.planetId] || 0) + 1;
  for (const [pid, n] of Object.entries(fails)) if (n >= 3) out.push({ lvl: 'warn', ic: '🧗', txt: `<strong>${esc(k.name)}</strong> hängt am ${esc(pName(pid))} fest (${n} Versuche ohne Erfolg).`, tab: 'errors' });
  const wins = s.filter(x => x.stars === 3 && daysAgo(x.ts) <= 7);
  if (wins.length) out.push({ lvl: 'good', ic: '🏆', txt: `<strong>${esc(k.name)}</strong> hat ${esc(pName(wins.at(-1).planetId))} mit 3 Sternen geschafft – Zeit für einen Funkspruch!`, tab: 'radio' });
  return out.map(a => ({ ...a, kid: k.id }));
}

function renderOverview(main) {
  const week = S.kids.flatMap(k => (k.recentSessions || []).filter(s => daysAgo(s.ts) < 7));
  const activeKids = S.kids.filter(k => daysAgo(k.lastActive) < 7).length;
  const moods = week.filter(s => s.moodAfter).map(s => s.moodAfter);
  const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
  const alerts = S.kids.flatMap(alertsFor).sort((a, b) => ({ bad: 0, warn: 1, good: 2 }[a.lvl] - { bad: 0, warn: 1, good: 2 }[b.lvl]));
  main.innerHTML = `
    <div class="page-head"><h1>Hallo${S.settings.coachName ? ' ' + esc(S.settings.coachName) : ''} 👋</h1><div class="row">${S.lite ? '<button class="btn" id="imp">📥 Bericht einfügen</button>' : ''}<button class="btn primary" id="add2">+ Kind anlegen</button></div></div>
    <div class="stats">
      <div class="stat"><div class="v">${S.kids.length}</div><div class="l">Kinder mit Code</div></div>
      <div class="stat"><div class="v">${activeKids}</div><div class="l">aktiv in den letzten 7 Tagen</div></div>
      <div class="stat"><div class="v">${week.length}</div><div class="l">Missionen in 7 Tagen</div></div>
      <div class="stat"><div class="v">${avgMood ? moodE(Math.round(avgMood)) + ' ' + avgMood.toFixed(1) : '–'}</div><div class="l">Ø Stimmung nach Missionen (1–4)</div></div>
    </div>
    <div class="grid2">
      <div class="card"><h2>🔔 Frühwarnsystem</h2>
        ${alerts.length ? alerts.slice(0, 12).map((a, i) => `<button class="alert ${a.lvl}" data-i="${i}"><span class="ic">${a.ic}</span><span>${a.txt}</span></button>`).join('') : '<p class="muted">Alles ruhig im All. Hier erscheinen Hinweise, wenn ein Kind festhängt, sich unwohl fühlt, lange nicht geübt hat – oder ein Lob verdient.</p>'}
      </div>
      <div class="card usp"><h2>✨ Dein Mehrwert gegenüber anderen Lern-Apps</h2>
        <ul style="margin:0;padding-left:1.2em">
          <li><strong>Fehler-Radar:</strong> Jede falsche Antwort ist einem typischen Fehlermuster zugeordnet (z. B. Zählfehler, Zahlendreher, b/d-Verwechslung) – mit Förderhinweis.</li>
          <li><strong>Gefühls-Kompass:</strong> Kinder geben vor und nach jeder Mission ihre Stimmung an. So siehst du Rechen- und Leseangst, nicht nur Ergebnisse.</li>
          <li><strong>Funksprüche:</strong> Persönliche Nachrichten von dir, die das Kind beim nächsten Start vorgelesen bekommt.</li>
          <li><strong>Gezielt freischalten:</strong> Nur die Themen, die ihr gerade gemeinsam erarbeitet.</li>
          <li><strong>Elternbericht</strong> per Klick – druckbar oder als PDF.</li>
        </ul>
      </div>
    </div>
    <div class="card"><h2>Alle Kinder</h2>
      ${S.kids.length ? `<table class="resp"><thead><tr><th>Kind</th><th>Code</th><th>Zuletzt aktiv</th><th>Planeten</th><th>Sterne</th><th>Trefferquote*</th><th>Stimmung*</th></tr></thead><tbody>
      ${[...S.kids].sort((a, b) => (b.lastActive || '').localeCompare(a.lastActive || '')).map(k => `<tr class="click" data-id="${k.id}">
        <td>${esc(k.avatar)} <strong>${esc(k.name)}</strong></td><td><span class="code" style="font-size:.85em">${esc(k.code)}</span></td>
        <td>${k.lastActive ? relDays(k.lastActive) : '<span class="muted">nie</span>'}</td><td>${k.planetsDone}</td><td class="stars">★ ${k.stars}</td>
        <td>${k.accuracy === null ? '–' : `<span class="tag ${k.accuracy >= 80 ? 'good' : k.accuracy >= 60 ? 'warn' : 'bad'}">${k.accuracy} %</span>`}</td>
        <td>${k.mood ? moodE(Math.round(k.mood)) + ' ' + k.mood : '–'}</td></tr>`).join('')}
      </tbody></table><p class="muted" style="font-size:.82em">* bezogen auf die letzten 10 Missionen</p>` : '<p>Lege dein erstes Kind an – es bekommt automatisch einen Zugangscode für die App.</p>'}
    </div>`;
  document.getElementById('add2').onclick = newKidDialog;
  document.getElementById('imp')?.addEventListener('click', importDialog);
  main.querySelectorAll('tr.click').forEach(r => r.onclick = () => openKid(r.dataset.id));
  main.querySelectorAll('.alert').forEach(b => b.onclick = () => { const a = alerts[Number(b.dataset.i)]; openKid(a.kid, a.tab || 'overview'); });
}

// ---------- Kind anlegen ----------
function newKidDialog() {
  const d = document.createElement('dialog');
  let av = AVATARS[0];
  d.innerHTML = `<form method="dialog" id="nk">
    <h2 style="margin-top:0">Neues Kind</h2>
    <div class="field"><label for="nk-name">Vorname (oder Spitzname)</label><input id="nk-name" type="text" maxlength="40" required></div>
    <p class="muted" style="font-size:.85em;margin-top:-4px">Datenschutz-Tipp: Nur Vorname oder Spitzname – kein Nachname, kein Geburtsdatum.</p>
    <div class="field"><label>Avatar</label><div class="emoji-pick">${AVATARS.map((a, i) => `<button type="button" data-a="${a}" class="${i ? '' : 'sel'}">${a}</button>`).join('')}</div></div>
    <p class="err" id="nk-err"></p>
    <div class="row"><button class="btn primary" value="ok">Anlegen & Code erzeugen</button><button class="btn" value="cancel" formnovalidate>Abbrechen</button></div></form>`;
  host.appendChild(d); d.showModal();
  d.querySelectorAll('.emoji-pick button').forEach(b => b.onclick = () => { av = b.dataset.a; d.querySelectorAll('.emoji-pick button').forEach(x => x.classList.toggle('sel', x === b)); });
  d.querySelector('form').onsubmit = async e => {
    if (e.submitter?.value === 'cancel') return;
    e.preventDefault();
    try {
      const k = await api('/api/coach/kids', { method: 'POST', body: { name: d.querySelector('#nk-name').value, avatar: av } });
      d.close(); await refreshKids(); await openKid(k.id, 'unlock');
      if (S.lite) toast('Wähle die Planeten aus und speichere – dann bekommst du den Link für die Eltern.');
      else toast(`Code für ${k.name}: ${k.code}`);
    } catch (x) { d.querySelector('#nk-err').textContent = x.message; }
  };
  d.addEventListener('close', () => d.remove());
}

// ---------- Kind-Detail ----------
async function openKid(id, tab = 'overview') {
  S.kid = await api('/api/coach/kids/' + id); S.view = 'kid'; S.tab = tab; render(); scrollTo(0, 0);
}
async function patchKid(body) { S.kid = await api('/api/coach/kids/' + S.kid.id, { method: 'PATCH', body }); await refreshKids(); }

const TABS = [['overview', '📈 Überblick'], ['unlock', '🔓 Freischalten'], ['errors', '🎯 Fehler-Radar'], ['mood', '💛 Gefühls-Kompass'], ['words', '📚 Lernwörter'], ['radio', '📡 Funkspruch'], ['notes', '📝 Notizen'], ['report', '📄 Elternbericht']];
function renderKid(main) {
  const k = S.kid;
  main.innerHTML = `
    <div class="page-head">
      <h1>${esc(k.avatar)} ${esc(k.name)}</h1>
      <div class="row">
        <span>Code: <span class="code">${esc(k.code)}</span></span>
        ${S.lite ? '<button class="btn small primary" id="link">🔗 Link für Eltern</button><button class="btn small" id="imp">📥 Bericht einfügen</button>' : '<button class="btn small" id="copy">Kopieren</button><button class="btn small" id="card">🖨 Zugangskarte</button>'}
        <button class="btn small" id="edit">Bearbeiten</button>
      </div>
    </div>
    <div class="tabs" role="tablist">${TABS.map(([v, l]) => `<button role="tab" data-t="${v}" class="${S.tab === v ? 'active' : ''}">${l}</button>`).join('')}</div>
    <div id="tab"></div>`;
  main.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { S.tab = b.dataset.t; renderKid(main); });
  if (S.lite) {
    document.getElementById('link').onclick = () => shareLink(k);
    document.getElementById('imp').onclick = importDialog;
  } else {
    document.getElementById('copy').onclick = () => copyText(k.code);
    document.getElementById('card').onclick = () => printCard(k);
  }
  document.getElementById('edit').onclick = editKidDialog;
  const t = document.getElementById('tab');
  ({ overview: tabOverview, unlock: tabUnlock, errors: tabErrors, mood: tabMood, radio: tabRadio, words: tabWords, notes: tabNotes, report: tabReport })[S.tab](t, k);
}

function tabOverview(el, k) {
  const sess = k.sessions;
  const recent = sess.slice(-10);
  const acc = recent.length ? Math.round(100 * recent.reduce((a, s) => a + s.correct, 0) / recent.reduce((a, s) => a + s.total, 0)) : null;
  const minutes = Math.round(sess.reduce((a, s) => a + (s.durationSec || 0), 0) / 60);
  const stars = Object.values(k.progress).reduce((a, p) => a + p.bestStars, 0);
  const done = Object.values(k.progress).filter(p => p.bestStars >= 1).length;
  el.innerHTML = `
    <div class="stats">
      <div class="stat"><div class="v">★ ${stars}</div><div class="l">Sterne gesammelt</div></div>
      <div class="stat"><div class="v">${done} / ${PLANETS.length}</div><div class="l">Planeten geschafft</div></div>
      <div class="stat"><div class="v">${sess.length}</div><div class="l">Missionen gesamt</div></div>
      <div class="stat"><div class="v">${acc === null ? '–' : acc + ' %'}</div><div class="l">Trefferquote (letzte 10)</div></div>
      <div class="stat"><div class="v">${minutes} min</div><div class="l">Übungszeit gesamt</div></div>
    </div>
    ${(() => {
      const tr = k.trophies || {}, st = k.stats || {}, wd = weekDays(st.days || []);
      return `<div class="grid2"><div class="card"><h2>🏆 Pokale (${Object.keys(tr).length}/${TROPHIES.length})</h2>
        <div class="trophy-row">${TROPHIES.map(t => `<span class="tr ${tr[t.id] ? 'got' : ''}" title="${esc(t.name)}: ${esc(t.desc)}${tr[t.id] ? ' – ' + esc(tr[t.id]) : ''}">${tr[t.id] ? t.icon : '·'}</span>`).join('')}</div>
        ${k.reward?.text ? `<p class="muted" style="margin-bottom:0">🎁 Ziel: ${k.reward.goal} Pokale → ${esc(k.reward.text)}</p>` : ''}</div>
        <div class="card"><h2>📅 Lern-Tage diese Woche</h2><div class="trophy-row">${wd.map(d => `<span class="tr day ${d.done ? 'got' : ''}" title="${d.iso}">${d.done ? '⭐' : ''}<small>${d.name}</small></span>`).join('')}</div>
        <p class="muted" style="margin-bottom:0">Gelöste Rätsel: ${st.games || 0} · Lernwörter geübt: ${st.words || 0}×${S.lite ? ' · Stand: letzter Bericht' : ''}</p></div></div>`;
    })()}
    <div class="card"><h2>Letzte Missionen</h2>
      ${sess.length ? `<table class="resp"><thead><tr><th>Wann</th><th>Planet</th><th>Ergebnis</th><th>Sterne</th><th>Stimmung vorher → nachher</th><th>Tipps</th><th>Dauer</th></tr></thead><tbody>
      ${sess.slice(-15).reverse().map(s => `<tr><td>${fmtDateTime(s.ts)}</td><td>${esc(pName(s.planetId))}</td><td>${s.correct}/${s.total}</td><td class="stars">${starsHtml(s.stars)}</td><td>${moodE(s.moodBefore)} → ${moodE(s.moodAfter)}</td><td>${s.tips}</td><td>${Math.round((s.durationSec || 0) / 60 * 10) / 10} min</td></tr>`).join('')}
      </tbody></table>` : '<p class="muted">Noch keine Missionen gespielt.</p>'}
    </div>
    <div class="card"><h2>Fortschritt je Planet</h2>
      ${GALAXIES.map(g => `<h3 style="font-size:1em">${g.icon} ${esc(g.name)}</h3><div class="planet-grid">${planetsOf(g.id).map(p => {
        const pr = k.progress[p.id]; const op = isUnlocked(p.id, { mode: 'kid', ...k });
        return `<div class="pcheck" style="cursor:default"><span>${op ? '🔓' : '🔒'}</span><span><div class="pn">${esc(p.name)}</div><div class="pt">${pr ? `${pr.attempts}× gespielt · ${Math.round(100 * pr.correct / pr.total)} % richtig` : 'noch nicht gespielt'}</div></span><span class="stars">${pr ? starsHtml(pr.bestStars) : ''}</span></div>`;
      }).join('')}</div>`).join('')}
    </div>
    <div class="card no-print"><h2>Verwaltung</h2><div class="row">
      ${S.lite ? '' : '<button class="btn" id="newcode">🔑 Neuen Code erzeugen</button>'}
      <button class="btn" id="reset">↺ Fortschritt zurücksetzen</button>
      <button class="btn danger" id="del">🗑 Kind löschen</button></div>
      ${S.lite ? '' : '<p class="muted" style="font-size:.85em">Neuer Code: der alte funktioniert danach nicht mehr (z. B. wenn er weitergegeben wurde).</p>'}
    </div>`;
  if (!S.lite) el.querySelector('#newcode').onclick = async () => { if (!await ask('Neuen Code erzeugen? Der alte Code wird ungültig.', { okLabel: 'Neuen Code erzeugen' })) return; S.kid = await api(`/api/coach/kids/${k.id}/code`, { method: 'POST' }); await refreshKids(); render(); toast('Neuer Code: ' + S.kid.code); };
  el.querySelector('#reset').onclick = async () => { if (!await ask(`Gesamten Fortschritt von ${k.name} im Dashboard löschen? (Notizen und Freischaltungen bleiben.)`, { okLabel: 'Zurücksetzen', danger: true })) return; S.kid = await api(`/api/coach/kids/${k.id}/reset`, { method: 'POST' }); await refreshKids(); render(); };
  el.querySelector('#del').onclick = async () => { if (!await ask(`Zum Löschen bitte den Namen „${k.name}“ eintippen:`, { okLabel: 'Endgültig löschen', danger: true, typeToConfirm: k.name })) return; await api('/api/coach/kids/' + k.id, { method: 'DELETE' }); await refreshKids(); S.view = 'overview'; S.kid = null; render(); toast('Gelöscht'); };
}

function tabUnlock(el, k) {
  const sel = new Set(k.unlocked);
  el.innerHTML = `
    <div class="card">
      <h2>Welche Themen bearbeitet ihr gerade?</h2>
      <p class="muted" style="margin-top:-6px">Angehakte Planeten sind für ${esc(k.name)} offen (mit 🚩 markiert). Gespielte Planeten bleiben immer offen.${S.lite ? ' Nach dem Speichern bekommst du einen neuen Link, den du den Eltern schickst.' : ''}</p>
      <label class="switch"><input type="checkbox" id="auto" ${k.autoAdvance ? 'checked' : ''}> <span><strong>Automatisch weiterschalten</strong> – nach einem geschafften Planeten öffnet sich der nächste von selbst</span></label>
      ${GALAXIES.map(g => `<h3 style="font-size:1em;margin-top:20px">${g.icon} ${esc(g.name)} <button class="btn small" data-all="${g.id}">alle</button> <button class="btn small" data-none="${g.id}">keine</button></h3>
        <div class="planet-grid">${planetsOf(g.id).map(p => `<label class="pcheck"><input type="checkbox" value="${p.id}" ${sel.has(p.id) ? 'checked' : ''}><span><div class="pn">${esc(p.name)}</div><div class="pt">${esc(p.topic)}</div></span><span class="stars">${k.progress[p.id] ? starsHtml(k.progress[p.id].bestStars) : ''}</span></label>`).join('')}</div>`).join('')}
      <div class="row" style="margin-top:18px"><button class="btn primary" id="save">Speichern</button><span class="muted" id="saved"></span></div>
    </div>`;
  el.querySelectorAll('[data-all]').forEach(b => b.onclick = () => el.querySelectorAll('.pcheck input').forEach(i => { if (PLANET_BY_ID[i.value].galaxy === b.dataset.all) i.checked = true; }));
  el.querySelectorAll('[data-none]').forEach(b => b.onclick = () => el.querySelectorAll('.pcheck input').forEach(i => { if (PLANET_BY_ID[i.value].galaxy === b.dataset.none) i.checked = false; }));
  el.querySelector('#save').onclick = async () => {
    await patchKid({ unlocked: [...el.querySelectorAll('.pcheck input:checked')].map(i => i.value), autoAdvance: el.querySelector('#auto').checked });
    if (S.lite) { el.querySelector('#saved').textContent = '✓ Gespeichert'; shareLink(S.kid); }
    else el.querySelector('#saved').textContent = '✓ Gespeichert – beim nächsten Start sieht das Kind die neuen Planeten.';
  };
}

function errorsInRange(k) { return k.errors.filter(e => S.range === 0 || daysAgo(e.ts) < S.range); }
function errorStats(k) {
  const errs = errorsInRange(k);
  const byType = {};
  for (const e of errs) byType[e.type] = (byType[e.type] || 0) + 1;
  return { errs, types: Object.entries(byType).sort((a, b) => b[1] - a[1]) };
}
function tabErrors(el, k) {
  const { errs, types } = errorStats(k);
  const max = types[0]?.[1] || 1;
  const byTask = {};
  for (const e of errs) (byTask[e.task + '|' + e.planetId] ||= { task: e.task, planetId: e.planetId, expected: e.expected, given: [] }).given.push(e.given);
  const problem = Object.values(byTask).filter(x => x.given.length >= 2).sort((a, b) => b.given.length - a.given.length).slice(0, 12);
  const sessIn = k.sessions.filter(s => S.range === 0 || daysAgo(s.ts) < S.range);
  const tasks = sessIn.reduce((a, s) => a + s.total, 0);
  el.innerHTML = `
    <div class="row no-print" style="margin-bottom:12px">Zeitraum:
      ${[[14, '14 Tage'], [30, '30 Tage'], [90, '90 Tage'], [0, 'alles']].map(([v, l]) => `<button class="btn small ${S.range === v ? 'primary' : ''}" data-r="${v}">${l}</button>`).join('')}
      <span class="muted">${errs.length} Fehler bei ${tasks} Aufgaben</span></div>
    <div class="card"><h2>🎯 Fehlermuster</h2>
      ${types.length ? `<div class="bars">${types.map(([t, n]) => `
        <div class="bar-row" title="${esc(ERROR_TYPES[t]?.label)}: ${n} Fehler (${Math.round(100 * n / errs.length)} %)">
          <span class="lbl">${esc(ERROR_TYPES[t]?.label || t)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(100 * n / max).toFixed(1)}%"></div></div>
          <span class="n">${n}</span>
          <div class="tip">💡 ${esc(ERROR_TYPES[t]?.tip || '')}</div>
        </div>`).join('')}</div>` : '<p class="muted">Keine Fehler im Zeitraum – oder noch keine Missionen. 🎉</p>'}
    </div>
    <div class="card"><h2>🔁 Wiederkehrende Problem-Aufgaben</h2>
      ${problem.length ? `<table class="resp"><thead><tr><th>Aufgabe</th><th>Planet</th><th>Richtig wäre</th><th>Antworten des Kindes</th><th>Wie oft falsch</th></tr></thead><tbody>
      ${problem.map(p => `<tr><td><strong>${esc(p.task)}</strong></td><td>${esc(pName(p.planetId))}</td><td>${esc(p.expected)}</td><td>${esc([...new Set(p.given)].join(', '))}</td><td>${p.given.length}×</td></tr>`).join('')}</tbody></table>`
      : '<p class="muted">Noch keine Aufgabe wurde mehrfach falsch gelöst.</p>'}
    </div>`;
  el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { S.range = Number(b.dataset.r); tabErrors(el, k); });
}

function moodChart(sessions) {
  const data = sessions.filter(s => s.moodBefore || s.moodAfter).slice(-20);
  if (data.length < 2) return '<p class="muted">Sobald mindestens zwei Missionen mit Stimmungsangabe vorliegen, erscheint hier der Verlauf.</p>';
  const W = 640, H = 230, L = 44, R = 12, T = 12, B = 34;
  const x = i => L + (W - L - R) * (data.length === 1 ? .5 : i / (data.length - 1));
  const y = v => T + (H - T - B) * (1 - (v - 1) / 3);
  const line = key => { let d = '', pen = false; data.forEach((s, i) => { if (s[key]) { d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(s[key]).toFixed(1) + ' '; pen = true; } else pen = false; }); return d; };
  const dots = (key, cls) => data.map((s, i) => s[key] ? `<circle class="${cls}" cx="${x(i)}" cy="${y(s[key])}" r="4.5"/>` : '').join('');
  const step = Math.ceil(data.length / 6);
  return `
    <div class="legend"><span><i style="background:var(--series-1)"></i>vor der Mission</span><span><i style="background:var(--series-2)"></i>nach der Mission</span></div>
    <div class="chart-wrap" id="mc">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Stimmungsverlauf der letzten ${data.length} Missionen">
        <g class="grid">${[1, 2, 3, 4].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>
        <g class="axis">${MOODS.map(m => `<text x="${L - 10}" y="${y(m.v) + 5}" text-anchor="end" font-size="15">${m.e}</text>`).join('')}
          ${data.map((s, i) => i % step === 0 || i === data.length - 1 ? `<text x="${x(i)}" y="${H - 10}" text-anchor="middle">${fmtDate(s.ts).slice(0, 5)}</text>` : '').join('')}</g>
        <line class="xhair hidden" id="xh" y1="${T}" y2="${H - B}"/>
        <path class="s1" d="${line('moodBefore')}"/><path class="s2" d="${line('moodAfter')}"/>
        ${dots('moodBefore', 'd1')}${dots('moodAfter', 'd2')}
        ${data.map((s, i) => `<rect class="hit" data-i="${i}" x="${x(i) - (W - L - R) / data.length / 2}" y="${T}" width="${(W - L - R) / data.length}" height="${H - T - B}"/>`).join('')}
      </svg>
      <div class="tooltip hidden" id="tt"></div>
    </div>`;
}
function bindMoodChart(el, sessions) {
  const data = sessions.filter(s => s.moodBefore || s.moodAfter).slice(-20);
  const wrap = el.querySelector('#mc'); if (!wrap) return;
  const tt = wrap.querySelector('#tt'), xh = wrap.querySelector('#xh');
  wrap.querySelectorAll('.hit').forEach(r => {
    r.addEventListener('mouseenter', () => {
      const s = data[Number(r.dataset.i)];
      const cx = Number(r.getAttribute('x')) + Number(r.getAttribute('width')) / 2;
      xh.setAttribute('x1', cx); xh.setAttribute('x2', cx); xh.classList.remove('hidden');
      tt.innerHTML = `<strong>${esc(pName(s.planetId))}</strong> · ${fmtDateTime(s.ts)}<br>vorher ${moodE(s.moodBefore)} → nachher ${moodE(s.moodAfter)} · ${s.correct}/${s.total} richtig`;
      tt.classList.remove('hidden');
      const box = wrap.getBoundingClientRect(), svgW = wrap.querySelector('svg').viewBox.baseVal.width;
      const px = cx / svgW * box.width;
      tt.style.left = Math.min(Math.max(px - tt.offsetWidth / 2, 0), box.width - tt.offsetWidth) + 'px'; tt.style.top = '-8px';
    });
    r.addEventListener('mouseleave', () => { tt.classList.add('hidden'); xh.classList.add('hidden'); });
  });
}
function tabMood(el, k) {
  const byPlanet = {};
  for (const s of k.sessions) {
    if (!s.moodBefore && !s.moodAfter) continue;
    const b = byPlanet[s.planetId] ||= { before: [], after: [] };
    if (s.moodBefore) b.before.push(s.moodBefore); if (s.moodAfter) b.after.push(s.moodAfter);
  }
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const rows = Object.entries(byPlanet).map(([pid, b]) => ({ pid, before: avg(b.before), after: avg(b.after), n: Math.max(b.before.length, b.after.length) })).sort((a, b) => (a.before ?? 5) - (b.before ?? 5));
  const f = v => v === null ? '–' : `${moodE(Math.round(v))} ${v.toFixed(1)}`;
  el.innerHTML = `
    <div class="card"><h2>💛 Stimmungsverlauf (letzte 20 Missionen)</h2>${moodChart(k.sessions)}</div>
    <div class="card"><h2>Stimmung je Thema</h2>
      <p class="muted" style="margin-top:-6px">Sortiert nach der Stimmung <em>vor</em> der Mission – ganz oben stehen Themen, vor denen das Kind am ehesten Bammel hat. Steigt die Stimmung danach, stärkt das Üben das Selbstvertrauen.</p>
      ${rows.length ? `<table class="resp"><thead><tr><th>Planet</th><th>Ø vorher</th><th>Ø nachher</th><th>Veränderung</th><th>Missionen</th></tr></thead><tbody>
        ${rows.map(r => { const d = r.before !== null && r.after !== null ? r.after - r.before : null; return `<tr><td>${esc(pName(r.pid))}</td><td>${f(r.before)}</td><td>${f(r.after)}</td><td>${d === null ? '–' : `<span class="tag ${d > 0.2 ? 'good' : d < -0.2 ? 'bad' : ''}">${d > 0 ? '▲ +' : d < 0 ? '▼ ' : '● '}${d.toFixed(1)}</span>`}</td><td>${r.n}</td></tr>`; }).join('')}</tbody></table>` : '<p class="muted">Noch keine Stimmungsdaten.</p>'}
    </div>`;
  bindMoodChart(el, k.sessions);
}

const TEMPLATES = ['Super gemacht diese Woche! Ich bin stolz auf dich! 🌟', 'Ich habe dir einen neuen Planeten freigeschaltet. Viel Spaß beim Entdecken! 🚀', 'Fehler sind toll – mit ihnen lernt unser Gehirn! 💪', 'Denk dran: Übe heute 10 Minuten auf deinem Planeten. 🪐', 'Ich freue mich auf unsere nächste Stunde! 😊'];
function tabRadio(el, k) {
  el.innerHTML = `
    <div class="card"><h2>📡 Funkspruch an ${esc(k.name)}</h2>
      <p class="muted" style="margin-top:-6px">${S.lite ? 'Du bekommst einen Link mit dem Funkspruch. Schick ihn den Eltern – beim Öffnen erscheint die Nachricht als Funkspruch aus der Basis, mit Vorlese-Funktion.' : 'Erscheint beim nächsten App-Start als Funkspruch aus der Basis – mit Vorlese-Funktion.'}</p>
      <div class="templates">${TEMPLATES.map((t, i) => `<button class="btn small" data-t="${i}">${esc(t.slice(0, 32))}…</button>`).join('')}</div>
       <textarea id="msg" maxlength="${S.lite ? 160 : 500}" placeholder="Kurz und einfach schreiben – das Kind bekommt den Text vorgelesen."></textarea>
      <div class="row" style="margin-top:10px"><button class="btn primary" id="send">Senden 🚀</button></div>
    </div>
    <div class="card"><h2>Bisherige Funksprüche</h2>
      ${k.messages.length ? [...k.messages].reverse().map(m => `<div class="msg">${esc(m.text)}<div class="when">${fmtDateTime(m.ts)} · ${S.lite ? '🔗 als Link verschickt' : m.read ? '✓ gelesen ' + fmtDateTime(m.readAt) : '⏳ noch nicht gelesen'}</div></div>`).join('') : '<p class="muted">Noch keine Funksprüche.</p>'}
    </div>`;
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { el.querySelector('#msg').value = TEMPLATES[Number(b.dataset.t)]; });
  el.querySelector('#send').onclick = async () => {
    const text = el.querySelector('#msg').value.trim(); if (!text) return;
    S.kid = await api(`/api/coach/kids/${k.id}/messages`, { method: 'POST', body: { text } }); await refreshKids();
    tabRadio(el, S.kid);
    if (S.lite) shareLink(S.kid, text); else toast('Funkspruch gesendet');
  };
}

function tabWords(el, k) {
  const lists = (k.wordLists || []).map(l => ({ ...l }));
  const draw = () => {
    el.innerHTML = `
      <div class="card"><h2>📚 Lernwörter für ${esc(k.name)}</h2>
        <p class="muted" style="margin-top:-6px">Lege Wortlisten an, z. B. „Schule – Woche 12“ oder „Wörter mit ie“. ${esc(k.name)} sieht sie in der App unter 📚 Wörter: anhören, üben (Diktat, Lückenwort, Rechtschreibung) und als Kreuzworträtsel oder Wortsuche. Fehler erscheinen im Fehler-Radar.</p>
        <p class="muted">Tipp: Mit Bindestrich trennen (<b>Fahr-rad</b>), dann zeigt die App die Silben farbig.</p>
        ${lists.map((l, i) => `<div class="wl-edit">
          <div class="row"><input type="text" class="wl-name" data-i="${i}" value="${esc(l.name)}" maxlength="40" aria-label="Name der Liste" style="flex:1"><button class="btn small danger" data-del="${i}">Liste löschen</button></div>
          <textarea class="wl-words" data-i="${i}" placeholder="Ein Wort pro Zeile" aria-label="Wörter">${esc((l.words || []).join('\n'))}</textarea>
        </div>`).join('') || '<p class="muted">Noch keine Wortlisten.</p>'}
        <div class="row"><button class="btn" id="addlist">+ Neue Wortliste</button></div>
      </div>
      <div class="card"><h2>🎁 Belohnungsziel</h2>
        <p class="muted" style="margin-top:-6px">${esc(k.name)} sieht in der App, wie viele Pokale noch fehlen – z. B. „Bei 5 Pokalen darfst du dir in der Stunde ein Spiel aussuchen“.</p>
        <div class="row"><label>Bei <input type="number" id="rgoal" min="1" max="30" value="${k.reward?.goal || 5}" style="width:70px"> Pokalen:</label>
        <input type="text" id="rtext" maxlength="120" value="${esc(k.reward?.text || '')}" placeholder="z. B. Du darfst dir ein Spiel aussuchen! 🎲" style="flex:1;min-width:220px"></div>
      </div>
      <div class="row"><button class="btn primary" id="save">Speichern${S.lite ? ' & Link erstellen' : ''}</button><span class="muted" id="st"></span></div>`;
    const sync = () => { el.querySelectorAll('.wl-name').forEach(i => { lists[i.dataset.i].name = i.value; }); el.querySelectorAll('.wl-words').forEach(t => { lists[t.dataset.i].words = parseWordInput(t.value); }); };
    el.querySelector('#addlist').onclick = () => { sync(); lists.push({ id: 'l' + Date.now(), name: 'Lernwörter ' + new Date().toLocaleDateString('de-AT'), words: [] }); draw(); };
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (!await ask(`Liste „${lists[b.dataset.del].name}“ löschen?`, { okLabel: 'Löschen', danger: true })) return; sync(); lists.splice(Number(b.dataset.del), 1); draw(); });
    el.querySelector('#save').onclick = async () => {
      sync();
      const goal = Math.min(Math.max(Number(el.querySelector('#rgoal').value) || 5, 1), 30), text = el.querySelector('#rtext').value.trim();
      await patchKid({ wordLists: lists.filter(l => l.words.length).map(l => ({ id: l.id, name: l.name.trim() || 'Lernwörter', words: l.words })), reward: text ? { goal, text } : null });
      el.querySelector('#st').textContent = '✓ Gespeichert';
      if (S.lite) shareLink(S.kid); else toast('Gespeichert – das Kind sieht die Wörter beim nächsten Start.');
    };
  };
  draw();
}

function tabNotes(el, k) {
  el.innerHTML = `<div class="card"><h2>📝 Private Notizen</h2>
    <p class="muted" style="margin-top:-6px">Nur für dich sichtbar – das Kind sieht diese Notizen nie.</p>
    <textarea id="notes" style="min-height:320px" placeholder="z. B. Beobachtungen aus der Stunde, Förderziele, Absprachen mit Eltern …">${esc(k.notes)}</textarea>
    <div class="row" style="margin-top:10px"><button class="btn primary" id="save">Speichern</button><span class="muted" id="st"></span></div></div>`;
  el.querySelector('#save').onclick = async () => { await patchKid({ notes: el.querySelector('#notes').value }); el.querySelector('#st').textContent = '✓ Gespeichert ' + new Date().toLocaleTimeString('de-DE'); };
}

const PARENT_WORDS = {
  zaehlfehler: 'Beim Rechnen wird noch oft einzeln abgezählt – dabei verzählt man sich leicht.',
  schaetzen: 'Mengen auf einen Blick zu erfassen, fällt noch schwer.',
  zerlegung: 'Zahlen in Teile zu zerlegen (z. B. 7 = 3 + 4) wird noch geübt.',
  operation: 'Plus, Minus und Mal werden manchmal verwechselt.',
  zahlendreher: 'Bei zweistelligen Zahlen werden Zehner und Einer manchmal vertauscht (z. B. 21 statt 12).',
  stellenwert: 'Beim Rechnen über die 10 hinweg passieren noch Fehler.',
  nachbaraufgabe: 'Im Einmaleins landet das Ergebnis oft bei der „Nachbaraufgabe“ – die Reihen werden noch gefestigt.',
  laut_aehnlich: 'Ähnlich klingende Laute (z. B. d/t, b/p) werden noch verwechselt.',
  spiegel: 'Die Buchstaben b, d, p und q werden noch verwechselt.',
  vokal: 'Selbstlaute (a, e, i, o, u) genau zu hören, wird noch geübt.',
  silben: 'Wörter in Silben zu gliedern, wird noch geübt.',
  reim: 'Reime zu erkennen, wird noch geübt.',
  anlaut_statt_reim: 'Beim Reimen wird noch auf den Wortanfang statt auf das Ende geachtet.',
  dreher: 'Beim Schreiben werden Buchstaben manchmal in der Reihenfolge vertauscht.',
  auslassung: 'Beim Schreiben werden manchmal Buchstaben ausgelassen.',
  aehnliches_wort: 'Ähnlich aussehende Wörter werden beim Lesen noch verwechselt.',
  uebertrag: 'Beim Rechnen über den Zehner oder Hunderter hinweg geht der Übertrag noch verloren.',
  teilprodukt: 'Beim Malnehmen größerer Zahlen wird noch ein Teil vergessen.',
  rest: 'Bei Divisionen mit Rest ist der Rest noch unsicher.',
  einheit: 'Das Umrechnen von Maßeinheiten (z. B. m in cm) wird noch geübt.',
  vorzeichen: 'Bei negativen Zahlen passieren noch Vorzeichenfehler.',
  punkt_vor_strich: 'Die Regel „Punkt vor Strich“ wird noch nicht immer beachtet.',
  bruch: 'Beim Rechnen mit Brüchen werden Zähler und Nenner noch wie normale Zahlen behandelt.',
  komma: 'Bei Kommazahlen wird noch gedacht: mehr Ziffern = größere Zahl.',
  prozent: 'Prozentrechnungen sind noch unsicher.',
  gleichung: 'Beim Lösen von Gleichungen wird noch die falsche Gegenrechnung verwendet.',
  grossklein: 'Groß- und Kleinschreibung wird noch geübt.',
  doppelkonsonant: 'Doppelte Mitlaute (z. B. Sonne) werden noch vergessen oder zu viel gesetzt.',
  ie_i: '„ie“ und „i“ werden noch verwechselt.',
  dehnung: 'Das Dehnungs-h wird noch unsicher gesetzt.',
  sinn: 'Beim Lesen kurzer Texte werden Informationen noch verwechselt.',
  das_dass: '„das“ und „dass“ werden noch verwechselt.',
  s_laute: 's, ss und ß werden noch verwechselt.',
  zeitform: 'Unregelmäßige Vergangenheitsformen (z. B. ging statt gehte) werden noch geübt.',
  kommasetzung: 'Das Komma vor Bindewörtern (weil, dass, wenn) wird noch vergessen.',
};
function tabReport(el, k) {
  S.range = 30;
  const since = 30;
  const sess = k.sessions.filter(s => daysAgo(s.ts) < since);
  const { types } = errorStats(k);
  const strengths = PLANETS.filter(p => k.progress[p.id]?.bestStars === 3);
  const doneNow = [...new Set(sess.filter(s => s.stars >= 1).map(s => s.planetId))];
  const minutes = Math.round(sess.reduce((a, s) => a + (s.durationSec || 0), 0) / 60);
  const mb = sess.filter(s => s.moodBefore && s.moodAfter);
  const moodGain = mb.length ? mb.reduce((a, s) => a + (s.moodAfter - s.moodBefore), 0) / mb.length : null;
  el.innerHTML = `
    <div class="row no-print" style="margin-bottom:12px"><button class="btn primary" id="print">${S.lite ? '📋 Als Text kopieren' : '🖨 Drucken / als PDF speichern'}</button>
      <label class="switch"><input type="checkbox" id="withnotes"> Notizen mitdrucken</label></div>
    <div class="card" id="report">
      <p class="muted" style="margin:0">${esc(S.settings.practiceName || APP_NAME)} ${S.settings.coachName ? '· ' + esc(S.settings.coachName) : ''}</p>
      <h2 style="font-size:1.4em;margin:.2em 0 .6em">Lernbericht für ${esc(k.name)} <span class="muted" style="font-size:.6em">${fmtDate(Date.now() - since * 86400000)} – ${fmtDate(Date.now())}</span></h2>
      <h3>🚀 Fleiß</h3>
      <p>${esc(k.name)} hat in den letzten ${since} Tagen <strong>${sess.length} Missionen</strong> gespielt (${minutes} Minuten Übungszeit)${doneNow.length ? ` und dabei ${doneNow.length} Planeten erfolgreich abgeschlossen: ${doneNow.map(id => esc(pName(id))).join(', ')}` : ''}.</p>
      <h3>⭐ Stärken</h3>
      <p>${strengths.length ? `Mit voller Punktzahl gemeistert: ${strengths.map(p => esc(p.name) + ' (' + esc(p.topic) + ')').join('; ')}.` : 'Die ersten Planeten werden gerade erobert – jeder Versuch zählt!'}</p>
      <h3>🌱 Daran arbeiten wir</h3>
      ${types.length ? `<ul>${types.slice(0, 3).map(([t]) => `<li>${esc(PARENT_WORDS[t] || ERROR_TYPES[t]?.label || t)}</li>`).join('')}</ul>` : '<p>Im Moment zeigen sich keine typischen Fehlermuster. Weiter so!</p>'}
      <h3>💛 Gefühl beim Lernen</h3>
      <p>${moodGain === null ? 'Noch keine Angaben.' : moodGain > 0.15 ? `Nach dem Üben fühlt sich ${esc(k.name)} im Schnitt <strong>besser</strong> als vorher – ein schönes Zeichen für wachsendes Selbstvertrauen.` : moodGain < -0.15 ? `Nach dem Üben ist die Stimmung manchmal gedrückt. Bitte loben Sie besonders die Anstrengung, nicht nur das Ergebnis.` : 'Die Stimmung bleibt beim Üben stabil.'}</p>
      <h3>🏠 Tipps für zu Hause</h3>
      <ul><li>Lieber 10 Minuten täglich als eine Stunde am Wochenende.</li><li>Fehler gelassen nehmen – sie zeigen, was das Gehirn gerade lernt.</li><li>Fragen Sie nach dem Planeten, den Ihr Kind zuletzt besucht hat, und lassen Sie es erklären.</li></ul>
      <div id="rnotes" class="hidden"><h3>📝 Anmerkungen</h3><p style="white-space:pre-wrap">${esc(k.notes)}</p></div>
    </div>`;
  el.querySelector('#withnotes').onchange = e => el.querySelector('#rnotes').classList.toggle('hidden', !e.target.checked);
  el.querySelector('#print').onclick = () => {
    if (!S.lite) { window.print(); return; }
    const r = el.querySelector('#report');
    const lines = [];
    r.querySelectorAll('p, h2, h3, li').forEach(n => { if (n.closest('.hidden')) return; const t = n.textContent.replace(/\s+/g, ' ').trim(); if (t) lines.push(n.tagName === 'LI' ? '• ' + t : n.tagName === 'H3' ? '\n' + t : t); });
    showCopy('Elternbericht', lines.join('\n'), 'Zum Einfügen in eine E-Mail, WhatsApp-Nachricht oder ein Textdokument.');
  };
}

function printCard(k) {
  const w = window.open('', '_blank', 'width=600,height=500');
  if (!w) { toast('Pop-up blockiert'); return; }
  const url = location.origin;
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Zugangskarte ${esc(k.name)}</title></head>
  <body style="font-family:Verdana,sans-serif;display:grid;place-items:center;min-height:90vh;margin:0">
  <div style="width:340px;border:3px dashed #5b3fd6;border-radius:20px;padding:24px;text-align:center">
    <div style="font-size:48px">${esc(k.avatar)} 🚀</div>
    <h1 style="margin:.2em 0;font-size:22px">${APP_NAME}</h1>
    <p style="margin:.2em 0">Hallo <strong>${esc(k.name)}</strong>! Dein geheimer Code:</p>
    <p style="font-size:30px;font-weight:900;letter-spacing:3px;background:#f0edff;border-radius:12px;padding:10px">${esc(k.code)}</p>
    <p style="font-size:14px">Öffne <strong>${esc(url)}</strong><br>und tippe auf „Ich habe einen Code“.</p>
    ${S.settings.practiceName ? `<p style="font-size:12px;color:#666">${esc(S.settings.practiceName)}</p>` : ''}
  </div></body></html>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
}

function editKidDialog() {
  const k = S.kid; let av = k.avatar;
  const d = document.createElement('dialog');
  d.innerHTML = `<form method="dialog"><h2 style="margin-top:0">Bearbeiten</h2>
    <div class="field"><label for="en">Name</label><input id="en" type="text" maxlength="40" value="${esc(k.name)}" required></div>
    <div class="field"><label>Avatar</label><div class="emoji-pick">${AVATARS.map(a => `<button type="button" data-a="${a}" class="${a === av ? 'sel' : ''}">${a}</button>`).join('')}</div></div>
    <div class="row"><button class="btn primary" value="ok">Speichern</button><button class="btn" value="cancel" formnovalidate>Abbrechen</button></div></form>`;
  host.appendChild(d); d.showModal();
  d.querySelectorAll('.emoji-pick button').forEach(b => b.onclick = () => { av = b.dataset.a; d.querySelectorAll('.emoji-pick button').forEach(x => x.classList.toggle('sel', x === b)); });
  d.querySelector('form').onsubmit = async e => {
    if (e.submitter?.value === 'cancel') return;
    e.preventDefault(); await patchKid({ name: d.querySelector('#en').value, avatar: av }); d.close(); render();
  };
  d.addEventListener('close', () => d.remove());
}

// ---------- Einstellungen ----------
function renderSettings(main) {
  const s = S.settings;
  main.innerHTML = `
    <div class="page-head"><h1>⚙️ Einstellungen</h1></div>
    <div class="card"><h2>Deine Praxis in der App</h2>
      <p class="muted" style="margin-top:-6px">${S.lite ? 'Erscheint im Dashboard und im Elternbericht.' : 'Erscheint auf der Startseite der freien Version („Für Eltern“) – so wird die kostenlose App zu deiner Visitenkarte.'}</p>
      <form id="sf">
        <div class="field"><label for="pn">Praxisname</label><input id="pn" type="text" maxlength="80" value="${esc(s.practiceName)}" placeholder="z. B. Lernwerkstatt Sonnenschein"></div>
        <div class="field"><label for="cn">Dein Name (so sehen dich die Kinder)</label><input id="cn" type="text" maxlength="60" value="${esc(s.coachName)}" placeholder="z. B. Frau Lea"></div>
        <div class="field"><label for="cu">Kontakt-Link (Webseite, mailto: oder tel:)</label><input id="cu" type="url" maxlength="300" value="${esc(s.contactUrl)}" placeholder="https://… oder mailto:…"></div>
        <div class="field"><label for="wl">Begrüßungstext auf der Startseite (optional)</label><input id="wl" type="text" maxlength="400" value="${esc(s.welcome)}"></div>
        <button class="btn primary">Speichern</button> <span class="muted" id="ss"></span>
      </form>
    </div>
    ${S.lite ? `<div class="card"><h2>So funktioniert die Version ohne Server</h2>
      <ul style="margin:0;padding-left:1.2em"><li>Dieses Dashboard ist nur für dich sichtbar; deine Daten liegen in deinem Claude-Konto.</li>
      <li>Kinder bekommen von dir einen persönlichen <strong>Link</strong> (oder Code). Darin stehen die freigeschalteten Planeten und ggf. ein Funkspruch.</li>
      <li>Der Fortschritt bleibt auf dem Gerät des Kindes. Über 📤 in der App schicken Eltern dir einen <strong>Bericht-Code</strong>, den du hier mit „📥 Bericht einfügen“ übernimmst.</li></ul></div>
    <div class="card"><h2>🔢 PIN</h2><p>Der Coach-Bereich ist zusätzlich zu deinem Claude-Konto mit einem PIN geschützt.</p><button class="btn" id="pinchange">PIN ändern</button></div>` : `<div class="grid2">
      <div class="card"><h2>Passwort ändern</h2>
        <form id="pf"><div class="field"><label for="op">Altes Passwort</label><input id="op" type="password" autocomplete="current-password" required></div>
        <div class="field"><label for="np">Neues Passwort (mind. 8 Zeichen)</label><input id="np" type="password" autocomplete="new-password" minlength="8" required></div>
        <button class="btn">Ändern</button> <span class="err" id="ps"></span></form>
      </div>
      <div class="card"><h2>Datensicherung</h2>
        <p>Lade regelmäßig eine Sicherung aller Daten herunter (JSON-Datei). Bitte sicher aufbewahren – sie enthält Lerndaten der Kinder.</p>
        <button class="btn" id="exp">⬇ Sicherung herunterladen</button>
      </div>
    </div>`}`;
  main.querySelector('#sf').onsubmit = async e => {
    e.preventDefault();
    S.settings = await api('/api/coach/settings', { method: 'PUT', body: { practiceName: main.querySelector('#pn').value, coachName: main.querySelector('#cn').value, contactUrl: main.querySelector('#cu').value, welcome: main.querySelector('#wl').value } });
    main.querySelector('#ss').textContent = '✓ Gespeichert';
  };
  main.querySelector('#pinchange')?.addEventListener('click', () => S.lite.changePin());
  if (!S.lite) main.querySelector('#pf').onsubmit = async e => {
    e.preventDefault();
    try { await api('/api/coach/password', { method: 'POST', body: { oldPassword: main.querySelector('#op').value, newPassword: main.querySelector('#np').value } }); main.querySelector('#ps').textContent = ''; toast('Passwort geändert'); e.target.reset(); }
    catch (x) { main.querySelector('#ps').textContent = x.message; }
  };
  if (!S.lite) main.querySelector('#exp').onclick = async () => {
    const r = await fetch('/api/coach/export', { headers: { Authorization: 'Bearer ' + S.token } });
    const blob = await r.blob(); const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `lerniversum-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };
}

async function shareLink(k, message = '') {
  const url = await S.lite.kidLink(k, message);
  const text = message
    ? `📡 Ein Funkspruch für ${k.name}! Einfach antippen: ${url}`
    : `🚀 Hallo! Hier ist ${k.name}s persönlicher ${APP_NAME}-Link: ${url}\n(Falls der Link nicht geht: Code „${k.code}“ in der App unter „Ich habe einen Code“ eingeben.)`;
  showCopy(message ? 'Funkspruch-Link für die Eltern' : `Link für ${k.name}`, text, 'Schick diesen Text den Eltern, z. B. per WhatsApp oder E-Mail. Neuer Link = neue Freischaltungen; der Fortschritt des Kindes bleibt erhalten.');
}
function importDialog() {
  const d = document.createElement('dialog');
  d.innerHTML = `<form method="dialog" id="impf"><h2 style="margin-top:0">📥 Bericht einfügen</h2>
    <p class="muted">Füge den Text ein, den dir die Eltern geschickt haben (er enthält „SH1“).</p>
    <textarea id="imp-t" style="min-height:140px"></textarea><p class="err" id="imp-e"></p>
    <div class="row"><button class="btn primary" value="ok">Übernehmen</button><button class="btn" value="cancel" formnovalidate>Abbrechen</button></div></form>`;
  host.appendChild(d); d.showModal();
  d.querySelector('form').onsubmit = async e => {
    if (e.submitter?.value === 'cancel') return;
    e.preventDefault();
    try {
      const r = await api('/api/coach/import', { method: 'POST', body: { text: d.querySelector('#imp-t').value } });
      d.close(); await refreshKids(); await openKid(r.kid.id, 'overview');
      toast(r.created ? `${r.kid.name} neu angelegt und Bericht übernommen` : `Bericht von ${r.kid.name} übernommen (${r.newSessions} neue Missionen)`);
    } catch (x) { d.querySelector('#imp-e').textContent = x.message; }
  };
  d.addEventListener('close', () => d.remove());
}

export function start(lite = null, hostEl = null) {
  S.lite = lite;
  host = hostEl || document.querySelector('.lv-coach');
  host.innerHTML = '<div class="lv-root"></div><div class="lv-toast" role="status"></div>';
  root = host.firstElementChild; toastEl = host.lastElementChild;
  if (lite) boot(); else S.token ? boot() : renderLogin();
}
if (document.querySelector('.lv-coach[data-auto]')) start(); // Server-Version (coach.html)
