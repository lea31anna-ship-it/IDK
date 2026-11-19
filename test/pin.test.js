import test from 'node:test';
import assert from 'node:assert/strict';
import { makePinRecord, checkPin, checkRecovery } from '../public/js/coach-pin.js';

test('PIN wird nur als Hash gespeichert und korrekt geprüft', async () => {
  const rec = await makePinRecord('2580', 'ABCDE-FGH23');
  assert.ok(!JSON.stringify(rec).includes('2580'), 'PIN darf nicht im Klartext gespeichert sein');
  assert.equal(rec.len, 4);
  assert.equal(await checkPin('2580', rec), true);
  assert.equal(await checkPin('2581', rec), false);
  assert.equal(await checkRecovery('abcde fgh23', rec), true, 'Code unabhängig von Groß/Klein und Leerzeichen');
  assert.equal(await checkRecovery('ABCDE-FGH24', rec), false);
  const rec2 = await makePinRecord('2580', 'X');
  assert.notEqual(rec.hash, rec2.hash, 'jeder PIN bekommt ein eigenes Salz');
});
