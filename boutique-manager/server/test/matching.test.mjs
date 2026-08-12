import test from 'node:test';
import assert from 'node:assert/strict';
import { profile, product } from './helpers.mjs';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/boutique_manager_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters';

const { findMatchingProducts, scoreProductProfile } = await import('../dist/src/services/product-match.service.js');

test('un pull presque identique bat la variante à grosse maille et logo central', () => {
  const query = profile();
  const close = profile();
  const different = profile({
    texture: ['maille épaisse'],
    fit: 'oversized',
    logoDetails: ['gros logo central'],
    distinctiveFeatures: ['gros logo central'],
    visualFingerprintTokens: ['pull-noir', 'maille-epaisse', 'col-rond', 'gros-logo-central', 'coupe-oversized'],
  });
  assert.ok(scoreProductProfile(query, close).score > scoreProductProfile(query, different).score);
});

test('une marque invisible côté USER ne provoque pas une forte pénalité', () => {
  const query = profile({ brand: null, fieldConfidence: { ...profile().fieldConfidence, brand: 0 } });
  const score = scoreProductProfile(query, profile()).score;
  assert.ok(score >= 85, `score reçu: ${score}`);
});

test('un mauvais produit proche est éliminé avant le tri par distance', () => {
  const query = profile();
  const good = product('good', profile(), { latitude: 36.7, longitude: 3.15 });
  const bad = product('bad', profile({
    productType: 'bag', subtype: 'sac', primaryColor: 'rouge', texture: ['cuir'],
    fit: null, necklineOrCollar: null, sleeveLength: null,
    logoDetails: ['aucun logo'], distinctiveFeatures: ['anse métallique'],
    visualFingerprintTokens: ['sac-rouge', 'cuir', 'anse-metal', 'forme-rigide'],
  }), { latitude: 36.7501, longitude: 3.0401 });
  const matches = findMatchingProducts(query, [bad, good], { userCoordinates: { latitude: 36.75, longitude: 3.04 } });
  assert.deepEqual(matches.map((match) => match.product._id), ['good']);
});

test('dans la fenêtre des bons scores, la boutique la plus proche passe devant', () => {
  const query = profile();
  const far = product('far', profile(), { latitude: 36.9, longitude: 3.3 });
  const near = product('near', profile({ secondaryColors: [] }), { latitude: 36.751, longitude: 3.041 });
  const matches = findMatchingProducts(query, [far, near], { userCoordinates: { latitude: 36.75, longitude: 3.04 } });
  assert.equal(matches[0]?.product._id, 'near');
});

test('sans localisation le meilleur score reste prioritaire', () => {
  const query = profile();
  const best = product('best', profile());
  const lower = product('lower', profile({ texture: ['maille moyenne'] }));
  const matches = findMatchingProducts(query, [lower, best]);
  assert.equal(matches[0]?.product._id, 'best');
  assert.equal(matches[0]?.distanceKm, null);
});

test('la taille demandée listée est prioritaire et stock zéro est exclu', () => {
  const query = profile();
  const noSize = product('no-size', profile(), {}, { sizes: ['S'] });
  const rightSize = product('right-size', profile({ secondaryColors: [] }), {}, { sizes: ['L'] });
  const out = product('out', profile(), {}, { stock: 0, sizes: ['L'] });
  const matches = findMatchingProducts(query, [noSize, out, rightSize], { requestedSize: 'l' });
  assert.equal(matches[0]?.product._id, 'right-size');
  assert.equal(matches[0]?.requestedSizeStatus, 'LISTED');
  assert.ok(!matches.some((match) => match.product._id === 'out'));
});
