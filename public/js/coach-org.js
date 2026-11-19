// Organisation der Coachin: Kalender, Stundenprotokoll, Abrechnung, Aufgaben, Datensicherung,
// Kind-Profil und Förderziele. Wird vom Coach-Bereich (coach.js) eingebunden.
import { APP_NAME, ERROR_TYPES, SCHULSTUFEN, SCHULFORMEN } from './curriculum.js';
import { FOCUS, LESSON_STATUS, GOAL_STATUS, PLACES, PAY_METHODS, uidLocal, lessonRate } from './org-model.js';

let C; // Kontext aus coach.js: { S, api, esc, ask, toast, showCopy, copyText, host, refreshKids, render, openKid, patchKid, saveFile }
export function initOrg(ctx) { C = ctx; }

// ---------- Datum ----------
const pad2 = n => String(n).padStart(2, '0');
export const isoDay = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayIso = () => isoDay(new Date());
const parseDay = s => new Date(s + 'T12:00:00');
const addDays = (s, n) => { const d = parseDay(s); d.setDate(d.getDate() + n); return isoDay(d); };
const mondayOf = s => { const d = parseDay(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return isoDay(d); };
const fmtDay = s => parseDay(s).toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit' });
const fmtLong = s => parseDay(s).toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = s => parseDay(s).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
const money = n => (Number(n) || 0).toLocaleString('de-AT', { style: 'currency', currency: 'EUR' });
const monthName = ym => parseDay(ym + '-01').toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });

// ---------- Daten ----------
export async function loadOrg() { C.S.org = await C.api('/api/coach/org'); return C.S.org; }
async function saveOrg(patch) { C.S.org = await C.api('/api/coach/org', { method: 'PUT', body: { ...C.S.org, ...patch } }); return C.S.org; }
const kidById = id => C.S.kids.find(k => k.id === id);
/** Alle Termine: Stunden der Kinder + sonstige Termine */
function allEvents() {
  const out = [];
  for (const k of C.S.kids) for (const l of k.lessons || []) out.push({ ...l, kidId: k.id, kid: k });
  for (const e of C.S.org?.events || []) out.push({ ...e, kidId: '', kid: null });
  return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
async function saveLessonFor(kidId, mutate) {
  const full = await C.api('/api/coach/kids/' + kidId);
  const lessons = mutate([...(full.lessons || [])]);
  const k = await C.api('/api/coach/kids/' + kidId, { method: 'PATCH', body: { lessons } });
  if (C.S.kid?.id === kidId) C.S.kid = k;
  await C.refreshKids();
}
const statusTag = l => `<span class="tag st-${l.status}">${LESSON_STATUS[l.status]?.label.replace(' (verrechnet)', '') || l.status}</span>`;

// ---------- Übersicht: „Heute & diese Woche“ ----------
export function overviewOrgHtml() {
  const t = todayIso(), week = addDays(t, 7);
  const next = allEvents().filter(e => e.status === 'geplant' && e.date >= t && e.date <= week).slice(0, 6);
  const todos = (C.S.org?.todos || []).filter(x => !x.done).sort((a, b) => (a.due || '9').localeCompare(b.due || '9'));
  const unpaid = C.S.kids.reduce((sum, k) => sum + (k.lessons || []).filter(l => LESSON_STATUS[l.status]?.bill && !l.paid).length * lessonRate({ profile: { rate: k.rate } }, C.S.org), 0);
  const lb = C.S.org?.lastBackup, backupOld = C.S.kids.length && (!lb || (Date.now() - Date.parse(lb)) / 864e5 > 30);
  return `
    ${backupOld ? `<button class="alert warn org-link" data-go="backup"><span class="ic">💾</span><span>${lb ? 'Deine letzte Datensicherung ist über 30 Tage alt.' : 'Du hast noch keine Datensicherung gemacht.'} Jetzt sichern →</span></button>` : ''}
    <div class="grid3">
      <div class="card"><h2>📅 Nächste Termine</h2>
        ${next.length ? `<ul class="mini-list">${next.map(e => `<li><button class="org-ev" data-ev="${e.id}" data-kid="${e.kidId}"><b>${e.date === t ? 'Heute' : fmtDay(e.date)} ${e.time}</b> ${e.kid ? esc(e.kid.avatar) + ' ' + esc(e.kid.name) : '📌 ' + esc(e.title || 'Termin')}</button></li>`).join('')}</ul>` : '<p class="muted">Keine Termine in den nächsten 7 Tagen.</p>'}
        <button class="btn small" data-go="calendar">Zum Kalender →</button></div>
      <div class="card"><h2>✅ Offene Aufgaben (${todos.length})</h2>
        ${todos.length ? `<ul class="mini-list">${todos.slice(0, 5).map(x => `<li class="${x.due && x.due < t ? 'overdue' : ''}">${x.due ? `<b>${fmtDay(x.due)}</b> ` : ''}${esc(x.text)}</li>`).join('')}</ul>` : '<p class="muted">Nichts offen. 🎉</p>'}
        <button class="btn small" data-go="todos">Zu den Aufgaben →</button></div>
      <div class="card"><h2>💶 Offene Honorare</h2>
        <p class="big-num">${money(unpaid)}</p><p class="muted">gehaltene, noch nicht bezahlte Einheiten</p>
        <button class="btn small" data-go="billing">Zur Abrechnung →</button></div>
    </div>`;
}
export function bindOverviewOrg(main) {
  main.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { C.S.view = b.dataset.go; C.render(); });
  main.querySelectorAll('.org-ev').forEach(b => b.onclick = () => lessonDialog(findEvent(b.dataset.ev, b.dataset.kid), () => C.render()));
}
const esc = s => C.esc(s);
const findEvent = (id, kidId) => (kidId ? { ...(kidById(kidId)?.lessons || []).find(l => l.id === id), kidId } : { ...(C.S.org.events || []).find(e => e.id === id), kidId: '' });

