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

export function cleanProfile(p = {}) {
  return {
    parent: str(p.parent, 80), phone: str(p.phone, 40), email: str(p.email, 120), school: str(p.school, 80), grade: str(p.grade, 20),
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
