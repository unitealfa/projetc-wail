import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError as GoogleApiError } from '@google/genai';
import { profile } from './helpers.mjs';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/boutique_manager_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters';

const { generateStructuredGemini } = await import('../dist/src/services/gemini.service.js');

const base = {
  prompt: 'test',
  image: { buffer: Buffer.from('image'), mimeType: 'image/jpeg' },
  jsonSchema: { type: 'object' },
  validate: (value) => value,
  primaryModel: 'primary',
  fallbackModel: 'fallback',
};

test('chaque clé est utilisée au maximum une fois et la dernière utilise le fallback', async () => {
  const calls = [];
  const generator = async (key, request) => {
    calls.push({ key, model: request.model });
    if (key === 'key-1') throw new GoogleApiError({ status: 429, message: 'rate limited' });
    return { text: JSON.stringify(profile()), modelVersion: 'fallback-version' };
  };
  const result = await generateStructuredGemini({ ...base, keys: ['key-1', 'key-2'], generator });
  assert.equal(result.model, 'fallback-version');
  assert.deepEqual(calls, [{ key: 'key-1', model: 'primary' }, { key: 'key-2', model: 'fallback' }]);
});

test('toutes les clés limitées retournent un code contrôlé', async () => {
  const generator = async () => { throw new GoogleApiError({ status: 429, message: 'rate limited' }); };
  await assert.rejects(
    generateStructuredGemini({ ...base, keys: ['a', 'b'], generator }),
    (error) => error.code === 'AI_RATE_LIMITED' && error.statusCode === 503,
  );
});

test('timeout et JSON invalide sont transformés en erreurs sûres', async () => {
  await assert.rejects(
    generateStructuredGemini({ ...base, keys: ['a'], generator: async () => { throw new Error('request timeout'); } }),
    (error) => error.code === 'AI_TIMEOUT' && error.statusCode === 504,
  );
  await assert.rejects(
    generateStructuredGemini({ ...base, keys: ['a'], generator: async () => ({ text: 'not-json' }) }),
    (error) => error.code === 'AI_INVALID_RESPONSE' && error.statusCode === 502,
  );
});

test('une validation structurée invalide est reconnue sans exposer de détail', async () => {
  await assert.rejects(
    generateStructuredGemini({
      ...base,
      keys: ['a'],
      generator: async () => ({ text: '{}' }),
      validate: () => { throw new Error('schema details'); },
    }),
    (error) => error.code === 'AI_INVALID_RESPONSE' && !error.message.includes('schema details'),
  );
});