// ---------- Termin-Dialog (neu / bearbeiten / Protokoll) ----------
export function lessonDialog(ev = {}, onDone = () => { }) {
  const isNew = !ev.id;
  const d = document.createElement('dialog');
  d.className = 'wide';
  const kids = [...C.S.kids].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  d.innerHTML = `<form method="dialog" id="lf">
    <h2 style="margin-top:0">${isNew ? '📅 Neuer Termin' : '🗓️ Termin & Protokoll'}</h2>
    <div class="form-grid">
      <div class="field"><label for="l-kid">Kind</label><select id="l-kid" ${isNew ? '' : 'disabled'}>
        ${kids.map(k => `<option value="${k.id}" ${k.id === ev.kidId ? 'selected' : ''}>${esc(k.avatar)} ${esc(k.name)}</option>`).join('')}
        <option value="" ${ev.kidId === '' && !isNew ? 'selected' : ''}>📌 Sonstiger Termin (ohne Kind)</option></select></div>
      <div class="field" id="l-title-f"><label for="l-title">Titel</label><input id="l-title" type="text" maxlength="80" value="${esc(ev.title || '')}" placeholder="z. B. Erstgespräch Familie Huber"></div>
      <div class="field"><label for="l-date">Datum</label><input id="l-date" type="date" value="${ev.date || todayIso()}" required></div>
      <div class="field"><label for="l-time">Uhrzeit</label><input id="l-time" type="time" value="${ev.time || '14:00'}" required></div>
      <div class="field"><label for="l-dur">Dauer (Min.)</label><input id="l-dur" type="number" min="10" max="240" step="5" value="${ev.dur || 50}"></div>
      <div class="field"><label for="l-place">Ort</label><select id="l-place">${PLACES.map(p => `<option ${p === (ev.place || 'Praxis') ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
      ${isNew ? `<div class="field"><label for="l-rep">Wiederholen</label><select id="l-rep"><option value="1">Einmalig</option><option value="4">Wöchentlich, 4 Wochen</option><option value="8">Wöchentlich, 8 Wochen</option><option value="12">Wöchentlich, 12 Wochen</option><option value="20">Wöchentlich, 20 Wochen</option></select></div>` : `
      <div class="field"><label for="l-status">Status</label><select id="l-status">${Object.entries(LESSON_STATUS).map(([k, v]) => `<option value="${k}" ${k === ev.status ? 'selected' : ''}>${v.label}</option>`).join('')}</select></div>
      <div class="field"><label class="switch" style="margin-top:26px"><input type="checkbox" id="l-paid" ${ev.paid ? 'checked' : ''}> Bezahlt</label></div>`}
    </div>
    ${isNew ? '' : `<details ${ev.content || ev.observation || ev.homework || ev.status === 'gehalten' ? 'open' : ''}><summary><b>📝 Stundenprotokoll</b></summary>
      <div class="field"><label for="l-content">Inhalte der Stunde</label><textarea id="l-content" maxlength="2000" placeholder="z. B. Zehnerübergang mit Rechenrahmen, Lernwörter Woche 12">${esc(ev.content || '')}</textarea></div>
      <div class="field"><label for="l-obs">Beobachtungen</label><textarea id="l-obs" maxlength="2000" placeholder="z. B. sicherer beim Zerlegen, noch Zählfehler bei 7+8">${esc(ev.observation || '')}</textarea></div>
      <div class="field"><label for="l-hw">Hausübung / Absprachen</label><textarea id="l-hw" maxlength="1000" placeholder="z. B. 3× Plus-Planet, Lernwörter üben">${esc(ev.homework || '')}</textarea></div>
      ${ev.kidId ? '<label class="switch"><input type="checkbox" id="l-radio"> 📡 Hausübung als Funkspruch an das Kind schicken</label>' : ''}
    </details>`}
    <p class="err" id="l-err"></p>
    <div class="row">
      <button class="btn primary" value="ok">${isNew ? 'Termin anlegen' : 'Speichern'}</button>
      ${!isNew && ev.status === 'geplant' ? '<button class="btn" type="button" id="l-held">✓ Als gehalten markieren</button>' : ''}
      <button class="btn" value="cancel" formnovalidate>Abbrechen</button>
      ${!isNew ? `<button class="btn danger" type="button" id="l-del" style="margin-left:auto">Löschen${ev.series ? '…' : ''}</button>` : ''}
    </div></form>`;
  C.host.appendChild(d); d.showModal();
  const kidSel = d.querySelector('#l-kid'), titleF = d.querySelector('#l-title-f');
  const syncTitle = () => { titleF.style.display = kidSel.value ? 'none' : ''; };
  kidSel.onchange = syncTitle; syncTitle();
  const read = () => ({
    date: d.querySelector('#l-date').value, time: d.querySelector('#l-time').value, dur: Number(d.querySelector('#l-dur').value) || 50,
    place: d.querySelector('#l-place').value, title: d.querySelector('#l-title').value.trim(),
    ...(isNew ? {} : { status: d.querySelector('#l-status').value, paid: d.querySelector('#l-paid').checked, content: d.querySelector('#l-content').value, observation: d.querySelector('#l-obs').value, homework: d.querySelector('#l-hw').value }),
  });
  const persist = async (kidId, fn) => { if (kidId) await saveLessonFor(kidId, fn); else await saveOrg({ events: fn([...(C.S.org.events || [])]) }); };
  d.querySelector('#l-held')?.addEventListener('click', () => { d.querySelector('#l-status').value = 'gehalten'; d.querySelector('details').open = true; d.querySelector('#l-content').focus(); });
  d.querySelector('#l-del')?.addEventListener('click', async () => {
    let all = false;
    if (ev.series) {
      const v = await choose('Dieser Termin gehört zu einer wöchentlichen Serie. Was möchtest du löschen?', [['one', 'Nur diesen Termin'], ['series', 'Diesen und alle folgenden']]);
      if (!v) return; all = v === 'series';
    } else if (!await C.ask('Diesen Termin löschen?', { okLabel: 'Löschen', danger: true })) return;
    await persist(ev.kidId, list => list.filter(l => (all ? !(l.series === ev.series && l.date >= ev.date) : l.id !== ev.id)));
    d.close(); C.toast('Termin gelöscht'); onDone();
  });
  d.querySelector('form').onsubmit = async e => {
    if (e.submitter?.value === 'cancel') return;
    e.preventDefault();
    const v = read(), kidId = isNew ? kidSel.value : ev.kidId;
    if (!v.date || !v.time) { d.querySelector('#l-err').textContent = 'Bitte Datum und Uhrzeit angeben.'; return; }
    if (!kidId && !v.title) { d.querySelector('#l-err').textContent = 'Bitte einen Titel für den Termin angeben.'; return; }
    try {
      if (isNew) {
        const n = Number(d.querySelector('#l-rep').value) || 1, series = n > 1 ? uidLocal() : '';
        const items = Array.from({ length: n }, (_, i) => ({ ...v, id: uidLocal() + i, date: addDays(v.date, 7 * i), status: 'geplant', series }));
        await persist(kidId, list => [...list, ...items]);
        C.toast(n > 1 ? `${n} Termine angelegt` : 'Termin angelegt');
      } else {
        await persist(kidId, list => list.map(l => (l.id === ev.id ? { ...l, ...v } : l)));
        C.toast('Gespeichert');
      }
      const radio = !isNew && d.querySelector('#l-radio')?.checked && v.homework.trim();
      d.close(); onDone();
      if (radio) await C.sendRadio(kidId, `Deine Hausübung: ${v.homework.trim()}`.slice(0, 160));
    } catch (x) { d.querySelector('#l-err').textContent = x.message; }
  };
  d.addEventListener('close', () => d.remove());
}

function choose(text, opts) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.innerHTML = `<form method="dialog"><p style="margin-top:0">${esc(text)}</p><div class="row">${opts.map(([v, l]) => `<button class="btn danger" value="${v}">${esc(l)}</button>`).join('')}<button class="btn" value="">Abbrechen</button></div></form>`;
    C.host.appendChild(d); d.showModal();
    d.addEventListener('close', () => { resolve(d.returnValue || null); d.remove(); });
  });
}

// ---------- Kalender ----------
export function renderCalendar(main) {
  C.S.calWeek ||= mondayOf(todayIso());
  const mon = C.S.calWeek, days = Array.from({ length: 7 }, (_, i) => addDays(mon, i)), t = todayIso();
  const evs = allEvents().filter(e => e.date >= mon && e.date <= days[6]);
  const held = evs.filter(e => e.status === 'gehalten').length, planned = evs.filter(e => e.status === 'geplant').length;
  main.innerHTML = `
    <div class="page-head"><h1>📅 Kalender</h1><div class="row"><button class="btn" id="ics">📤 Exportieren (.ics)</button><button class="btn primary" id="new">+ Termin</button></div></div>
    <div class="cal-nav row"><button class="btn small" id="prev" aria-label="Vorige Woche">←</button><button class="btn small" id="now">Diese Woche</button><button class="btn small" id="next" aria-label="Nächste Woche">→</button>
      <b>${fmtShort(mon)} – ${fmtShort(days[6])}</b><span class="muted">${planned} geplant · ${held} gehalten</span></div>
    <div class="cal-week">${days.map(day => {
      const list = evs.filter(e => e.date === day);
      return `<section class="cal-day ${day === t ? 'today' : ''}"><h3>${fmtDay(day)}</h3>
        ${list.map(e => `<button class="cal-ev st-${e.status} ${e.paid ? 'paid' : ''}" data-ev="${e.id}" data-kid="${e.kidId}">
          <span class="ce-time">${e.time} · ${e.dur}′</span><span class="ce-who">${e.kid ? esc(e.kid.avatar) + ' ' + esc(e.kid.name) : '📌 ' + esc(e.title)}</span>
          <span class="ce-meta">${statusTag(e)}${e.place !== 'Praxis' ? ` <span class="tag">${esc(e.place)}</span>` : ''}${e.content ? ' 📝' : ''}${LESSON_STATUS[e.status]?.bill ? (e.paid ? ' <span class="tag good">bezahlt</span>' : ' <span class="tag warn">offen</span>') : ''}</span></button>`).join('')}
        <button class="cal-add" data-day="${day}" aria-label="Termin am ${fmtDay(day)} anlegen">+</button></section>`;
    }).join('')}</div>`;
  const go = n => { C.S.calWeek = n === 0 ? mondayOf(t) : addDays(mon, 7 * n); renderCalendar(main); };
  main.querySelector('#prev').onclick = () => go(-1); main.querySelector('#next').onclick = () => go(1); main.querySelector('#now').onclick = () => go(0);
  const reload = () => renderCalendar(main);
  main.querySelector('#new').onclick = () => lessonDialog({ kidId: C.S.kids[0]?.id || '', date: t }, reload);
  main.querySelectorAll('.cal-add').forEach(b => b.onclick = () => lessonDialog({ kidId: C.S.kids[0]?.id || '', date: b.dataset.day }, reload));
  main.querySelectorAll('.cal-ev').forEach(b => b.onclick = () => lessonDialog(findEvent(b.dataset.ev, b.dataset.kid), reload));
  main.querySelector('#ics').onclick = () => exportIcs();
}
function exportIcs() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const dt = (date, time, addMin = 0) => { const d = new Date(`${date}T${time}:00`); d.setMinutes(d.getMinutes() + addMin); return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`; };
  const escI = s => String(s).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const evs = allEvents().filter(e => e.status !== 'abgesagt' && e.date >= addDays(todayIso(), -30));
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${APP_NAME}//Coach//DE`, 'CALSCALE:GREGORIAN',
    ...evs.flatMap(e => ['BEGIN:VEVENT', `UID:${e.id}@lerniversum`, `DTSTAMP:${stamp}`, `DTSTART:${dt(e.date, e.time)}`, `DTEND:${dt(e.date, e.time, e.dur)}`,
      `SUMMARY:${escI(e.kid ? `${APP_NAME}: ${e.kid.name}` : e.title)}`, `LOCATION:${escI(e.place)}`, 'END:VEVENT']), 'END:VCALENDAR'];
  saveText('lerniversum-termine.ics', lines.join('\r\n'), 'Kalender-Datei');
}
async function saveText(filename, text, what) {
  try { await C.saveFile(filename, text); C.toast(`${what} gespeichert`); }
  catch (e) { C.showCopy(what, text, 'Der Download ist hier nicht möglich – du kannst den Inhalt kopieren.'); }
}

