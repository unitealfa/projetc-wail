import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/boutique_manager_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-thirty-two-characters';

const { uploadRequiredProductImages } = await import('../dist/src/services/product.service.js');

const images = [
  { originalname: 'one.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('one') },
  { originalname: 'two.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('two') },
];

test('une photo reçue ne peut plus produire silencieusement un produit sans image', async () => {
  await assert.rejects(
    uploadRequiredProductImages('shop', images, async () => { throw new Error('GridFS indisponible'); }),
    (error) => error.code === 'PRODUCT_IMAGE_UPLOAD_FAILED' && error.statusCode === 503,
  );
});

test('si la seconde image échoue, le premier fichier GridFS est nettoyé', async () => {
  const cleaned = [];
  let index = 0;
  await assert.rejects(
    uploadRequiredProductImages(
      'shop',
      images,
      async () => {
        index += 1;
        if (index === 2) throw new Error('échec seconde image');
        return { imageUrl: '/api/images/507f1f77bcf86cd799439011', imageStorageKey: '507f1f77bcf86cd799439011' };
      },
      async (key) => { cleaned.push(key); },
    ),
    (error) => error.code === 'PRODUCT_IMAGE_UPLOAD_FAILED',
  );
  assert.deepEqual(cleaned, ['507f1f77bcf86cd799439011']);
});
