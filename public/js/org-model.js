// Datenmodell für die Organisation der Coachin: Kind-Profil, Förderziele, Stunden (Termine +
// Protokoll + Abrechnung), Aufgaben und Praxis-Einstellungen. Von Server UND Web-App genutzt,
// damit überall dieselben Prüfungen gelten.

const str = (v, n) => String(v ?? '').slice(0, n);
const isDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
const isTime = v => /^\d{2}:\d{2}$/.test(v || '');
export const uidLocal = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const FOCUS = ['Legasthenie / LRS', 'Dyskalkulie', 'Konzentration', 'Lernangst', 'Deutsch als Zweitsprache', 'Lesen', 'Rechtschreibung', 'Rechnen'];
export const LESSON_STATUS = {
  geplant: { label: 'Geplant', bill: false },
  gehalten: { label: 'Gehalten', bill: true },
  abgesagt: { label: 'Abgesagt', bill: false },
  kurzfristig: { label: 'Kurzfristig abgesagt (verrechnet)', bill: true },
};
export const GOAL_STATUS = { offen: '○ Offen', arbeit: '◐ In Arbeit', erreicht: '● Erreicht' };
export const PLACES = ['Praxis', 'Online', 'Hausbesuch', 'Schule'];
export const PAY_METHODS = ['Überweisung', 'Bar', 'SEPA-Lastschrift', 'Gutschein / Förderung', 'Sonstiges'];

export function cleanProfile(p = {}) {
  return {
    parent: str(p.parent, 80), phone: str(p.phone, 40), email: str(p.email, 120), school: str(p.school, 80), grade: str(p.grade, 20),
    // Datenblatt
    lastName: str(p.lastName, 60), birth: isDate(p.birth) ? p.birth : '',
    stufe: p.stufe === '' || p.stufe == null || !(Number(p.stufe) >= 0 && Number(p.stufe) <= 8) ? '' : Math.round(Number(p.stufe)),
    schoolType: str(p.schoolType, 40), teacher: str(p.teacher, 80),
    address: str(p.address, 200), parentAddress: str(p.parentAddress, 200),
    parent2: str(p.parent2, 80), phone2: str(p.phone2, 40),
    payMethod: PAY_METHODS.includes(p.payMethod) ? p.payMethod : '', iban: str(p.iban, 40).toUpperCase(), accountHolder: str(p.accountHolder, 80),
    invoiceTo: str(p.invoiceTo, 200), notes: str(p.notes, 1000),
    focus: (Array.isArray(p.focus) ? p.focus : []).filter(f => FOCUS.includes(f)),
    since: isDate(p.since) ? p.since : '', rate: p.rate === '' || p.rate == null ? '' : Math.max(0, Math.min(1000, Number(p.rate) || 0)),
    consent: !!p.consent,
  };
}
export function cleanGoals(list = []) {
  return (Array.isArray(list) ? list : []).slice(0, 40).map(g => ({
    id: str(g.id || uidLocal(), 20), text: str(g.text, 200).trim(), area: ['Mathe', 'Deutsch', 'Allgemein'].includes(g.area) ? g.area : 'Allgemein',
    status: GOAL_STATUS[g.status] ? g.status : 'offen', created: isDate(g.created) ? g.created : new Date().toISOString().slice(0, 10), done: isDate(g.done) ? g.done : '',
  })).filter(g => g.text);
}
export function cleanLesson(l = {}) {
  return {
    id: str(l.id || uidLocal(), 20), date: isDate(l.date) ? l.date : new Date().toISOString().slice(0, 10), time: isTime(l.time) ? l.time : '14:00',
    dur: Math.max(10, Math.min(240, Number(l.dur) || 50)), place: PLACES.includes(l.place) ? l.place : 'Praxis',
    status: LESSON_STATUS[l.status] ? l.status : 'geplant', paid: !!l.paid, series: str(l.series, 20), title: str(l.title, 80),
    content: str(l.content, 2000), observation: str(l.observation, 2000), homework: str(l.homework, 1000),
  };
}
export const cleanLessons = (list = []) => (Array.isArray(list) ? list : []).slice(-400).map(cleanLesson);
export function cleanOrg(o = {}) {
  return {
    rate: Math.max(0, Math.min(1000, Number(o.rate) || 0)), unit: str(o.unit || 'Einheit (50 Min.)', 60),
    iban: str(o.iban, 40), address: str(o.address, 300), footer: str(o.footer, 400), lastBackup: str(o.lastBackup, 30),
    todos: (Array.isArray(o.todos) ? o.todos : []).slice(-300).map(t => ({ id: str(t.id || uidLocal(), 20), text: str(t.text, 200).trim(), due: isDate(t.due) ? t.due : '', kidId: str(t.kidId, 30), done: !!t.done, doneAt: str(t.doneAt, 30) })).filter(t => t.text),
    events: (Array.isArray(o.events) ? o.events : []).slice(-300).map(cleanLesson), // Termine ohne Kind (Erstgespräch, Elternabend …)
  };
}
export const lessonRate = (kid, org) => (kid?.profile?.rate !== '' && kid?.profile?.rate != null ? Number(kid.profile.rate) : Number(org?.rate) || 0);

// ---------- Kommunikation (WhatsApp / E-Mail) ----------
/** Telefonnummer ins internationale Format für WhatsApp (Österreich als Standard: 0664… -> 43664…) */
export function intlPhone(raw, cc = '43') {
  let d = String(raw || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1); else if (d.startsWith('00')) d = d.slice(2); else if (d.startsWith('0')) d = cc + d.slice(1);
  return /^\d{8,15}$/.test(d) ? d : '';
}
export const waLink = (phone, text) => { const p = intlPhone(phone); return p ? `https://wa.me/${p}?text=${encodeURIComponent(text)}` : ''; };
export const mailLink = (to, subject, body) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to || '') ? `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : '');
export const cleanContactLog = (list = []) => (Array.isArray(list) ? list : []).slice(-300).map(x => ({
  ts: String(x.ts || new Date().toISOString()).slice(0, 30), dir: x.dir === 'in' ? 'in' : 'out', via: ['whatsapp', 'email', 'kopiert', 'telefon', 'persönlich', 'funkspruch'].includes(x.via) ? x.via : 'kopiert', text: String(x.text || '').slice(0, 2000),
})).filter(x => x.text);
/** Gesamter Nachrichtenverlauf eines Kindes (Eltern-Kontakte + Funksprüche ans Kind), neueste zuerst */
export const contactTimeline = k => [...(k.contactLog || []), ...(k.messages || []).map(m => ({ ts: m.ts, dir: 'out', via: 'funkspruch', text: m.text, read: m.read }))]
  .filter(x => x.ts && x.text).sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