// ---------- Aufgaben ----------
export function renderTodos(main) {
  const org = C.S.org, t = todayIso();
  const open = org.todos.filter(x => !x.done).sort((a, b) => (a.due || '9').localeCompare(b.due || '9'));
  const done = org.todos.filter(x => x.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 15);
  const kids = [...C.S.kids].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const item = x => `<li class="todo ${x.done ? 'done' : ''} ${!x.done && x.due && x.due < t ? 'overdue' : ''}">
      <label class="switch"><input type="checkbox" data-t="${x.id}" ${x.done ? 'checked' : ''}><span>${esc(x.text)}</span></label>
      <span class="todo-meta">${x.kidId && kidById(x.kidId) ? `<span class="tag">${esc(kidById(x.kidId).avatar)} ${esc(kidById(x.kidId).name)}</span>` : ''}${x.due ? `<span class="tag ${!x.done && x.due < t ? 'bad' : ''}">${x.due === t ? 'heute' : fmtDay(x.due)}</span>` : ''}</span>
      <button class="btn small" data-del="${x.id}" aria-label="Aufgabe löschen">✕</button></li>`;
  main.innerHTML = `
    <div class="page-head"><h1>✅ Aufgaben</h1></div>
    <div class="card"><form id="tf" class="row">
      <input type="text" id="t-text" maxlength="200" placeholder="Neue Aufgabe, z. B. Elterngespräch vorbereiten" style="flex:2;min-width:220px" required>
      <input type="date" id="t-due" aria-label="Fällig am" style="width:auto">
      <select id="t-kid" aria-label="Kind" style="width:auto"><option value="">— kein Kind —</option>${kids.map(k => `<option value="${k.id}">${esc(k.name)}</option>`).join('')}</select>
      <button class="btn primary">Hinzufügen</button></form>
      <div class="templates">${['Elternbericht schicken', 'Neue Lernwörter eintragen', 'Termin mit Schule vereinbaren', 'Honorarnote schicken', 'Material vorbereiten'].map(s => `<button class="btn small" data-tpl="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    </div>
    <div class="card"><h2>Offen (${open.length})</h2>${open.length ? `<ul class="todo-list">${open.map(item).join('')}</ul>` : '<p class="muted">Alles erledigt! 🎉</p>'}</div>
    ${done.length ? `<div class="card"><h2>Erledigt</h2><ul class="todo-list">${done.map(item).join('')}</ul></div>` : ''}`;
  const save = async todos => { await saveOrg({ todos }); renderTodos(main); };
  main.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => { main.querySelector('#t-text').value = b.dataset.tpl; main.querySelector('#t-text').focus(); });
  main.querySelector('#tf').onsubmit = e => { e.preventDefault(); const text = main.querySelector('#t-text').value.trim(); if (!text) return; save([...org.todos, { id: uidLocal(), text, due: main.querySelector('#t-due').value, kidId: main.querySelector('#t-kid').value, done: false }]); };
  main.querySelectorAll('[data-t]').forEach(c => c.onchange = () => save(org.todos.map(x => (x.id === c.dataset.t ? { ...x, done: c.checked, doneAt: c.checked ? new Date().toISOString() : '' } : x))));
  main.querySelectorAll('[data-del]').forEach(b => b.onclick = () => save(org.todos.filter(x => x.id !== b.dataset.del)));
}

// ---------- Abrechnung ----------
export function renderBilling(main) {
  C.S.billMonth ||= todayIso().slice(0, 7);
  const ym = C.S.billMonth, org = C.S.org;
  const rows = C.S.kids.map(k => {
    const ls = (k.lessons || []).filter(l => l.date.startsWith(ym) && LESSON_STATUS[l.status]?.bill).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const rate = lessonRate({ profile: { rate: k.rate } }, org);
    return { k, ls, rate, sum: ls.length * rate, paid: ls.filter(l => l.paid).length * rate };
  }).filter(r => r.ls.length);
  const total = rows.reduce((a, r) => a + r.sum, 0), paid = rows.reduce((a, r) => a + r.paid, 0);
  const shift = n => { const d = parseDay(ym + '-01'); d.setMonth(d.getMonth() + n); C.S.billMonth = isoDay(d).slice(0, 7); renderBilling(main); };
  main.innerHTML = `
    <div class="page-head"><h1>💶 Abrechnung</h1><div class="row"><button class="btn" id="csv">📤 Export (CSV)</button></div></div>
    <div class="cal-nav row"><button class="btn small" id="prev" aria-label="Voriger Monat">←</button><b>${monthName(ym)}</b><button class="btn small" id="next" aria-label="Nächster Monat">→</button></div>
    <div class="stats"><div class="stat"><div class="v">${money(total)}</div><div class="l">Honorar ${monthName(ym)}</div></div>
      <div class="stat"><div class="v">${money(paid)}</div><div class="l">bezahlt</div></div>
      <div class="stat"><div class="v">${money(total - paid)}</div><div class="l">offen</div></div>
      <div class="stat"><div class="v">${rows.reduce((a, r) => a + r.ls.length, 0)}</div><div class="l">verrechenbare Einheiten</div></div></div>
    ${rows.length ? rows.map(r => `<div class="card bill">
      <div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(r.k.avatar)} ${esc(r.k.name)}</h2>
        <span><b>${money(r.sum)}</b> · ${r.ls.length} × ${money(r.rate)} ${r.paid >= r.sum ? '<span class="tag good">bezahlt</span>' : `<span class="tag warn">offen ${money(r.sum - r.paid)}</span>`}</span></div>
      <table class="resp"><tbody>${r.ls.map(l => `<tr><td>${fmtShort(l.date)} ${l.time}</td><td>${statusTag(l)}</td><td>${esc(l.content ? l.content.slice(0, 60) : '')}</td><td><label class="switch"><input type="checkbox" data-paid="${l.id}" data-kid="${r.k.id}" ${l.paid ? 'checked' : ''}> bezahlt</label></td></tr>`).join('')}</tbody></table>
      <div class="row"><button class="btn small" data-note="${r.k.id}">📄 Honorarnote</button>${r.paid < r.sum ? `<button class="btn small" data-allpaid="${r.k.id}">✓ Alle als bezahlt</button>` : ''}</div>
    </div>`).join('') : `<div class="card"><p class="muted">In diesem Monat gibt es keine verrechenbaren Einheiten. Einheiten werden verrechnet, sobald ein Termin im Kalender auf „Gehalten“ oder „Kurzfristig abgesagt“ steht.</p></div>`}
    <div class="card"><h2>⚙️ Einstellungen für die Abrechnung</h2>
      <form id="bf" class="form-grid">
        <div class="field"><label for="b-rate">Standard-Honorar pro Einheit (€)</label><input id="b-rate" type="number" min="0" step="0.5" value="${org.rate}"></div>
        <div class="field"><label for="b-unit">Bezeichnung der Einheit</label><input id="b-unit" type="text" maxlength="60" value="${esc(org.unit)}"></div>
        <div class="field"><label for="b-iban">IBAN (für die Honorarnote)</label><input id="b-iban" type="text" maxlength="40" value="${esc(org.iban)}"></div>
        <div class="field" style="grid-column:1/-1"><label for="b-addr">Absender (Name, Adresse)</label><textarea id="b-addr" maxlength="300" style="min-height:70px">${esc(org.address)}</textarea></div>
        <div class="field" style="grid-column:1/-1"><label for="b-foot">Zusatztext (z. B. Hinweis zur Umsatzsteuer – bitte selbst prüfen)</label><input id="b-foot" type="text" maxlength="400" value="${esc(org.footer)}"></div>
        <div><button class="btn primary">Speichern</button></div>
      </form><p class="muted" style="margin-bottom:0">Ein abweichendes Honorar für ein einzelnes Kind stellst du im Profil des Kindes ein.</p></div>`;
  main.querySelector('#prev').onclick = () => shift(-1); main.querySelector('#next').onclick = () => shift(1);
  main.querySelectorAll('[data-paid]').forEach(c => c.onchange = async () => { await saveLessonFor(c.dataset.kid, list => list.map(l => (l.id === c.dataset.paid ? { ...l, paid: c.checked } : l))); renderBilling(main); });
  main.querySelectorAll('[data-allpaid]').forEach(b => b.onclick = async () => { await saveLessonFor(b.dataset.allpaid, list => list.map(l => (l.date.startsWith(ym) && LESSON_STATUS[l.status]?.bill ? { ...l, paid: true } : l))); C.toast('Als bezahlt markiert'); renderBilling(main); });
  main.querySelectorAll('[data-note]').forEach(b => b.onclick = () => { const r = rows.find(x => x.k.id === b.dataset.note); C.showCopy(`Honorarnote ${r.k.name}`, invoiceText(r, ym), 'Zum Einfügen in Word, eine E-Mail oder WhatsApp. Bitte vor dem Versand prüfen.'); });
  main.querySelector('#csv').onclick = () => {
    const lines = [['Datum', 'Uhrzeit', 'Kind', 'Status', 'Honorar', 'Bezahlt', 'Inhalt'].join(';'), ...rows.flatMap(r => r.ls.map(l => [fmtShort(l.date), l.time, r.k.name, LESSON_STATUS[l.status].label, String(r.rate).replace('.', ','), l.paid ? 'ja' : 'nein', `"${(l.content || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`].join(';')))];
    saveText(`lerniversum-abrechnung-${ym}.csv`, '﻿' + lines.join('\r\n'), 'Abrechnung');
  };
  main.querySelector('#bf').onsubmit = async e => {
    e.preventDefault();
    await saveOrg({ rate: Number(main.querySelector('#b-rate').value) || 0, unit: main.querySelector('#b-unit').value, iban: main.querySelector('#b-iban').value, address: main.querySelector('#b-addr').value, footer: main.querySelector('#b-foot').value });
    C.toast('Gespeichert'); renderBilling(main);
  };
}
function invoiceText(r, ym) {
  const org = C.S.org, s = C.S.settings;
  const parent = r.k.parent ? r.k.parent : '';
  return [org.address || s.practiceName || APP_NAME, '', `HONORARNOTE – ${monthName(ym)}`, `Datum: ${fmtShort(todayIso())}`, parent ? `An: ${parent}` : '', `Lerncoaching für: ${r.k.name}`, '',
    ...r.ls.map(l => `${fmtShort(l.date)}  ${org.unit}${l.status === 'kurzfristig' ? ' (kurzfristig abgesagt)' : ''}  ${money(r.rate)}`), '',
    `Gesamt: ${money(r.sum)}`, r.paid ? `Bereits bezahlt: ${money(r.paid)}\nOffen: ${money(r.sum - r.paid)}` : '', '',
    org.iban ? `Bitte überweisen Sie den Betrag auf: ${org.iban}` : '', org.footer || '', '', `Vielen Dank! ${s.coachName || ''}`].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n');
}

