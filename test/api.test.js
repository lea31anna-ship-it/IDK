import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sh-'));
const { createServer, loadDb } = await import('../server.js');

test('kompletter Ablauf Coach ↔ Kind', async () => {
  loadDb();
  const srv = createServer().listen(0);
  const base = `http://localhost:${srv.address().port}`;
  const call = async (p, { method = 'GET', body, token, code } = {}) => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    if (code) h['X-Kid-Code'] = code;
    const r = await fetch(base + p, { method, headers: h, body: body && JSON.stringify(body) });
    return { status: r.status, data: await r.json() };
  };
  try {
    assert.equal((await call('/api/coach/kids')).status, 401);
    assert.equal((await call('/api/coach/setup', { method: 'POST', body: { password: 'kurz' } })).status, 400);
    const { data: { token } } = await call('/api/coach/setup', { method: 'POST', body: { password: 'geheimes-passwort' } });
    assert.ok(token);
    assert.equal((await call('/api/coach/setup', { method: 'POST', body: { password: 'nochmal-versuchen' } })).status, 403);
    assert.equal((await call('/api/coach/login', { method: 'POST', body: { password: 'falsch' } })).status, 401);

    const { data: kid } = await call('/api/coach/kids', { method: 'POST', token, body: { name: 'Mia', avatar: '🦊' } });
    assert.match(kid.code, /^[A-Z]+-\d{4}$/);
    await call(`/api/coach/kids/${kid.id}`, { method: 'PATCH', token, body: { unlocked: ['mal7', 'quatsch'], notes: 'geheim' } });
    await call(`/api/coach/kids/${kid.id}/messages`, { method: 'POST', token, body: { text: 'Toll gemacht!' } });

    const login = await call('/api/kid/login', { method: 'POST', body: { code: kid.code.toLowerCase().replace('-', ' ') } });
    assert.equal(login.status, 200);
    assert.deepEqual(login.data.unlocked, ['mal7']);
    assert.equal(login.data.notes, undefined, 'Notizen dürfen nicht beim Kind ankommen');
    assert.equal(login.data.messages.length, 1);

    const res = await call('/api/kid/result', { method: 'POST', code: kid.code, body: { planetId: 'mal7', correct: 9, total: 10, moodBefore: 2, tips: 1, durationSec: 120, errors: [{ task: '7 × 8', given: '49', expected: '56', type: 'nachbaraufgabe' }] } });
    assert.equal(res.data.progress.mal7.bestStars, 2);
    await call('/api/kid/mood', { method: 'POST', code: kid.code, body: { planetId: 'mal7', moodAfter: 4 } });
    await call('/api/kid/messages/read', { method: 'POST', code: kid.code, body: { ids: [login.data.messages[0].id] } });

    const { data: full } = await call(`/api/coach/kids/${kid.id}`, { token });
    assert.equal(full.sessions[0].moodAfter, 4);
    assert.equal(full.errors[0].type, 'nachbaraufgabe');
    assert.ok(full.messages[0].read);
    assert.equal((await call('/api/kid/me', { code: 'FALSCH-0000' })).status, 401);
    const stat = await fetch(base + '/../server.js');
    assert.notEqual(stat.status, 200);
  } finally { srv.close(); }
});
