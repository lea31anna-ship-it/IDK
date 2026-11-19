// PIN-Sperre für den Coach-Bereich (zusätzlich zur Anmeldung über das Claude-Konto).
// Gespeichert wird nur ein PBKDF2-Hash von PIN und Wiederherstellungs-Code – nie der PIN selbst.
import { APP_NAME } from './curriculum.js';

const ITER = 120000;
const B32 = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const randHex = n => hex(crypto.getRandomValues(new Uint8Array(n)));

export async function hashSecret(secret, salt, iter = ITER) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: iter }, key, 256));
}
function recoveryCode() {
  const b = crypto.getRandomValues(new Uint8Array(10));
  const s = [...b].map(x => B32[x & 31]).join('');
  return `${s.slice(0, 5)}-${s.slice(5)}`;
}
const normRec = s => String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
export async function makePinRecord(pin, recovery) {
  const salt = randHex(16), rsalt = randHex(16);
  return { v: 1, iter: ITER, len: pin.length, salt, hash: await hashSecret(pin, salt), rsalt, rhash: await hashSecret(normRec(recovery), rsalt), setAt: new Date().toISOString() };
}
export async function checkPin(pin, rec) { return !!rec && (await hashSecret(pin, rec.salt, rec.iter)) === rec.hash; }
export async function checkRecovery(code, rec) { return !!rec && (await hashSecret(normRec(code), rec.rsalt, rec.iter)) === rec.rhash; }

// Sperre nach Fehlversuchen: 5 Versuche, dann 5 Minuten (verdoppelt sich bei weiteren Fehlern)
const LOCK_KEY = 'lv_pin_lock';
const readLock = () => { try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || { fails: 0, until: 0, rounds: 0 }; } catch { return mem; } };
let mem = { fails: 0, until: 0, rounds: 0 };
const writeLock = v => { mem = v; try { localStorage.setItem(LOCK_KEY, JSON.stringify(v)); } catch { } };
function registerFail() {
  const l = readLock(); l.fails++;
  if (l.fails >= 5) { l.rounds++; l.until = Date.now() + 5 * 60000 * 2 ** (l.rounds - 1); l.fails = 0; }
  writeLock(l); return l;
}
const clearLock = () => writeLock({ fails: 0, until: 0, rounds: 0 });

