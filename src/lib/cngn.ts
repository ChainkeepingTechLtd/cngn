import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

import { CngnApiClientConfig, FormattedResponse } from '../types/cngn';

import { createCryptoUtils } from './aes';
import { createEd25519CryptoUtils } from './ed25519';

/**
 * Creates a configured API client for interacting with CNGN endpoints.
 *
 * All POST requests automatically encrypt their payload using AES-256-CBC via the imported crypto utilities.
 * Additionally, responses are decrypted using the provided encryptionKey (used as the Ed25519 private key)
 * and then wrapped in a standardized FormattedResponse.
 *
 * ### Example (ES module - using async/await)
 * ```js
 * import { createCngnApiClient } from './cngnApiClient';
 *
 * (async () => {
 *   const client = createCngnApiClient({
 *     apiVersion: 'v1',
 *     apiKey: 'YOUR_API_KEY',
 *     encryptionKey: 'YOUR_ENCRYPTION_KEY', // required for both encryption and decryption
 *     errorHandler: (error) => console.error("API error:", error)
 *   });
 *   try {
 *     const balance = await client.getBalance();
 *     console.log(balance);
 *   } catch (err) {
 *     console.error(err);
 *   }
 * })();
 * ```
 *
 * ### Example (CommonJS - using async/await)
 * ```js
 * const { createCngnApiClient } = require('./cngnApiClient');
 *
 * (async () => {
 *   const client = createCngnApiClient({
 *     apiVersion: 'v1',
 *     apiKey: 'YOUR_API_KEY',
 *     encryptionKey: 'YOUR_ENCRYPTION_KEY',
 *     errorHandler: (error) => console.error("API error:", error)
 *   });
 *   try {
 *     const balance = await client.getBalance();
 *     console.log(balance);
 *   } catch (err) {
 *     console.error(err);
 *   }
 * })();
 * ```
 *
 * @param config - The configuration options for the client.
 * @returns An object containing all API endpoint methods.
 */
