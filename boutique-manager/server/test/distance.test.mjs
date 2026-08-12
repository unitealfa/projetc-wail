import test from 'node:test';
import assert from 'node:assert/strict';

const { calculateDistanceKm } = await import('../dist/src/services/distance.service.js');

test('Haversine retourne une distance réaliste entre Alger Centre et Bab Ezzouar', () => {
  const distance = calculateDistanceKm(
    { latitude: 36.7538, longitude: 3.0588 },
    { latitude: 36.7167, longitude: 3.1833 },
  );
  assert.ok(distance !== null && distance > 10 && distance < 14, `distance reçue: ${distance}`);
});

test('des coordonnées hors limites sont refusées', () => {
  assert.equal(calculateDistanceKm({ latitude: 100, longitude: 3 }, { latitude: 36, longitude: 3 }), null);
});
