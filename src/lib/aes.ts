import crypto from 'crypto';

import { EncryptedData } from '../types/aes';

/**
 * Creates a utility object for performing AES-256-CBC encryption and decryption.
 *
 * This function returns an object with two methods:
 * - `encryptData`: Encrypts a plain text string.
 * - `decryptData`: Decrypts an EncryptedData object back to its original plain text.
 *
 * ### Example (ES module)
 * ```js
 * import { createCryptoUtils } from './cryptoUtils';
 *
 * const cryptoUtils = createCryptoUtils("myEncryptionKey");
 *
 * // Encrypt plain text data
 * const encrypted = cryptoUtils.encryptData("Hello, world!");
 * console.log(encrypted);
 * // Expected output:
 * // { iv: "base64-encoded-iv", content: "base64-encoded-ciphertext" }
 *
 * // Decrypt the previously encrypted data
 * const decrypted = cryptoUtils.decryptData(encrypted);
 * console.log(decrypted);
 * // Expected output:
 * // "Hello, world!"
 * ```
 *
 * ### Example (CommonJS)
 * ```js
 * const { createCryptoUtils } = require('./cryptoUtils');
 *
 * const cryptoUtils = createCryptoUtils("myEncryptionKey");
 *
 * const encrypted = cryptoUtils.encryptData("Hello, world!");
 * console.log(encrypted);
 * // Expected output:
 * // { iv: "base64-encoded-iv", content: "base64-encoded-ciphertext" }
 *
 * const decrypted = cryptoUtils.decryptData(encrypted);
 * console.log(decrypted);
 * // Expected output:
 * // "Hello, world!"
 * ```
 *
 * @param encryptionKey - A required string used to derive a 32-byte AES key via SHA-256.
 * @returns An object with methods `encryptData` and `decryptData`.
 */
export const createCryptoUtils = (encryptionKey: string) => {
  /**
   * Derives a 32-byte key from the provided encryptionKey using SHA-256.
   *
   * @returns The derived 32-byte key as a Buffer.
   * @note This is an internal helper and is not exposed.
   */
  const deriveKey = (): Buffer => {
    return crypto.createHash('sha256').update(encryptionKey).digest();
  };

  /**
   * Encrypts a plain text string using AES-256-CBC.
   *
   * @param data - The plain text string to encrypt. Do not JSON.stringify the input.
   * @returns An object containing the base64-encoded IV and ciphertext.
   * @note The returned object conforms to the EncryptedData type.
   */
  const encryptData = (data: string): EncryptedData => {
    const key = deriveKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    // eslint-disable-next-line functional/no-let
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return { iv: iv.toString('base64'), content: encrypted };
  };

  /**
   * Decrypts an object containing base64-encoded IV and ciphertext using AES-256-CBC.
   *
   * @param encrypted - An object with properties `iv` and `content`, both base64-encoded.
   * @returns The decrypted plain text string.
   * @note This function reverses the encryption process and returns the original string.
   */
  const decryptData = (encrypted: EncryptedData): string => {
    const key = deriveKey();
    const iv = Buffer.from(encrypted.iv, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    // eslint-disable-next-line functional/no-let
    let decrypted = decipher.update(encrypted.content, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };

  return { encryptData, decryptData };
};