// ---------- Oberfläche ----------
function pad(host, { title, sub, minLen = 4, maxLen = 6, autoLen = null, onDone, extra = '' }) {
  let val = '';
  host.innerHTML = `
    <div class="pin-wrap">
      <div class="pin-card card">
        <div class="brand" style="justify-content:center">🪐 ${esc(APP_NAME)} <small>Coach-Bereich</small></div>
        <h1 class="pin-title">${title}</h1>
        <p class="muted pin-sub">${sub}</p>
        <div class="pin-dots" aria-live="polite">${Array.from({ length: autoLen || maxLen }, () => '<span></span>').join('')}</div>
        <p class="err pin-err" role="alert"></p>
        <div class="pin-pad">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-d="${n}">${n}</button>`).join('')}
          <button type="button" data-a="del" aria-label="Löschen">⌫</button><button type="button" data-d="0">0</button>
          <button type="button" data-a="ok" class="ok" aria-label="Bestätigen">✓</button>
        </div>
        ${extra}
      </div>
    </div>`;
  const dots = host.querySelectorAll('.pin-dots span'), err = host.querySelector('.pin-err');
  const draw = () => dots.forEach((d, i) => d.classList.toggle('on', i < val.length));
  const submit = async () => {
    if (val.length < minLen) { err.textContent = `Bitte mindestens ${minLen} Ziffern eingeben.`; return; }
    const v = val; val = ''; draw();
    const msg = await onDone(v);
    if (msg) { err.textContent = msg; host.querySelector('.pin-dots').classList.remove('shake'); void host.offsetWidth; host.querySelector('.pin-dots').classList.add('shake'); }
  };
  const press = d => { err.textContent = ''; if (val.length < maxLen) { val += d; draw(); } if (autoLen && val.length === autoLen) setTimeout(submit, 120); };
  host.querySelectorAll('[data-d]').forEach(b => b.onclick = () => press(b.dataset.d));
  host.querySelector('[data-a=del]').onclick = () => { val = val.slice(0, -1); draw(); };
  host.querySelector('[data-a=ok]').onclick = submit;
  const onKey = e => {
    if (!host.isConnected) { document.removeEventListener('keydown', onKey); return; }
    if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') { val = val.slice(0, -1); draw(); } else if (e.key === 'Enter') submit();
  };
  document.addEventListener('keydown', onKey);
  host.querySelector('[data-d="1"]').focus();
}

function setFlow(host, store, { reason = '' } = {}) {
  return new Promise(resolve => {
    let first = null;
    const ask1 = () => pad(host, {
      title: 'PIN festlegen', sub: `${reason}Wähle einen PIN mit 4 bis 6 Ziffern. Damit schützt du den Coach-Bereich, z. B. wenn ein Kind dein Tablet benutzt.`,
      onDone: async v => { if (/^(\d)\1+$/.test(v) || '0123456789'.includes(v) || '9876543210'.includes(v)) return 'Bitte keinen zu einfachen PIN (z. B. 1111 oder 1234).'; first = v; ask2(); },
    });
    const ask2 = () => pad(host, {
      title: 'PIN wiederholen', sub: 'Zur Sicherheit noch einmal eingeben.', autoLen: first.length,
      onDone: async v => { if (v !== first) { first = null; setTimeout(ask1, 900); return 'Die PINs stimmen nicht überein. Nochmal von vorn.'; } await save(v); },
    });
    const save = async pin => {
      const code = recoveryCode();
      await store.putPin(await makePinRecord(pin, code));
      clearLock();
      host.innerHTML = `<div class="pin-wrap"><div class="pin-card card">
        <h1 class="pin-title">✓ PIN gespeichert</h1>
        <p>Dein <strong>Wiederherstellungs-Code</strong>, falls du den PIN einmal vergisst:</p>
        <p class="pin-recovery">${code}</p>
        <p class="muted">Schreib ihn auf und bewahre ihn sicher auf (nicht auf dem Tablet der Kinder). Er wird nur jetzt angezeigt.</p>
        <label class="switch"><input type="checkbox" id="noted"> Ich habe den Code notiert</label>
        <div class="row" style="margin-top:14px"><button class="btn primary" id="go" disabled>Weiter zum Coach-Bereich</button></div>
      </div></div>`;
      host.querySelector('#noted').onchange = e => { host.querySelector('#go').disabled = !e.target.checked; };
      host.querySelector('#go').onclick = () => resolve(true);
    };
    ask1();
  });
}

function recoverFlow(host, store, rec) {
  return new Promise(resolve => {
    host.innerHTML = `<div class="pin-wrap"><div class="pin-card card">
      <h1 class="pin-title">PIN vergessen</h1>
      <p class="muted">Gib deinen Wiederherstellungs-Code ein (du hast ihn beim Festlegen des PINs bekommen).</p>
      <form id="rf"><div class="field"><input type="text" id="rc" autocomplete="off" spellcheck="false" placeholder="XXXXX-XXXXX" style="text-transform:uppercase;letter-spacing:.15em;text-align:center;font-size:1.2em"></div>
      <p class="err" id="re"></p>
      <div class="row"><button class="btn primary">Prüfen</button><button class="btn" type="button" id="back">Zurück</button></div></form>
    </div></div>`;
    host.querySelector('#rc').focus();
    host.querySelector('#back').onclick = () => resolve(false);
    host.querySelector('#rf').onsubmit = async e => {
      e.preventDefault();
      const l = readLock();
      if (l.until > Date.now()) { host.querySelector('#re').textContent = `Zu viele Versuche. Bitte warte bis ${new Date(l.until).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}.`; return; }
      if (await checkRecovery(host.querySelector('#rc').value, rec)) { clearLock(); resolve(await setFlow(host, store, { reason: 'Code stimmt! ' })); }
      else { registerFail(); host.querySelector('#re').textContent = 'Dieser Code stimmt nicht.'; }
    };
  });
}

/** Zeigt die PIN-Abfrage (oder beim ersten Mal das Festlegen). Löst true aus, sobald entsperrt. */
export async function pinGate(host, store) {
  let rec = await store.getPin();
  if (!rec) return setFlow(host, store);
  for (;;) {
    const ok = await new Promise(resolve => {
      const lockedMsg = l => `Zu viele falsche Versuche. Bitte warte bis ${new Date(l.until).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr.`;
      pad(host, {
        title: 'PIN eingeben', sub: 'Der Coach-Bereich ist mit deinem PIN geschützt.', autoLen: rec.len,
        extra: '<button type="button" class="btn small pin-forgot" id="forgot">PIN vergessen?</button>',
        onDone: async v => {
          const l = readLock();
          if (l.until > Date.now()) return lockedMsg(l);
          if (await checkPin(v, rec)) { clearLock(); resolve(true); return; }
          const n = registerFail();
          return n.until > Date.now() ? lockedMsg(n) : `Falscher PIN. Noch ${5 - n.fails} Versuche.`;
        },
      });
      const l = readLock();
      if (l.until > Date.now()) host.querySelector('.pin-err').textContent = lockedMsg(l);
      host.querySelector('#forgot').onclick = async () => resolve((await recoverFlow(host, store, rec)) ? true : null);
    });
    if (ok) return true;
    rec = await store.getPin();
  }
}

/** PIN ändern (aus den Einstellungen): alten PIN prüfen, dann neuen festlegen. */
export async function changePin(host, store) {
  const rec = await store.getPin();
  if (rec) {
    const ok = await new Promise(resolve => {
      pad(host, {
        title: 'Aktuellen PIN eingeben', sub: 'Danach legst du einen neuen PIN fest.', autoLen: rec.len,
        extra: '<button type="button" class="btn small pin-forgot" id="cancel">Abbrechen</button>',
        onDone: async v => {
          const l = readLock();
          if (l.until > Date.now()) return 'Zu viele falsche Versuche. Bitte später nochmal.';
          if (await checkPin(v, rec)) { clearLock(); resolve(true); return; }
          registerFail(); return 'Falscher PIN.';
        },
      });
      host.querySelector('#cancel').onclick = () => resolve(false);
    });
    if (!ok) return false;
  }
  return setFlow(host, store, { reason: 'Neuer PIN. ' });
}
