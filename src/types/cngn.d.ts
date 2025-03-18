import { AxiosError, AxiosRequestConfig } from 'axios';

import { EncryptedData } from './aes';

/**
 * A type literal for the configuration options for the CNGN API client.
 *
 * @property apiVersion - The API version (e.g., 'v1').
 * @property apiKey - The API key for authorization.
 * @property encryptionKey - A required key used for both encryption and decryption.
 * @property errorHandler - Optional custom error handler for Axios errors.
 * @property axiosConfig - Additional Axios configuration options.
 */
// eslint-disable-next-line functional/no-mixed-type
export type CngnApiClientConfig = {
  readonly apiKey: string;
  readonly encryptionKey: string;
  readonly privateKey: string;
  // eslint-disable-next-line functional/no-return-void
  readonly errorHandler?: (error: AxiosError) => void;
  readonly axiosConfig?: AxiosRequestConfig;
};

/**
 * A type representing a formatted API response.
 *
 * ### Example (es module)
 * ```js
 * import { FormattedResponse } from './cngnApiClient';
 * const response: FormattedResponse = {
 *   statusCode: 200,
 *   message: "app.hello",
 *   _metadata: {
 *     language: "en",
 *     timestamp: 1660190937231,
 *     timezone: "Asia/Dubai",
 *     path: "/api/v1/test/hello",
 *     version: "1",
 *     repoVersion: "1.0.0"
 *   },
 *   data: { some data  }
 * };
 * ```
 *
 * ### Example (commonjs)
 * ```js
 * const { FormattedResponse } = require('./cngnApiClient');
 * // use response as shown above
 * ```
 */
export type FormattedResponse = {
  readonly statusCode: number;
  readonly message: string;
  readonly _metadata: {
    readonly language?: string;
    readonly timestamp?: number;
    readonly timezone?: string;
    readonly path: string;
  };
  readonly data: any;
};

/**
 * A type literal representing the API client returned by createCngnApiClient.
 *
 * ### Example (es module)
 * ```js
 * import { createCngnApiClient, CngnApiClient } from './cngnApiClient';
 * const client: CngnApiClient = createCngnApiClient({
 *   apiVersion: 'v1',
 *   apiKey: 'YOUR_API_KEY',
 *   encryptionKey: 'YOUR_ENCRYPTION_KEY',
 * });
 * client.ping().then(console.log);
 * ```
 *
 * ### Example (commonjs)
 * ```js
 * var client = require('./cngnApiClient').createCngnApiClient({
 *   apiVersion: 'v1',
 *   apiKey: 'YOUR_API_KEY',
 *   encryptionKey: 'YOUR_ENCRYPTION_KEY',
 * });
 * client.getStatus().then(console.log);
 * ```
 *
 * @returns An object containing API methods and encryption helpers.
 */
export type CngnApiClient = {
  /**
   * Calls the GET /ping endpoint.
   *
   * @returns A promise resolving with the API response data.
   */
  readonly ping: () => Promise<any>;
  /**
   * Calls the GET /status endpoint.
   *
   * @returns A promise resolving with the API status information.
   */
  readonly getStatus: () => Promise<any>;
  /**
   * Calls the POST /trigger endpoint with the provided payload.
   *
   * @param payload - The data to send in the POST request.
   * @returns A promise resolving with the API response data.
   */
  readonly trigger: (payload: any) => Promise<any>;
  /**
   * Performs a generic GET request to the specified endpoint.
   *
   * @param endpoint - The API endpoint to call.
   * @param configOverride - Optional Axios configuration overrides.
   * @returns A promise resolving with the response data.
   */
  readonly get: (
    endpoint: string,
    configOverride?: AxiosRequestConfig
  ) => Promise<any>;
  /**
   * Performs a generic POST request to the specified endpoint with the provided data.
   *
   * @param endpoint - The API endpoint to call.
   * @param data - The data to send in the POST request.
   * @param configOverride - Optional Axios configuration overrides.
   * @returns A promise resolving with the response data.
   */
  readonly post: (
    endpoint: string,
    data: any,
    configOverride?: AxiosRequestConfig
  ) => Promise<any>;
  /**
   * Encrypts a plain text string using AES-256-CBC.
   *
   * @param data - The plain text data to encrypt.
   * @returns An object with base64-encoded properties `iv` and `content`.
   */
  readonly encryptData: (data: string) => EncryptedData;
  /**
   * Decrypts an object containing base64-encoded `iv` and `content` back to a plain text string.
   *
   * @param encrypted - An object with base64-encoded `iv` and `content`.
   * @returns The decrypted plain text string.
   */
  readonly decryptData: (encrypted: EncryptedData) => string;
};
