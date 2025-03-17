import test from 'ava';

import { EncryptedData } from '../types/aes';

import { createCryptoUtils } from './aes';

test('round-trip encryption/decryption returns original text', (t) => {
  const cryptoUtils = createCryptoUtils('myEncryptionKey');
  const originalText = 'Test string for encryption';

  const encrypted: EncryptedData = cryptoUtils.encryptData(originalText);
  t.truthy(encrypted.iv, 'IV should be non-empty');
  t.truthy(encrypted.content, 'Encrypted content should be non-empty');

  const decrypted = cryptoUtils.decryptData(encrypted);
  t.is(
    decrypted,
    originalText,
    'Decrypted text should match the original text'
  );
});

test('encrypt produces different outputs on successive calls', (t) => {
  const cryptoUtils = createCryptoUtils('myEncryptionKey');
  const originalText = 'Test string for encryption';

  const encrypted1 = cryptoUtils.encryptData(originalText);
  const encrypted2 = cryptoUtils.encryptData(originalText);

  // Even with the same input, random IVs should produce different encrypted outputs.
  t.notDeepEqual(
    encrypted1,
    encrypted2,
    'Encrypted outputs should differ because of random IV'
  );
});

test('encrypted IV and content are valid base64 strings', (t) => {
  const cryptoUtils = createCryptoUtils('myEncryptionKey');
  const originalText = 'Test string for encryption';

  const encrypted = cryptoUtils.encryptData(originalText);
  // Check that the IV and content can be decoded from base64 without error.
  t.notThrows(
    () => Buffer.from(encrypted.iv, 'base64'),
    'IV should be valid base64'
  );
  t.notThrows(
    () => Buffer.from(encrypted.content, 'base64'),
    'Content should be valid base64'
  );
});
