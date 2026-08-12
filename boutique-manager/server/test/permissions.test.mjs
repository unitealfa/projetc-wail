import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/boutique_manager_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters';

const { requireUser, requireShopAccess } = await import('../dist/src/middleware/role.middleware.js');

function invoke(middleware, request) {
  return new Promise((resolve) => {
    middleware(request, {}, (error) => resolve(error ?? null));
  });
}

test('la route IA accepte USER et refuse ADMIN', async () => {
  assert.equal(await invoke(requireUser, { user: { role: 'USER' } }), null);
  const error = await invoke(requireUser, { user: { role: 'ADMIN' } });
  assert.equal(error?.code, 'FORBIDDEN');
});

test('USER ne peut jamais accéder aux routes produit d’une boutique', async () => {
  const error = await invoke(requireShopAccess, {
    user: { role: 'USER' },
    params: { shopId: '507f1f77bcf86cd799439011' },
  });
  assert.equal(error?.code, 'FORBIDDEN');
});
