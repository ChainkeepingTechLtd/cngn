import { Buffer } from 'buffer';
import crypto from 'crypto';

import sodium from 'libsodium-wrappers';

import { Ed25519CryptoUtils } from '../types/ed25519';

/**
 * Creates Ed25519 crypto utilities that throw errors on failure.
 *
 * If an encryptionModifier is provided, it adjusts the nonce by XOR-ing
 * its first 16 bytes with the SHA-256 hash of the modifier.
 *
 * ### Example (ES module)
 * ```js
 * import { createEd25519CryptoUtils } from './ed25519CryptoUtils';
 * (async () => {
 *   const edUtils = await createEd25519CryptoUtils('optionalModifier');
 *   const decrypted = await edUtils.decryptWithPrivateKey(myPrivateKey, encryptedData);
 *   console.log(decrypted);
 * })();
 * ```
 *
 * @param encryptionModifier - Optional modifier to adjust the nonce.
 * @returns An object with a decryptWithPrivateKey function.
 */
export const createEd25519CryptoUtils = async (
  encryptionModifier?: string
): Promise<Ed25519CryptoUtils> => {
  await sodium.ready;

  const parseOpenSSHPrivateKey = (privateKey: string): Uint8Array => {
    const lines = privateKey.split('\n');
    const base64PrivateKey = lines.slice(1, -1).join('');
    const privateKeyBuffer = Buffer.from(base64PrivateKey, 'base64');
    const keyDataStart = privateKeyBuffer.indexOf(
      Buffer.from([0x00, 0x00, 0x00, 0x40])
    );
    if (keyDataStart === -1) {
      // eslint-disable-next-line functional/no-throw-statement
      throw new Error('Unable to find Ed25519 key data');
    }
    return new Uint8Array(
      privateKeyBuffer.subarray(keyDataStart + 4, keyDataStart + 68)
    );
  };

  const processIv = (iv: Buffer): Buffer => {
    if (encryptionModifier) {
      const modHash = crypto
        .createHash('sha256')
        .update(encryptionModifier)
        .digest();
      iv = Buffer.from(iv.map((byte, i) => byte ^ modHash[i]));
    }
    return iv;
  };

  const decryptWithPrivateKey = async (
    privateKey: string,
    encryptedData: string
  ): Promise<string> => {
    const fullPrivateKey = parseOpenSSHPrivateKey(privateKey);
    const curve25519PrivateKey =
      sodium.crypto_sign_ed25519_sk_to_curve25519(fullPrivateKey);
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');

    const nonce = encryptedBuffer.subarray(0, sodium.crypto_box_NONCEBYTES);
    const ephemeralPublicKey = encryptedBuffer.subarray(
      -sodium.crypto_box_PUBLICKEYBYTES
    );
    const ciphertext = encryptedBuffer.subarray(
      sodium.crypto_box_NONCEBYTES,
      -sodium.crypto_box_PUBLICKEYBYTES
    );

    const finalNonce = processIv(Buffer.from(nonce));

    try {
      const decrypted = sodium.crypto_box_open_easy(
        ciphertext,
        finalNonce,
        ephemeralPublicKey,
        curve25519PrivateKey
      );
      return sodium.to_string(decrypted);
    } catch (err) {
      // eslint-disable-next-line functional/no-throw-statement
      throw new Error(
        `Failed to decrypt with the provided Ed25519 private key: ${err}`
      );
    }
  };

  return { decryptWithPrivateKey };
};
