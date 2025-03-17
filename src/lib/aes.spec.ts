import test from 'ava';

import { createCryptoUtils } from './aes';

test('round-trip encryption/decryption without modifier', (t) => {
  const cryptoUtils = createCryptoUtils('myEncryptionKey');
  const originalText = 'Hello, world!';

  const encrypted = cryptoUtils.encryptData(originalText);
  t.truthy(encrypted.iv, 'IV should be a non-empty string');
  t.truthy(encrypted.content, 'Encrypted content should be a non-empty string');

  const decrypted = cryptoUtils.decryptData(encrypted);
  t.is(
    decrypted,
    originalText,
    'Decrypted text should match the original text'
  );
});

test('round-trip encryption/decryption with modifier', (t) => {
  const cryptoUtils = createCryptoUtils('myEncryptionKey');
  const originalText = 'Test string for encryption';

  const encrypted = cryptoUtils.encryptData(originalText);
  t.truthy(encrypted.iv, 'IV should be a non-empty string');
  t.truthy(encrypted.content, 'Encrypted content should be a non-empty string');

  const decrypted = cryptoUtils.decryptData(encrypted);
  t.is(
    decrypted,
    originalText,
    'Decrypted text should match the original text'
  );
});

test('encryption produces different outputs on successive calls', (t) => {
  const cryptoUtils = createCryptoUtils('myEncryptionKey');
  const originalText = 'Same text';

  const encrypted1 = cryptoUtils.encryptData(originalText);
  const encrypted2 = cryptoUtils.encryptData(originalText);

  // Even though the input is the same, the IV is random so the outputs should differ.
  t.notDeepEqual(
    encrypted1,
    encrypted2,
    'Encrypted outputs should differ due to random IV'
  );
});
