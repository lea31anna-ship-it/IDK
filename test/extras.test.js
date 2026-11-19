import test from 'node:test';
import assert from 'node:assert/strict';
import { _test, GAMES } from '../public/js/games.js';
import { wordMission, spellingVariants, parseWordInput } from '../public/js/words.js';
import { award, TROPHIES, weekDays } from '../public/js/extras.js';

test('Sudoku-Lösungen sind gültig (4×4, 6×6, 9×9)', () => {
  for (const [n, br, bc] of [[4, 2, 2], [6, 2, 3], [9, 3, 3]]) for (let k = 0; k < 50; k++) {
    const g = _test.sudokuGrid(n, br, bc);
    for (let i = 0; i < n; i++) { assert.equal(new Set(g[i]).size, n); assert.equal(new Set(g.map(r => r[i])).size, n); }
    for (let r0 = 0; r0 < n; r0 += br) for (let c0 = 0; c0 < n; c0 += bc) {
      const box = new Set(); for (let r = r0; r < r0 + br; r++) for (let c = c0; c < c0 + bc; c++) box.add(g[r][c]);
      assert.equal(box.size, n);
    }
  }
});

test('Kreuzworträtsel: Wörter kreuzen sich korrekt', () => {
  for (const level of ['start', 'vs34', 'us']) for (let k = 0; k < 40; k++) {
    const cw = _test.buildCrossword(_test.wordPool(level), 6);
    assert.ok(cw && cw.placed.length >= 3, level);
    for (const p of cw.placed) [...p.W].forEach((ch, i) => assert.equal(cw.grid.get(`${p.r + (p.dir === 'd' ? i : 0)},${p.c + (p.dir === 'a' ? i : 0)}`), ch));
  }
  const own = _test.buildCrossword(_test.wordPool('vs34', ['Fahrrad', 'Straße', 'Garten', 'Rakete', 'Tafel', 'Schule']), 5);
  assert.ok(own.placed.length >= 3);
});

test('Lernwörter-Übungen', () => {
  const words = parseWordInput('Fahr-rad\nStraße, Größe; spielen\n\nBiene\nFahr-rad');
  assert.deepEqual(words, ['Fahr-rad', 'Straße', 'Größe', 'spielen', 'Biene']);
  for (let k = 0; k < 100; k++) {
    for (const t of wordMission(words)) {
      assert.ok(t.options.length >= 2);
      assert.equal(t.options.filter(o => o.correct).length, 1, t.label);
      assert.equal(new Set(t.options.map(o => o.label)).size, t.options.length, t.options.map(o => o.label).join());
      assert.ok(!t.options.find(o => o.correct).label.includes('-'), 'kein Bindestrich in der Lösung');
    }
  }
  assert.ok(spellingVariants('Straße').some(v => v.v === 'Strasse' && v.type === 's_laute'));
  assert.ok(spellingVariants('Biene').some(v => v.v === 'Bine' && v.type === 'ie_i'));
  assert.equal(GAMES.length, 4);
});

test('Pokale werden vergeben', () => {
  const prof = {};
  let fresh = award(prof, {}, { missions: 1, perfect: 1 });
  assert.deepEqual(fresh.map(t => t.id).sort(), ['perfect1', 'start']);
  fresh = award(prof, {}, { missions: 1 });
  assert.equal(fresh.length, 0, 'kein Pokal doppelt');
  fresh = award(prof, {}, { games: 1, gameKind: 'sudoku' });
  assert.ok(fresh.some(t => t.id === 'game1'));
  assert.equal(weekDays(prof.stats.days).filter(d => d.done).length, 1);
  assert.ok(TROPHIES.length >= 15);
});

test('Ränge und viele Avatare', async () => {
  const { rankFor, SHIPS, SPACES } = await import('../public/js/extras.js');
  const { AVATARS, encodeKidCode, decodeKidCode } = await import('../public/js/codec.js');
  assert.equal(rankFor(0).name, 'Weltraum-Kadett'); assert.equal(rankFor(35).name, 'Sternen-Kapitän'); assert.equal(rankFor(999).next, null);
  assert.ok(AVATARS.length >= 90 && AVATARS.length <= 128); assert.equal(new Set(AVATARS).size, AVATARS.length);
  for (let i = 0; i < AVATARS.length; i++) assert.equal(decodeKidCode(encodeKidCode({ name: 'Tim', id: i, avatar: i, unlocked: ['mengen'] })).avatar, AVATARS[i]);
  assert.ok(SHIPS[0].need === 0 && SPACES[0].need === 0);
});
