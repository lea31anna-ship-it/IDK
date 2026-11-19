import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeKidCode, decodeKidCode, kidHash, parseKidHash, encodeReport, decodeReport, CODE_ORDER, encodeExtra, decodeExtra, linkExtra, unpackExtra } from '../public/js/codec.js';
import { PLANETS } from '../public/js/curriculum.js';

test('Codereihenfolge deckt alle Planeten ab', () => {
  for (const p of PLANETS) assert.ok(CODE_ORDER.includes(p.id), p.id);
  assert.equal(new Set(CODE_ORDER).size, CODE_ORDER.length);
});
test('Zugangscode hin und zurück', () => {
  const code = encodeKidCode({ name: 'Jürgen', id: 51234, avatar: 3, autoAdvance: false, unlocked: ['mengen', 'mal7', 'schreiben'] });
  assert.match(code, /^JUERGEN-[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{5}$/);
  const k = decodeKidCode(code.toLowerCase());
  assert.equal(k.name, 'Juergen'); assert.equal(k.id, 51234); assert.equal(k.avatar, '🦊'); assert.equal(k.autoAdvance, false);
  assert.deepEqual(k.unlocked, ['mengen', 'mal7', 'schreiben']);
  const typo = code.slice(0, -1) + (code.at(-1) === 'A' ? 'B' : 'A');
  assert.equal(decodeKidCode(typo), null, 'Tippfehler wird erkannt');
  const h = kidHash(code, 'Toll gemacht! 🌟 Übe die 7er-Reihe.');
  assert.match(h, /^k-[a-z]+-[0-9a-z]+-m[0-9a-z]+$/);
  const p = parseKidHash('#' + h);
  assert.equal(p.message, 'Toll gemacht! 🌟 Übe die 7er-Reihe.'); assert.equal(p.id, 51234);
  assert.equal(parseKidHash('#' + kidHash(code)).message, null);
});
test('langer Code für höhere Stufen', () => {
  const code = encodeKidCode({ name: 'Ela', id: 9, avatar: 1, unlocked: ['mengen', 'gleichung', 'komma'] });
  assert.match(code, /^ELA-X[2-9A-Z-]+$/, 'kompaktes v4-Format');
  assert.ok(code.length <= 28, 'Code bleibt kurz: ' + code);
  assert.deepEqual(decodeKidCode(code).unlocked, ['mengen', 'gleichung', 'komma']);
  assert.deepEqual(parseKidHash('#' + kidHash(code, 'Hi')).unlocked, ['mengen', 'gleichung', 'komma']);
});
test('Bericht hin und zurück', async () => {
  const kid = { id: 7, name: 'Mia', code: 'MIA-X', progress: { mal7: { bestStars: 2, attempts: 3, correct: 25, total: 30, lastPlayed: '2026-11-19T10:00:00.000Z' } },
    sessions: [{ ts: '2026-11-19T10:00:00.000Z', planetId: 'mal7', correct: 9, total: 10, moodBefore: 2, moodAfter: 4, tips: 1, durationSec: 100 }],
    errors: [{ ts: '2026-11-19T10:00:00.000Z', planetId: 'mal7', type: 'nachbaraufgabe', task: '7 × 8', given: '49', expected: '56' }] };
  const txt = await encodeReport(kid);
  const r = await decodeReport('Bericht von Mia: ' + txt + ' danke');
  assert.equal(r.progress.mal7.bestStars, 2); assert.equal(r.sessions[0].moodAfter, 4); assert.equal(r.sessions[0].stars, 2);
  assert.equal(r.errors[0].task, '7 × 8'); assert.equal(r.id, 7);
});

test('Lernwörter und Belohnung reisen im Link mit', async () => {
  const kid = { wordLists: [{ name: 'Woche 12', words: ['Fahr-rad', 'Straße', 'Größe', 'spielen'] }], reward: { goal: 5, text: 'Ein Spiel aussuchen 🎲' } };
  const x = await encodeExtra(linkExtra(kid));
  const code = encodeKidCode({ name: 'Mia', id: 3, unlocked: ['mengen'] });
  const p = parseKidHash('#' + kidHash(code, 'Hallo', x));
  assert.equal(p.message, 'Hallo');
  const back = unpackExtra(await decodeExtra(p.extra));
  assert.deepEqual(back.wordLists[0].words, ['Fahr-rad', 'Straße', 'Größe', 'spielen']);
  assert.equal(back.reward.text, 'Ein Spiel aussuchen 🎲');
  assert.ok(('#' + kidHash(code, 'Hallo', x)).length < 600, 'Link bleibt kurz');
  assert.equal(parseKidHash('#' + kidHash(code)).extra, null);
});

test('Bericht überträgt Stufen und Stations-Sessions', async () => {
  const kid = { id: 1, name: 'Ida', code: 'X', progress: { mal3: { bestStars: 2, attempts: 3, correct: 25, total: 32, lv: { 1: 3, 2: 2, 3: 0 } } },
    sessions: [{ ts: '2026-11-19T10:00:00.000Z', planetId: 'mal3', level: 2, correct: 9, total: 10, tips: 0, durationSec: 60 }, { ts: '2026-11-19T11:00:00.000Z', planetId: 'station', correct: 12, total: 13, tips: 0, durationSec: 90 }],
    errors: [{ ts: '2026-11-19T11:00:00.000Z', planetId: 'plus10', type: 'zaehlfehler', task: '3 + 4', given: '8', expected: '7' }] };
  const r = await decodeReport(await encodeReport(kid));
  assert.deepEqual(r.progress.mal3.lv, { 1: 3, 2: 2, 3: 0 });
  assert.equal(r.sessions[0].level, 2); assert.equal(r.sessions[1].planetId, 'station');
  assert.equal(r.errors[0].planetId, 'plus10');
});

test('Viele Planeten und Förderwelt im Code, alte Links bleiben gültig', async () => {
  const { PLANETS } = await import('../public/js/curriculum.js');
  const all = PLANETS.map(p => p.id);
  for (let k = 0; k < 50; k++) {
    const un = all.filter(() => Math.random() < 0.3), av = Math.floor(Math.random() * 100);
    const code = encodeKidCode({ name: 'Zoe', id: k + 1, avatar: av, autoAdvance: k % 2 === 0, unlocked: un });
    const d = decodeKidCode(code);
    assert.deepEqual(d.unlocked.slice().sort(), un.slice().sort());
    assert.equal(parseKidHash('#' + kidHash(code, 'Hi')).id, k + 1);
  }
  // bisherige Codes
  assert.deepEqual(decodeKidCode('MIA-5ZRC-QJW2-2A2A3').unlocked, ['mengen', 'mal3', 'anlaut']);
  assert.equal(decodeKidCode('DORA-2SAXN-BGJ22-22222-2A223').avatar, '🦥');
});
