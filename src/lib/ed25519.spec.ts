import { Buffer } from 'buffer';
import crypto from 'crypto';

import test from 'ava';
import proxyquire from 'proxyquire';

// Create a fake sodium module to stub cryptographic operations.
const fakeSodium = {
  ready: Promise.resolve(),
  // For testing, simply return a fixed buffer regardless of input.
  crypto_sign_ed25519_sk_to_curve25519: (_sk: Uint8Array) =>
    Buffer.from('dummyCurveKey'),
  // Set fixed nonce/publickey lengths.
  crypto_box_NONCEBYTES: 24,
  crypto_box_PUBLICKEYBYTES: 32,
  // For testing, simulate decryption by always returning a buffer that converts to 'decrypted text'
  crypto_box_open_easy: (
    _ciphertext: Buffer,
    _nonce: Buffer,
    _ephemeralPublicKey: Buffer,
    _curveKey: Buffer
  ) => Buffer.from('decrypted text'),
  to_string: (buf: Buffer) => buf.toString('utf8'),
};

// Use proxyquire to load the module under test with our fake sodium.
const { createEd25519CryptoUtils } = proxyquire('./ed25519', {
  'libsodium-wrappers': fakeSodium,
  crypto,
  buffer: { Buffer },
});

// Test that an invalid key (one without the proper marker) causes an error.
test('decryptWithPrivateKey throws error for invalid private key', async (t) => {
  const edUtils = await createEd25519CryptoUtils();
  const invalidKey = 'invalid key';
  const dummyEncryptedData = 'AAAA'; // dummy base64 string; content is irrelevant here.
  const error = await t.throwsAsync(
    async () => {
      await edUtils.decryptWithPrivateKey(invalidKey, dummyEncryptedData);
    },
    { instanceOf: Error }
  );
  t.true(error.message.includes('Unable to find Ed25519 key data'));
});

// Test that valid key input returns the stubbed decrypted text.
test('decryptWithPrivateKey returns decrypted text for valid key and data', async (t) => {
  // Construct a dummy valid key:
  // The parseOpenSSHPrivateKey function expects the key buffer to contain the sequence 0x00,0x00,0x00,0x40.
  // We'll create a buffer that contains this marker.
  const marker = Buffer.from([0x00, 0x00, 0x00, 0x40]);
  // Build a buffer with some padding, then the marker, then 64 bytes (dummy data).
  const dummyBuffer = Buffer.concat([
    Buffer.alloc(10, 0),
    marker,
    Buffer.alloc(64, 1),
  ]);
  const dummyKeyBase64 = dummyBuffer.toString('base64');
  const validKey = `-----BEGIN OPENSSH PRIVATE KEY-----\n${dummyKeyBase64}\n-----END OPENSSH PRIVATE KEY-----`;

  // For encryptedData, since our fake sodium always returns 'decrypted text' on decryption,
  // we can supply any dummy base64 string.
  const dummyEncryptedData = Buffer.from('dummy encrypted data').toString(
    'base64'
  );

  const edUtils = await createEd25519CryptoUtils();
  const result = await edUtils.decryptWithPrivateKey(
    validKey,
    dummyEncryptedData
  );
  t.is(result, 'decrypted text');
});
