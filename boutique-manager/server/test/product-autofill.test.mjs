import test from 'node:test';
import assert from 'node:assert/strict';
import { profile } from './helpers.mjs';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/boutique_manager_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters';

const { productSuggestionsFromProfile } = await import('../dist/src/services/product-autofill.service.js');
const { analyzeProductImages } = await import('../dist/src/services/visual-analysis.service.js');

test('le préremplissage remplit seulement les champs visuels et laisse prix/stock/tailles absents', () => {
  const suggestions = productSuggestionsFromProfile(profile());
  assert.equal(suggestions.type, 'Pull');
  assert.equal(suggestions.brand, 'Nike');
  assert.deepEqual(suggestions.colors, ['noir', 'blanc']);
  assert.ok(suggestions.material);
  assert.equal('price' in suggestions, false);
  assert.equal('stock' in suggestions, false);
  assert.equal('sizes' in suggestions, false);
  assert.equal('sku' in suggestions, false);
  assert.equal('barcode' in suggestions, false);
});

test('les deux images du même produit sont envoyées dans une seule analyse structurée', async () => {
  let imageParts = 0;
  const generator = async (_key, request) => {
    imageParts = request.contents[0].parts.filter((part) => 'inlineData' in part).length;
    return { text: JSON.stringify(profile()), modelVersion: 'test-model' };
  };
  const result = await analyzeProductImages(
    [
      { buffer: Buffer.from('front'), mimeType: 'image/jpeg' },
      { buffer: Buffer.from('back'), mimeType: 'image/jpeg' },
    ],
    { keys: ['test-key'], generator },
  );
  assert.equal(imageParts, 2);
  assert.equal(result.model, 'test-model');
});
