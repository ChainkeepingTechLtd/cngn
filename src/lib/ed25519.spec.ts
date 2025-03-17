import { Buffer } from 'buffer';
import crypto from 'crypto';

import test from 'ava';
import proxyquire from 'proxyquire';

// =========================
// Test suite using fakeSodium that returns 'decrypted text'
// =========================

// Fake sodium that simulates successful decryption.
const fakeSodiumSuccess = {
  ready: Promise.resolve(),
  crypto_sign_ed25519_sk_to_curve25519: (_sk: Uint8Array) =>
    Buffer.from('dummyCurveKey'),
  crypto_box_NONCEBYTES: 24,
  crypto_box_PUBLICKEYBYTES: 32,
  crypto_box_open_easy: (
    _ciphertext: Buffer,
    _nonce: Buffer,
    _ephemeralPublicKey: Buffer,
    _curveKey: Buffer
  ) => Buffer.from('decrypted text'),
  to_string: (buf: Buffer) => buf.toString('utf8'),
};

const { createEd25519CryptoUtils: createEdUtilsSuccess } = proxyquire(
  './ed25519',
  {
    'libsodium-wrappers': fakeSodiumSuccess,
    crypto,
    buffer: { Buffer },
  }
);

test('decryptWithPrivateKey returns decrypted text for valid key and data', async (t) => {
  // Construct a dummy valid key:
  const marker = Buffer.from([0x00, 0x00, 0x00, 0x40]);
  const dummyBuffer = Buffer.concat([
    Buffer.alloc(10, 0),
    marker,
    Buffer.alloc(64, 1),
  ]);
  const dummyKeyBase64 = dummyBuffer.toString('base64');
  const validKey = `-----BEGIN OPENSSH PRIVATE KEY-----\n${dummyKeyBase64}\n-----END OPENSSH PRIVATE KEY-----`;

  // Dummy encrypted data (content is irrelevant here, as our fake returns a fixed value)
  const dummyEncryptedData = Buffer.from('dummy encrypted data').toString(
    'base64'
  );

  const edUtils = await createEdUtilsSuccess();
  const result = await edUtils.decryptWithPrivateKey(
    validKey,
    dummyEncryptedData
  );
  t.is(result, 'decrypted text');
});

// =========================
// Test for invalid private key (should throw "Unable to find Ed25519 key data")
// =========================

test('decryptWithPrivateKey throws error for invalid private key', async (t) => {
  const edUtils = await createEdUtilsSuccess();
  const invalidKey = 'invalid key';
  const dummyEncryptedData = 'AAAA'; // dummy base64 string
  const error = await t.throwsAsync(
    async () => {
      await edUtils.decryptWithPrivateKey(invalidKey, dummyEncryptedData);
    },
    { instanceOf: Error }
  );
  t.true(error.message.includes('Unable to find Ed25519 key data'));
});

// =========================
// Test suite using fakeSodium that simulates decryption failure
// =========================

// Fake sodium that always throws on decryption.
const fakeSodiumFailure = {
  ready: Promise.resolve(),
  crypto_sign_ed25519_sk_to_curve25519: (_sk: Uint8Array) =>
    Buffer.from('dummyCurveKey'),
  crypto_box_NONCEBYTES: 24,
  crypto_box_PUBLICKEYBYTES: 32,
  crypto_box_open_easy: () => {
    // eslint-disable-next-line functional/no-throw-statement
    throw new Error('Decryption failure');
  },
  to_string: (buf: Buffer) => buf.toString('utf8'),
};

const { createEd25519CryptoUtils: createEdUtilsFailure } = proxyquire(
  './ed25519',
  {
    'libsodium-wrappers': fakeSodiumFailure,
    crypto,
    buffer: { Buffer },
  }
);

test('decryptWithPrivateKey throws formatted error when decryption fails', async (t) => {
  // Construct a dummy valid private key (with proper marker).
  const marker = Buffer.from([0x00, 0x00, 0x00, 0x40]);
  const dummyBuffer = Buffer.concat([
    Buffer.alloc(10, 0),
    marker,
    Buffer.alloc(64, 1),
  ]);
  const dummyKeyBase64 = dummyBuffer.toString('base64');
  const dummyPrivateKey = `-----BEGIN OPENSSH PRIVATE KEY-----\n${dummyKeyBase64}\n-----END OPENSSH PRIVATE KEY-----`;

  // Dummy encrypted data
  const dummyEncryptedData = Buffer.from('dummy data').toString('base64');

  const edUtils = await createEdUtilsFailure();
  const error = await t.throwsAsync(
    async () => {
      await edUtils.decryptWithPrivateKey(dummyPrivateKey, dummyEncryptedData);
    },
    { instanceOf: Error }
  );

  t.true(
    error.message.includes(
      'Failed to decrypt with the provided Ed25519 private key:'
    ),
    'Error message should indicate decryption failure'
  );
});