// ---------- Datensicherung ----------
export function renderBackup(main) {
  const lb = C.S.org?.lastBackup;
  main.innerHTML = `
    <div class="page-head"><h1>💾 Datensicherung</h1></div>
    <div class="card"><h2>Sicherung herunterladen</h2>
      <p>Speichert alle Kinder, Fortschritte, Termine, Protokolle, Aufgaben und Einstellungen in einer Datei. Bewahre sie sicher auf – sie enthält personenbezogene Daten der Kinder.</p>
      <p class="muted">Letzte Sicherung: ${lb ? new Date(lb).toLocaleString('de-AT') : 'noch nie'}</p>
      <button class="btn primary" id="exp">⬇ Sicherung speichern</button></div>
    <div class="card"><h2>Sicherung wiederherstellen</h2>
      <p>Ersetzt <b>alle</b> aktuellen Daten durch die Daten aus der Sicherung (z. B. auf einem neuen Gerät oder nach einem Fehler).</p>
      <input type="file" id="imp" accept=".json,application/json"><p class="err" id="imp-err"></p></div>`;
  main.querySelector('#exp').onclick = async () => {
    const data = C.S.lite ? await C.api('/api/coach/backup') : await (await fetch('/api/coach/export', { headers: { Authorization: 'Bearer ' + C.S.token } })).json();
    await saveText(`lerniversum-sicherung-${todayIso()}.json`, JSON.stringify(data, null, 1), 'Sicherung');
    await loadOrg(); renderBackup(main);
  };
  main.querySelector('#imp').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.kids)) throw new Error('Das ist keine gültige Lerniversum-Sicherung.');
      if (!await C.ask(`Sicherung vom ${data.exportedAt ? new Date(data.exportedAt).toLocaleString('de-AT') : '?'} mit ${data.kids.length} Kindern wiederherstellen? Alle aktuellen Daten werden ersetzt.`, { okLabel: 'Wiederherstellen', danger: true })) return;
      const r = await C.api('/api/coach/restore', { method: 'POST', body: { data } });
      await C.refreshKids(); await loadOrg(); C.toast(`Wiederhergestellt: ${r.kids} Kinder`); C.S.view = 'overview'; C.render();
    } catch (x) { main.querySelector('#imp-err').textContent = x.message || 'Datei konnte nicht gelesen werden.'; }
  };
}