export const createCngnApiClient = (config: CngnApiClientConfig) => {
  const forcedConfig: AxiosRequestConfig = {
    baseURL: `https://api.cngn.co/v1/api`,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  };

  const mergedConfig: AxiosRequestConfig = {
    ...(config.axiosConfig || {}),
    ...forcedConfig,
    headers: {
      ...(config.axiosConfig?.headers || {}),
      ...forcedConfig.headers,
    },
  };

  const axiosInstance: AxiosInstance = axios.create(mergedConfig);

  // Initialize AES crypto utilities.
  const cryptoUtils = createCryptoUtils(config.encryptionKey);

  /**
   * Formats raw API response data into a standardized structure.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * import { formatApiResponse } from './cngnApiClient';
   * const rawResponse = { status: 200, message: 'OK', data: { balance: 100 } };
   * const formatted = formatApiResponse(rawResponse, { path: '/ping' });
   * console.log(formatted);
   * ```
   *
   * @param apiResponse - The raw API response data.
   * @param options - Metadata options (must include the endpoint path).
   * @returns The formatted response.
   */
  const formatApiResponse = (
    apiResponse: any,
    options: { readonly path: string }
  ): FormattedResponse => {
    return {
      statusCode: apiResponse.data?.status || apiResponse.status || 200,
      message: apiResponse.data?.message || apiResponse.message,
      _metadata: {
        timestamp: Date.now(),
        path: options.path,
      },
      data: apiResponse.data?.data || apiResponse.data || apiResponse,
    };
  };

  /**
   * Formats an error into a standardized API error response.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * try {
   *   await someApiCall();
   * } catch (err) {
   *   const formattedError = formatApiError(err, { path: '/balance' });
   *   console.error(formattedError);
   * }
   * ```
   *
   * @param error - The caught error (typically an AxiosError).
   * @param options - Metadata options containing at least the API endpoint path.
   * @returns An Error instance with properties for statusCode, _metadata, and data.
   */
  const formatApiError = (
    error: any,
    options: { readonly path: string }
  ): Error => {
    const err = new Error(
      error.response?.data?.message || error.message || 'An error occurred'
    );
    // eslint-disable-next-line functional/immutable-data
    (err as any).statusCode =
      error.response?.data?.status || error.response?.status || 500;
    // eslint-disable-next-line functional/immutable-data
    (err as any)._metadata = {
      timestamp: Date.now(),
      path: options.path,
    };
    // eslint-disable-next-line functional/immutable-data
    (err as any).data = error.response?.data?.data?.error ||
      error.response?.data || { error: error.toString() };
    return err;
  };

  /**
   * Performs a GET request to the specified endpoint.
   * Decrypts the response data using Ed25519 decryption.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * const data = await get('/balance');
   * console.log(data);
   * ```
   *
   * @param endpoint - The API endpoint.
   * @param configOverride - Optional Axios configuration overrides.
   * @returns A promise that resolves with the decrypted response data.
   */
  const get = async (
    endpoint: string,
    configOverride?: AxiosRequestConfig
  ): Promise<any> => {
    try {
      const response = await axiosInstance.get(endpoint, configOverride);
      const edUtils = await createEd25519CryptoUtils();
      return {
        ...response.data,
        data: JSON.parse(
          await edUtils.decryptWithPrivateKey(
            config.privateKey,
            response.data.data
          )
        ),
      };
    } catch (error) {
      if (config.errorHandler) {
        config.errorHandler(error as AxiosError);
      }
      // eslint-disable-next-line functional/no-throw-statement
      throw formatApiError(error, { path: endpoint });
    }
  };

  /**
   * Performs a POST request to the specified endpoint.
   * The payload is first converted to a string (if needed) and encrypted before sending.
   * Decrypts the response data using Ed25519 decryption.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * const data = await post('/withdraw', { amount: 100 });
   * console.log(data);
   * ```
   *
   * @param endpoint - The API endpoint.
   * @param data - The data to send (if not a string, it will be JSON.stringified).
   * @param configOverride - Optional Axios configuration overrides.
   * @returns A promise that resolves with the decrypted response data.
   */
  const post = async (
    endpoint: string,
    data: any,
    configOverride?: AxiosRequestConfig
  ): Promise<any> => {
    try {
      const plainText = typeof data === 'string' ? data : JSON.stringify(data);
      const encryptedPayload = cryptoUtils.encryptData(plainText);
      const response = await axiosInstance.post(
        endpoint,
        encryptedPayload,
        configOverride
      );
      const edUtils = await createEd25519CryptoUtils();
      return {
        ...response.data,
        data: JSON.parse(
          await edUtils.decryptWithPrivateKey(
            config.encryptionKey,
            response.data.data
          )
        ),
      };
    } catch (error) {
      if (config.errorHandler) {
        config.errorHandler(error as AxiosError);
      }
      // eslint-disable-next-line functional/no-throw-statement
      throw formatApiError(error, { path: endpoint });
    }
  };

  // API endpoint methods that return a FormattedResponse.

  /**
   * Retrieves the account balance.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * const balance = await client.getBalance();
   * console.log(balance);
   * ```
   *
   * @returns A promise that resolves with a FormattedResponse containing balance information.
   */
  const getBalance = async (): Promise<FormattedResponse> => {
    const rawResponse = await get('/balance');
    return formatApiResponse(rawResponse, { path: '/balance' });
  };

  /**
   * Retrieves transaction history with pagination.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * const history = await client.getTransactionHistory(2, 20);
   * console.log(history);
   * ```
   *
   * @param page - The page number (default is 1).
   * @param limit - The number of records per page (default is 10).
   * @returns A promise that resolves with a FormattedResponse containing transaction history.
   */
  const getTransactionHistory = async (
    page = 1,
    limit = 10
  ): Promise<FormattedResponse> => {
    const rawResponse = await get(`/transactions?page=${page}&limit=${limit}`);
    return formatApiResponse(rawResponse, { path: '/transactions' });
  };

  /**
   * Initiates a withdrawal request.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * const withdrawal = await client.withdraw({ amount: 100, account: 'ABC123' });
   * console.log(withdrawal);
   * ```
   *
   * @param data - The withdrawal request data.
   * @returns A promise that resolves with a FormattedResponse containing withdrawal details.
   */
  const withdraw = async (data: any): Promise<FormattedResponse> => {
    const rawResponse = await post('/withdraw', data);
    return formatApiResponse(rawResponse, { path: '/withdraw' });
  };

  /**
   * Verifies a withdrawal request using a transaction reference.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * const verification = await client.verifyWithdrawal("txn123");
   * console.log(verification);
   * ```
   *
   * @param tnxRef - The transaction reference.
   * @returns A promise that resolves with a FormattedResponse containing verification details.
   */
  const verifyWithdrawal = async (
    tnxRef: string
  ): Promise<FormattedResponse> => {
    const rawResponse = await get(`/withdraw/verify/${tnxRef}`);
    return formatApiResponse(rawResponse, {
      path: `/withdraw/verify/${tnxRef}`,
    });
  };

  /**
   * Redeems an asset.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * const redemption = await client.redeemAsset({ assetId: "ASSET1", amount: 50 });
   * console.log(redemption);
   * ```
   *
   * @param data - The asset redemption data.
   * @returns A promise that resolves with a FormattedResponse containing redemption details.
   */
  const redeemAsset = async (data: any): Promise<FormattedResponse> => {
    const rawResponse = await post('/redeemAsset', data);
    return formatApiResponse(rawResponse, { path: '/redeemAsset' });
  };

  /**
   * Creates a virtual account.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * const virtualAccount = await client.createVirtualAccount({ customerId: "CUST123" });
   * console.log(virtualAccount);
   * ```
   *
   * @param data - The virtual account creation data.
   * @returns A promise that resolves with a FormattedResponse containing virtual account details.
   */
  const createVirtualAccount = async (
    data: any
  ): Promise<FormattedResponse> => {
    const rawResponse = await post('/createVirtualAccount', data);
    return formatApiResponse(rawResponse, { path: '/createVirtualAccount' });
  };

  /**
   * Updates external account information.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * const updated = await client.updateExternalAccounts({ accountId: "EXT456", details: {...} });
   * console.log(updated);
   * ```
   *
   * @param data - The data for updating external accounts.
   * @returns A promise that resolves with a FormattedResponse containing updated account info.
   */
  const updateExternalAccounts = async (
    data: any
  ): Promise<FormattedResponse> => {
    const rawResponse = await post('/updateBusiness', data);
    return formatApiResponse(rawResponse, { path: '/updateBusiness' });
  };

  /**
   * Retrieves a list of banks.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * const banks = await client.getBanks();
   * console.log(banks);
   * ```
   *
   * @returns A promise that resolves with a FormattedResponse containing bank data.
   */
  const getBanks = async (): Promise<FormattedResponse> => {
    const rawResponse = await get('/banks');
    return formatApiResponse(rawResponse, { path: '/banks' });
  };

  /**
   * Initiates an asset swap.
   *
   * ### Example (ES module - using async/await)
   * ```js
   * const swap = await client.swapAsset({ fromAsset: "BTC", toAsset: "ETH", amount: 0.1 });
   * console.log(swap);
   * ```
   *
   * @param data - The asset swap data.
   * @returns A promise that resolves with a FormattedResponse containing swap details.
   */
  const swapAsset = async (data: any): Promise<FormattedResponse> => {
    const rawResponse = await post('/swap', data);
    return formatApiResponse(rawResponse, { path: '/swap' });
  };

  return {
    formatApiError,
    formatApiResponse,
    getBalance,
    getTransactionHistory,
    withdraw,
    verifyWithdrawal,
    redeemAsset,
    createVirtualAccount,
    updateExternalAccounts,
    getBanks,
    swapAsset,
    get,
    post,
  };
};
