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
        assert.ok(t.options.length >= 2 && t.options.length <= 4, `${p.id}: ${t.label} hat ${t.options.length} Optionen`);
        if (!['dasdass', 'slaute', 'wortarten', 'grossklein2'].includes(p.id)) assert.equal(t.options.length, 4, `${p.id}: ${t.label} hat ${t.options.length} Optionen`);
        assert.equal(t.options.filter(o => o.correct).length, 1, `${p.id}: genau eine richtige Antwort`);
        const labels = t.options.map(o => o.display ?? o.label);
        assert.equal(new Set(labels).size, labels.length, `${p.id}: doppelte Optionen ${labels}`);
        assert.ok(t.hint?.text, `${p.id}: Hinweis fehlt`);
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

test('Mathe-Antworten der höheren Stufen stimmen', () => {
  const num = s => Number(String(s).replace('−', '-').replace(',', '.'));
  for (let i = 0; i < 200; i++) {
    for (const t of generateMission('plus1000')) { const [a, b] = t.label.split(' + ').map(Number); assert.equal(num(t.options.find(o => o.correct).label), a + b); }
    for (const t of generateMission('halbschriftlich')) { const [a, b] = t.label.split(' × ').map(Number); assert.equal(num(t.options.find(o => o.correct).label), a * b); }
    for (const t of generateMission('divrest')) { const [n, d] = t.label.split(' : ').map(Number); assert.equal(t.options.find(o => o.correct).label, `${Math.floor(n / d)} R ${n % d}`); }
    for (const t of generateMission('vorrang')) { const expr = t.label.replace(/·/g, '*').replace(/−/g, '-'); assert.equal(num(t.options.find(o => o.correct).label), eval(expr)); }
    for (const t of generateMission('negativ')) { const expr = t.label.replace(/−/g, '-'); assert.equal(num(t.options.find(o => o.correct).label), eval(expr.replace(/--/g, '+'))); }
    for (const t of generateMission('dezimal')) if (t.label.includes('+')) { const [a, b] = t.label.split(' + ').map(num); assert.ok(Math.abs(num(t.options.find(o => o.correct).label) - (a + b)) < 1e-9); }
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

test('Alle Planeten in allen 3 Stufen', async () => {
  const { PLANET_LEVELS, levelStars, levelOpen, nextLevel, stationsOf, GALAXIES } = await import('../public/js/curriculum.js');
  const { stationQuiz } = await import('../public/js/exercises.js');
  for (const p of PLANETS) for (const L of PLANET_LEVELS) for (let run = 0; run < 10; run++) {
    const tasks = generateMission(p.id, null, L.n);
    assert.equal(tasks.length, L.tasks, `${p.id} Stufe ${L.n}`);
    for (const t of tasks) {
      assert.equal(t.options.filter(o => o.correct).length, 1);
      if (L.n === 1 && !['dasdass', 'slaute', 'grossklein2'].includes(p.id)) assert.equal(t.options.length, 3, `${p.id} Stufe 1: ${t.options.length}`);
      if (t.input === 'number') assert.match(t.options.find(o => o.correct).label, /^−?\d+$/);
    }
    if (L.n === 3 && ['plus10', 'mal7', 'negativ', 'prozent'].includes(p.id)) assert.ok(tasks.every(t => t.input === 'number'), p.id + ' Profi tippt');
  }
  assert.ok(generateMission('mengen', null, 1).every(t => Number(t.options.find(o => o.correct).label) <= 5), 'Stufe 1 kleinere Mengen');
  assert.ok(generateMission('mengen', null, 3).every(t => t.flash), 'Blitzblick');
  // Stufen-Logik inkl. alter Spielstände
  assert.deepEqual(levelStars({ bestStars: 2 }), { 1: 2, 2: 2, 3: 0 });
  assert.ok(levelOpen({ bestStars: 2 }, 3) && !levelOpen({ lv: { 1: 1, 2: 0, 3: 0 } }, 3));
  assert.equal(nextLevel({ lv: { 1: 3, 2: 0 } }), 2);
  // Stationen
  for (const g of GALAXIES) for (const st of stationsOf(g.id)) {
    const q = stationQuiz(st.planets);
    assert.ok(q.length >= 30 && q.every(t => st.planets.includes(t.src)), st.id);
  }
});