// ---------- Kind: Datenblatt (Profil) ----------
const fld = (id, label, val, attrs = '', wide = false) => `<div class="field" ${wide ? 'style="grid-column:1/-1"' : ''}><label for="${id}">${label}</label><input id="${id}" type="text" value="${esc(val ?? '')}" ${attrs}></div>`;
/** Formular-Abschnitte des Datenblatts – genutzt beim Anlegen und im Profil */
export function datasheetHtml(p = {}, { open = true } = {}) {
  return `
    <fieldset class="ds"><legend>🎒 Schule</legend><div class="form-grid">
      <div class="field"><label for="p-stufe">Klasse / Schulstufe <span class="req">wichtig</span></label><select id="p-stufe"><option value="">– bitte wählen –</option>${SCHULSTUFEN.map(x => `<option value="${x.n}" ${String(p.stufe) === String(x.n) ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></div>
      <div class="field"><label for="p-stype">Schulform</label><select id="p-stype"><option value="">–</option>${SCHULFORMEN.map(x => `<option ${p.schoolType === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      ${fld('p-school', 'Schule (Name, Ort)', p.school, 'maxlength="80" placeholder="z. B. VS Musterstraße, Wien"')}
      ${fld('p-grade', 'Klasse (Bezeichnung)', p.grade, 'maxlength="20" placeholder="z. B. 3b"')}
      ${fld('p-teacher', 'Lehrer/in', p.teacher, 'maxlength="80"')}
    </div><p class="muted ds-hint">Die Klasse wird auch in den Link des Kindes übernommen: Der Einstufungstest startet dann auf dem passenden Niveau.</p></fieldset>
    <details class="ds" ${open ? 'open' : ''}><summary>👧 Kind</summary><div class="form-grid">
      ${fld('p-last', 'Nachname des Kindes', p.lastName, 'maxlength="60"')}
      <div class="field"><label for="p-birth">Geburtsdatum</label><input id="p-birth" type="date" value="${p.birth || ''}"></div>
      ${fld('p-address', 'Adresse des Kindes', p.address, 'maxlength="200" placeholder="Straße, PLZ Ort"', true)}
    </div></details>
    <details class="ds" ${open ? 'open' : ''}><summary>👪 Eltern / Erziehungsberechtigte</summary><div class="form-grid">
      ${fld('p-parent', 'Name Elternteil 1', p.parent, 'maxlength="80"')}
      ${fld('p-phone', 'Telefon Elternteil 1', p.phone, 'maxlength="40" inputmode="tel" placeholder="z. B. 0664 1234567"')}
      ${fld('p-parent2', 'Name Elternteil 2', p.parent2, 'maxlength="80"')}
      ${fld('p-phone2', 'Telefon Elternteil 2', p.phone2, 'maxlength="40" inputmode="tel"')}
      ${fld('p-email', 'E-Mail', p.email, 'maxlength="120" inputmode="email"')}
      <div class="field" style="grid-column:1/-1"><label class="switch"><input type="checkbox" id="p-same" ${!p.parentAddress ? 'checked' : ''}> Eltern wohnen an derselben Adresse wie das Kind</label></div>
      <div class="field ${!p.parentAddress ? 'hidden' : ''}" id="p-paddr-f" style="grid-column:1/-1"><label for="p-paddr">Adresse der Eltern</label><input id="p-paddr" type="text" maxlength="200" value="${esc(p.parentAddress || '')}"></div>
    </div></details>
    <details class="ds" ${open ? 'open' : ''}><summary>💶 Bezahlung</summary><div class="form-grid">
      <div class="field"><label for="p-pay">Zahlungsart</label><select id="p-pay"><option value="">–</option>${PAY_METHODS.map(x => `<option ${p.payMethod === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
      <div class="field"><label for="p-rate">Honorar pro Einheit (€)</label><input id="p-rate" type="number" min="0" step="0.5" value="${p.rate ?? ''}" placeholder="Standard: ${C.S.org?.rate ?? ''} €"></div>
      ${fld('p-iban', 'IBAN der Eltern', p.iban, 'maxlength="40" autocomplete="off" placeholder="AT.."')}
      ${fld('p-holder', 'Kontoinhaber/in', p.accountHolder, 'maxlength="80"')}
      ${fld('p-invoice', 'Rechnung an (falls abweichend)', p.invoiceTo, 'maxlength="200" placeholder="Name, Adresse"', true)}
    </div><p class="err" id="p-iban-e"></p></details>
    <details class="ds" ${open ? 'open' : ''}><summary>🧩 Förderung</summary><div class="form-grid">
      <div class="field"><label for="p-since">Im Coaching seit</label><input id="p-since" type="date" value="${p.since || ''}"></div>
      <div class="field" style="grid-column:1/-1"><label>Förderschwerpunkte</label><div class="chips">${FOCUS.map(f => `<label class="chip-check"><input type="checkbox" value="${esc(f)}" ${(p.focus || []).includes(f) ? 'checked' : ''}> ${esc(f)}</label>`).join('')}</div></div>
      <div class="field" style="grid-column:1/-1"><label for="p-notes">Weitere Infos (Diagnosen, Befunde, Besonderheiten)</label><textarea id="p-notes" maxlength="1000" style="min-height:70px">${esc(p.notes || '')}</textarea></div>
      <div class="field" style="grid-column:1/-1"><label class="switch"><input type="checkbox" id="p-consent" ${p.consent ? 'checked' : ''}> Einverständnis der Eltern zur Datenverarbeitung liegt vor</label></div>
    </div></details>`;
}
/** IBAN-Prüfung (Prüfziffer nach ISO 13616); leer ist erlaubt */
export function ibanOk(raw) {
  const v = String(raw || '').replace(/\s+/g, '').toUpperCase(); if (!v) return true;
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(v)) return false;
  const r = (v.slice(4) + v.slice(0, 4)).replace(/[A-Z]/g, c => c.charCodeAt(0) - 55);
  let m = 0; for (const d of r) m = (m * 10 + Number(d)) % 97; return m === 1;
}
export const fmtIban = v => String(v || '').replace(/\s+/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();
export function bindDatasheet(el) {
  const same = el.querySelector('#p-same');
  same.onchange = () => { el.querySelector('#p-paddr-f').classList.toggle('hidden', same.checked); if (same.checked) el.querySelector('#p-paddr').value = ''; };
  const ib = el.querySelector('#p-iban');
  ib.onblur = () => { ib.value = fmtIban(ib.value); el.querySelector('#p-iban-e').textContent = ibanOk(ib.value) ? '' : 'Diese IBAN scheint nicht zu stimmen – bitte prüfen.'; };
}
export function readDatasheet(el, base = {}) {
  const v = id => el.querySelector(id)?.value ?? '';
  return { ...base, stufe: v('#p-stufe'), schoolType: v('#p-stype'), school: v('#p-school'), grade: v('#p-grade'), teacher: v('#p-teacher'),
    lastName: v('#p-last'), birth: v('#p-birth'), address: v('#p-address'),
    parent: v('#p-parent'), phone: v('#p-phone'), parent2: v('#p-parent2'), phone2: v('#p-phone2'), email: v('#p-email'),
    parentAddress: el.querySelector('#p-same')?.checked ? '' : v('#p-paddr'),
    payMethod: v('#p-pay'), rate: v('#p-rate'), iban: fmtIban(v('#p-iban')), accountHolder: v('#p-holder'), invoiceTo: v('#p-invoice'),
    since: v('#p-since'), focus: [...el.querySelectorAll('.chips input:checked')].map(i => i.value), notes: v('#p-notes'), consent: !!el.querySelector('#p-consent')?.checked };
}
export function tabProfile(el, k) {
  const p = k.profile || {};
  const quick = [[p.phone, '📞'], [p.phone2, '📞'], [p.email, '✉️'], [p.iban, '🏦']].filter(([x]) => x);
  el.innerHTML = `<div class="card"><h2>👤 Datenblatt von ${esc(k.name)}${p.lastName ? ' ' + esc(p.lastName) : ''}</h2>
    ${quick.length ? `<p class="muted">Schnell kopieren: ${quick.map(([x, i]) => `<button class="btn small" data-copy="${esc(x)}">${i} ${esc(x)}</button>`).join(' ')}</p>` : ''}
    <form id="pf">${datasheetHtml(p)}
      <div class="row" style="margin-top:12px"><button class="btn primary">Speichern</button> <span class="muted" id="p-st"></span></div>
    </form>
    <p class="muted" style="margin-bottom:0">🔒 Datenschutz: Diese Angaben sind nur für dich sichtbar. In die Kinder-App bzw. den Link kommt nur die Klassenstufe (für den Einstufungstest) – keine Namen, Adressen oder Bankdaten.</p></div>`;
  el.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => C.copyText(b.dataset.copy));
  bindDatasheet(el);
  el.querySelector('#pf').onsubmit = async e => {
    e.preventDefault();
    await C.patchKid({ profile: readDatasheet(el) });
    el.querySelector('#p-st').textContent = '✓ Gespeichert' + (C.S.lite && String(p.stufe ?? '') !== String(C.S.kid.profile?.stufe ?? '') ? ' – Klasse geändert: bitte den Eltern einen neuen Link schicken (🔗 Link für Eltern).' : '');
  };
}

// ---------- Kind: Förderziele ----------
export function tabGoals(el, k) {
  const goals = [...(k.goals || [])];
  const top = Object.entries((k.errors || []).filter(e => (Date.now() - Date.parse(e.ts)) / 864e5 < 60).reduce((a, e) => ((a[e.type] = (a[e.type] || 0) + 1), a), {}))
    .filter(([t]) => t !== 'sonstiges').sort((a, b) => b[1] - a[1]).slice(0, 4);
  const suggest = top.map(([t]) => ({ text: `${ERROR_TYPES[t]?.label || t}: sicherer werden`, area: ERROR_TYPES[t]?.area === 'zahlen' ? 'Mathe' : 'Deutsch' })).filter(s => !goals.some(g => g.text === s.text));
  el.innerHTML = `<div class="card"><h2>🎯 Förderziele</h2>
      <p class="muted" style="margin-top:-6px">Halte fest, woran ihr arbeitet. Der Status erscheint auch im Elternbericht.</p>
      ${goals.length ? `<ul class="goal-list">${goals.map(g => `<li class="goal g-${g.status}">
        <select data-st="${g.id}" aria-label="Status">${Object.entries(GOAL_STATUS).map(([s, l]) => `<option value="${s}" ${s === g.status ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <span class="goal-t"><b>${esc(g.text)}</b><small>${esc(g.area)} · seit ${fmtShort(g.created)}${g.done ? ' · erreicht am ' + fmtShort(g.done) : ''}</small></span>
        <button class="btn small" data-del="${g.id}" aria-label="Ziel löschen">✕</button></li>`).join('')}</ul>` : '<p class="muted">Noch keine Förderziele.</p>'}
      <form id="gf" class="row" style="margin-top:12px"><input type="text" id="g-text" maxlength="200" placeholder="z. B. Zehnerübergang ohne Abzählen" style="flex:1;min-width:220px" required>
        <select id="g-area" style="width:auto"><option>Mathe</option><option>Deutsch</option><option>Allgemein</option></select><button class="btn primary">+ Ziel</button></form>
    </div>
    ${suggest.length ? `<div class="card"><h2>💡 Vorschläge aus dem Fehler-Radar</h2><p class="muted" style="margin-top:-6px">Häufigste Fehlermuster der letzten 60 Tage:</p>
      <div class="templates">${suggest.map((s, i) => `<button class="btn small" data-sug="${i}">+ ${esc(s.text)}</button>`).join('')}</div></div>` : ''}`;
  const save = async list => { await C.patchKid({ goals: list }); tabGoals(el, C.S.kid); };
  el.querySelector('#gf').onsubmit = e => { e.preventDefault(); save([...goals, { id: uidLocal(), text: el.querySelector('#g-text').value.trim(), area: el.querySelector('#g-area').value, status: 'offen', created: todayIso() }]); };
  el.querySelectorAll('[data-sug]').forEach(b => b.onclick = () => { const s = suggest[b.dataset.sug]; save([...goals, { id: uidLocal(), ...s, status: 'arbeit', created: todayIso() }]); });
  el.querySelectorAll('[data-st]').forEach(s => s.onchange = () => save(goals.map(g => (g.id === s.dataset.st ? { ...g, status: s.value, done: s.value === 'erreicht' ? todayIso() : '' } : g))));
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (await C.ask('Dieses Ziel löschen?', { okLabel: 'Löschen', danger: true })) save(goals.filter(g => g.id !== b.dataset.del)); });
}

// ---------- Kind: Stunden ----------
export function tabLessons(el, k) {
  const t = todayIso(), ls = [...(k.lessons || [])].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const upcoming = ls.filter(l => l.date >= t && l.status === 'geplant').reverse(), past = ls.filter(l => !(l.date >= t && l.status === 'geplant'));
  const held = ls.filter(l => l.status === 'gehalten').length, open = ls.filter(l => LESSON_STATUS[l.status]?.bill && !l.paid).length;
  const row = l => `<tr class="click" data-ev="${l.id}"><td>${fmtDay(l.date)} ${l.time}</td><td>${statusTag(l)}</td><td>${esc((l.content || '').slice(0, 80)) || (l.status === 'gehalten' ? '<span class="muted">Protokoll fehlt</span>' : '')}</td><td>${LESSON_STATUS[l.status]?.bill ? (l.paid ? '<span class="tag good">bezahlt</span>' : '<span class="tag warn">offen</span>') : ''}</td></tr>`;
  el.innerHTML = `
    <div class="stats"><div class="stat"><div class="v">${held}</div><div class="l">gehaltene Stunden</div></div><div class="stat"><div class="v">${upcoming.length}</div><div class="l">geplante Termine</div></div><div class="stat"><div class="v">${open}</div><div class="l">unbezahlte Einheiten</div></div></div>
    <div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">🗓️ Termine & Protokolle</h2><button class="btn primary" id="new">+ Termin</button></div>
      ${upcoming.length ? `<h3>Demnächst</h3><table class="resp"><tbody>${upcoming.map(row).join('')}</tbody></table>` : ''}
      ${past.length ? `<h3>Vergangene Stunden</h3><table class="resp"><tbody>${past.slice(0, 40).map(row).join('')}</tbody></table>` : ''}
      ${ls.length ? '' : '<p class="muted">Noch keine Termine. Lege einen Termin an – auch wöchentlich wiederkehrend.</p>'}</div>`;
  const reload = () => tabLessons(el, C.S.kid);
  el.querySelector('#new').onclick = () => lessonDialog({ kidId: k.id, date: t }, reload);
  el.querySelectorAll('[data-ev]').forEach(r => r.onclick = () => lessonDialog({ ...(k.lessons || []).find(l => l.id === r.dataset.ev), kidId: k.id }, reload));
}

// Für den Elternbericht
export function goalsReportHtml(k) {
  const g = k.goals || [];
  if (!g.length) return '';
  return `<h3>🎯 Unsere Förderziele</h3><ul>${g.map(x => `<li>${esc(x.text)} – <b>${x.status === 'erreicht' ? 'erreicht ✓' : x.status === 'arbeit' ? 'daran arbeiten wir' : 'kommt als Nächstes'}</b></li>`).join('')}</ul>`;
}
