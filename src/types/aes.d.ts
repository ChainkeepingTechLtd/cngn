/**
 * A type literal representing encrypted data.
 *
 * ### Example (es module)
 * ```js
 * import { EncryptedData } from './cryptoUtils';
 * const data: EncryptedData = { iv: "base64-string", content: "base64-string" };
 * console.log(data);
 * // => { iv: "base64-string", content: "base64-string" }
 * ```
 *
 * ### Example (commonjs)
 * ```js
 * var EncryptedData = require('./cryptoUtils').EncryptedData;
 * var data = { iv: "base64-string", content: "base64-string" };
 * console.log(data);
 * // => { iv: "base64-string", content: "base64-string" }
 * ```
 *
 * @readonly iv - The initialization vector in base64 encoding.
 * @readonly content - The encrypted content in base64 encoding.
 */
export type EncryptedData = {
  readonly iv: string;
  readonly content: any;
};
