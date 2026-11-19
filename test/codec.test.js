import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeKidCode, decodeKidCode, kidHash, parseKidHash, encodeReport, decodeReport, CODE_ORDER } from '../public/js/codec.js';
import { PLANETS } from '../public/js/curriculum.js';

test('Codereihenfolge deckt alle Planeten ab', () => {
  assert.deepEqual([...CODE_ORDER].sort(), PLANETS.map(p => p.id).sort());
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
test('Bericht hin und zurück', async () => {
  const kid = { id: 7, name: 'Mia', code: 'MIA-X', progress: { mal7: { bestStars: 2, attempts: 3, correct: 25, total: 30, lastPlayed: '2026-11-19T10:00:00.000Z' } },
    sessions: [{ ts: '2026-11-19T10:00:00.000Z', planetId: 'mal7', correct: 9, total: 10, moodBefore: 2, moodAfter: 4, tips: 1, durationSec: 100 }],
    errors: [{ ts: '2026-11-19T10:00:00.000Z', planetId: 'mal7', type: 'nachbaraufgabe', task: '7 × 8', given: '49', expected: '56' }] };
  const txt = await encodeReport(kid);
  const r = await decodeReport('Bericht von Mia: ' + txt + ' danke');
  assert.equal(r.progress.mal7.bestStars, 2); assert.equal(r.sessions[0].moodAfter, 4); assert.equal(r.sessions[0].stars, 2);
  assert.equal(r.errors[0].task, '7 × 8'); assert.equal(r.id, 7);
});
