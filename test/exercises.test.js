import test from 'node:test';
import assert from 'node:assert/strict';
import { PLANETS, ERROR_TYPES, isUnlocked, starsFor } from '../public/js/curriculum.js';
import { generateMission } from '../public/js/exercises.js';

test('jeder Planet erzeugt gültige Missionen', () => {
  for (const p of PLANETS) {
    for (let run = 0; run < 40; run++) {
      const tasks = generateMission(p.id);
      assert.equal(tasks.length, 10, p.id);
      for (const t of tasks) {
        assert.equal(t.options.length, 4, `${p.id}: ${t.label} hat ${t.options.length} Optionen`);
        assert.equal(t.options.filter(o => o.correct).length, 1, `${p.id}: genau eine richtige Antwort`);
        const labels = t.options.map(o => o.display ?? o.label);
        assert.equal(new Set(labels).size, 4, `${p.id}: doppelte Optionen ${labels}`);
        for (const o of t.options) if (!o.correct) assert.ok(ERROR_TYPES[o.type], `${p.id}: Fehlertyp ${o.type}`);
        assert.ok(t.prompt && t.label);
      }
    }
  }
});

test('Mathe-Antworten stimmen', () => {
  for (let i = 0; i < 200; i++) {
    for (const t of generateMission('malmix')) {
      const [a, b] = t.label.split(' × ').map(Number);
      assert.equal(Number(t.options.find(o => o.correct).label), a * b);
    }
    for (const t of generateMission('minus20')) {
      const [a, b] = t.label.split(' − ').map(Number);
      assert.equal(Number(t.options.find(o => o.correct).label), a - b);
    }
  }
});

test('Freischalt-Logik', () => {
  assert.ok(isUnlocked('mengen', { mode: 'public' }));
  assert.ok(!isUnlocked('zerlegen', { mode: 'public' }));
  assert.ok(isUnlocked('zerlegen', { mode: 'public', progress: { mengen: { bestStars: 1 } } }));
  assert.ok(isUnlocked('mal7', { mode: 'kid', unlocked: ['mal7'] }));
  assert.ok(!isUnlocked('mal8', { mode: 'kid', unlocked: ['mal7'], progress: { mal7: { bestStars: 2, attempts: 1 } }, autoAdvance: false }));
  assert.ok(isUnlocked('mal8', { mode: 'kid', unlocked: ['mal7'], progress: { mal7: { bestStars: 2, attempts: 1 } }, autoAdvance: true }));
  assert.equal(starsFor(10), 3); assert.equal(starsFor(9), 2); assert.equal(starsFor(7), 1); assert.equal(starsFor(6), 0);
});
