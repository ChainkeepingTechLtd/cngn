import test from 'ava';
import nock from 'nock';
import proxyquire from 'proxyquire';

import { FormattedResponse } from '../types/cngn';

// --- Stub the ed25519 module ---
// Instead of modifying the existing export, we provide a fake implementation
// that simply returns the encrypted data as "decrypted" for testing purposes.
const fakeEdUtils = {
  createEd25519CryptoUtils: async () => ({
    decryptWithPrivateKey: async (_privateKey: string, encryptedData: string) =>
      encryptedData,
  }),
};

// --- Load the module under test with our fake ed25519 dependency ---
const { createCngnApiClient } = proxyquire('./cngn', {
  './ed25519': fakeEdUtils,
});

// --- Dummy configuration for testing ---
const config = {
  apiVersion: 'v1',
  apiKey: 'dummyApiKey',
  encryptionKey: 'dummyEncryptionKey',
  errorHandler: (err: any) => {
    // For tests we log the error (a spy test will cover this)
    console.error('Test error handler:', err);
  },
};

const baseUrl = 'https://api.cngn.co/v1/api';

// Helper function to simulate a successful API response.
// Our client expects the axios response to have a "data" property that is an object with properties:
// - status: number
// - message: string
// - data: JSON string of the expected payload.
const makeSuccessResponse = (status: number, message: string, data: any) => ({
  status,
  message,
  data: JSON.stringify(data),
});

// Helper function to simulate an error API response.
// For errors, the response body contains status, message, and a top-level "error" property.
const makeErrorResponse = (
  status: number,
  message: string,
  errorMsg: string
) => ({
  status,
  message,
  error: errorMsg,
});

// --- Test forced config merging by providing additional headers ---
test('axios instance is created with merged headers', async (t) => {
  const customConfig = {
    ...config,
    axiosConfig: {
      headers: {
        'X-Custom-Header': 'customValue',
      },
    },
  };

  // Set up nock to verify that the merged headers are sent.
  nock(baseUrl, {
    reqheaders: {
      Authorization: 'Bearer dummyApiKey',
      'Content-Type': 'application/json',
      'X-Custom-Header': 'customValue',
    },
  })
    .get('/balance')
    .reply(200, makeSuccessResponse(200, 'OK', { balance: 50 }));

  const client = createCngnApiClient(customConfig);
  const res = await client.getBalance();
  t.is(res.statusCode, 200);
  t.deepEqual(res.data, { balance: 50 });
});

// --- Success Cases ---

test('getBalance returns a formatted response with balance data', async (t) => {
  const expectedData = { balance: 100 };
  const apiResponse = makeSuccessResponse(200, 'OK', expectedData);

  nock(baseUrl).get('/balance').reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const res = await client.getBalance();

  t.is(res.statusCode, 200);
  t.is(res.message, 'OK');
  t.deepEqual(res.data, expectedData);
  t.is(res._metadata.path, '/balance');
});

test('getTransactionHistory returns formatted transaction history', async (t) => {
  const expectedData = { transactions: [1, 2, 3] };
  const apiResponse = makeSuccessResponse(200, 'OK', expectedData);

  nock(baseUrl)
    .get('/transactions')
    .query({ page: '1', limit: '10' })
    .reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const res = await client.getTransactionHistory();

  t.is(res.statusCode, 200);
  t.is(res.message, 'OK');
  t.deepEqual(res.data, expectedData);
  t.is(res._metadata.path, '/transactions');
});

test('withdraw returns formatted withdrawal response', async (t) => {
  const expectedData = { withdrawalId: 'W123' };
  const apiResponse = makeSuccessResponse(200, 'OK', expectedData);

  nock(baseUrl).post('/withdraw').reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const res = await client.withdraw({ amount: 100, account: 'ABC123' });

  t.is(res.statusCode, 200);
  t.is(res.message, 'OK');
  t.deepEqual(res.data, expectedData);
  t.is(res._metadata.path, '/withdraw');
});

test('verifyWithdrawal returns formatted verification response', async (t) => {
  const expectedData = { verified: true };
  const apiResponse = makeSuccessResponse(200, 'OK', expectedData);

  nock(baseUrl).get('/withdraw/verify/txn123').reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const res = await client.verifyWithdrawal('txn123');

  t.is(res.statusCode, 200);
  t.is(res.message, 'OK');
  t.deepEqual(res.data, expectedData);
  t.is(res._metadata.path, '/withdraw/verify/txn123');
});

test('redeemAsset returns formatted redemption response', async (t) => {
  const expectedData = { redeemed: true };
  const apiResponse = makeSuccessResponse(200, 'OK', expectedData);

  nock(baseUrl).post('/redeemAsset').reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const res = await client.redeemAsset({ assetId: 'ASSET1', amount: 50 });

  t.is(res.statusCode, 200);
  t.is(res.message, 'OK');
  t.deepEqual(res.data, expectedData);
  t.is(res._metadata.path, '/redeemAsset');
});

test('createVirtualAccount returns formatted virtual account response', async (t) => {
  const expectedData = { accountId: 'VA123' };
  const apiResponse = makeSuccessResponse(200, 'OK', expectedData);

  nock(baseUrl).post('/createVirtualAccount').reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const res = await client.createVirtualAccount({ customerId: 'CUST123' });

  t.is(res.statusCode, 200);
  t.is(res.message, 'OK');
  t.deepEqual(res.data, expectedData);
  t.is(res._metadata.path, '/createVirtualAccount');
});

test('updateExternalAccounts returns formatted updated external accounts response', async (t) => {
  const expectedData = { updated: true };
  const apiResponse = makeSuccessResponse(200, 'OK', expectedData);

  nock(baseUrl).post('/updateBusiness').reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const res = await client.updateExternalAccounts({
    accountId: 'EXT456',
    details: { foo: 'bar' },
  });

  t.is(res.statusCode, 200);
  t.is(res.message, 'OK');
  t.deepEqual(res.data, expectedData);
  t.is(res._metadata.path, '/updateBusiness');
});

test('getBanks returns formatted banks response', async (t) => {
  const expectedData = [{ bank: 'Bank A' }, { bank: 'Bank B' }];
  const apiResponse = makeSuccessResponse(200, 'OK', expectedData);

  nock(baseUrl).get('/banks').reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const res = await client.getBanks();

  t.is(res.statusCode, 200);
  t.is(res.message, 'OK');
  t.deepEqual(res.data, expectedData);
  t.is(res._metadata.path, '/banks');
});

test('swapAsset returns formatted swap response', async (t) => {
  const expectedData = { swapped: true };
  const apiResponse = makeSuccessResponse(200, 'OK', expectedData);

  nock(baseUrl).post('/swap').reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const res = await client.swapAsset({
    fromAsset: 'BTC',
    toAsset: 'ETH',
    amount: 0.1,
  });

  t.is(res.statusCode, 200);
  t.is(res.message, 'OK');
  t.deepEqual(res.data, expectedData);
  t.is(res._metadata.path, '/swap');
});

//
// ERROR CASES
//

test('GET endpoint error is formatted correctly', async (t) => {
  const errorResponse = makeErrorResponse(
    404,
    'Not Found',
    'Resource not found'
  );

  nock(baseUrl).get('/balance').reply(404, errorResponse);

  const client = createCngnApiClient(config);
  const err = await t.throwsAsync(async () => {
    await client.getBalance();
  });

  t.true(err instanceof Error);
  t.is((err as any).statusCode, 404);
  t.is(err.message, 'Not Found');
  t.is((err as any).data.error, 'Resource not found');
});

test('POST endpoint error is formatted correctly', async (t) => {
  const errorResponse = makeErrorResponse(
    400,
    'Bad Request',
    'Invalid withdrawal'
  );

  nock(baseUrl).post('/withdraw').reply(400, errorResponse);

  const client = createCngnApiClient(config);
  const err = await t.throwsAsync(async () => {
    await client.withdraw({ amount: -100 });
  });

  t.true(err instanceof Error);
  t.is((err as any).statusCode, 400);
  t.is(err.message, 'Bad Request');
  t.is((err as any).data.error, 'Invalid withdrawal');
});

test('formatApiError returns message from error.response.data.message', (t) => {
  const error = {
    response: {
      data: {
        message: 'Error A',
        status: 404,
        data: { error: 'Something wrong' },
      },
    },
    message: 'Fallback message',
  };

  const client = createCngnApiClient(config);
  const formatted = client.formatApiError(error, { path: '/test' });
  t.is(formatted.message, 'Error A');
  t.is((formatted as any).statusCode, 404);
  t.truthy((formatted as any)._metadata.timestamp);
  t.is((formatted as any)._metadata.path, '/test');
  t.deepEqual((formatted as any).data, 'Something wrong');
});

test('formatApiError falls back to error.message if error.response.data.message is undefined', (t) => {
  const error = {
    response: {
      data: {
        status: 400,
        data: { error: 'Bad stuff happened' },
      },
    },
    message: 'Fallback message',
  };

  const client = createCngnApiClient(config);
  const formatted = client.formatApiError(error, { path: '/fallback' });
  t.is(formatted.message, 'Fallback message');
  t.is((formatted as any).statusCode, 400);
  t.deepEqual((formatted as any).data, 'Bad stuff happened');
});

test('formatApiError falls back to default when error.response is undefined', (t) => {
  const error = {
    message: undefined,
  };

  const client = createCngnApiClient(config);
  const formatted = client.formatApiError(error, { path: '/default' });
  t.is(formatted.message, 'An error occurred');
  t.is((formatted as any).statusCode, 500);
  t.deepEqual((formatted as any).data, { error: error.toString() });
});

test('formatApiError uses error.response.data if no nested data.error exists', (t) => {
  const error = {
    message: 'Error B',
    response: {
      status: 402,
      data: 'Some raw data',
    },
  };

  const client = createCngnApiClient(config);
  const formatted = client.formatApiError(error, { path: '/data' });
  t.is(formatted.message, 'Error B');
  t.is((formatted as any).statusCode, 402);
  t.deepEqual((formatted as any).data, 'Some raw data');
});

test('formatApiResponse uses nested data when available', (t) => {
  // When apiResponse.data exists and contains its own data property.
  const apiResponse = {
    data: {
      status: 201,
      message: 'Created',
      data: { id: 123, name: 'Test' },
    },
  };
  const options = { path: '/nested' };

  const client = createCngnApiClient(config);
  const formatted: FormattedResponse = client.formatApiResponse(
    apiResponse,
    options
  );
  t.is(formatted.statusCode, 201);
  t.is(formatted.message, 'Created');
  t.deepEqual(formatted.data, { id: 123, name: 'Test' });
  t.is(formatted._metadata.path, '/nested');
  t.truthy(formatted._metadata.timestamp);
});

test('formatApiResponse uses top-level properties when nested data is absent', (t) => {
  // When apiResponse.data is undefined, and top-level properties are present.
  const apiResponse = {
    status: 202,
    message: 'Accepted',
  };
  const options = { path: '/top-level' };

  const client = createCngnApiClient(config);
  const formatted: FormattedResponse = client.formatApiResponse(
    apiResponse,
    options
  );
  t.is(formatted.statusCode, 202);
  t.is(formatted.message, 'Accepted');
  t.deepEqual(formatted.data, apiResponse);
  t.is(formatted._metadata.path, '/top-level');
});

test('formatApiResponse uses apiResponse.data when nested data property is missing', (t) => {
  // When apiResponse.data exists but does not have a nested "data" property.
  const nested = { status: 203, message: 'Non-Authoritative', extra: 'abc' };
  const apiResponse = {
    data: nested,
  };
  const options = { path: '/noNestedData' };

  const client = createCngnApiClient(config);
  const formatted: FormattedResponse = client.formatApiResponse(
    apiResponse,
    options
  );
  t.is(formatted.statusCode, 203);
  t.is(formatted.message, 'Non-Authoritative');
  t.deepEqual(formatted.data, nested);
  t.is(formatted._metadata.path, '/noNestedData');
});

test('formatApiResponse falls back to defaults when response is empty', (t) => {
  // When apiResponse has no status, message, or data properties.
  const apiResponse = {};
  const options = { path: '/default' };

  const client = createCngnApiClient(config);
  const formatted: FormattedResponse = client.formatApiResponse(
    apiResponse,
    options
  );
  t.is(formatted.statusCode, 200);
  t.falsy(formatted.message);
  t.deepEqual(formatted.data, apiResponse);
  t.is(formatted._metadata.path, '/default');
});

test('generic POST with object payload returns decrypted response data', async (t) => {
  const payload = { foo: 'bar' };
  const expectedData = { generic: 'post data' };
  const apiResponse = makeSuccessResponse(200, 'Generic OK', expectedData);

  nock(baseUrl).post('/generic').reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const res = await client.post('/generic', payload);

  t.is(res.status, 200);
  t.is(res.message, 'Generic OK');
  t.deepEqual(res.data, expectedData);
});

test('generic POST with string payload returns decrypted response data', async (t) => {
  const payload = 'Simple string payload';
  // When payload is a string, the client will use it directly.
  const expectedData = 'Simple string payload';
  const apiResponse = makeSuccessResponse(200, 'Generic OK', expectedData);

  nock(baseUrl).post('/generic').reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const res = await client.post('/generic', payload);

  t.is(res.status, 200);
  t.is(res.message, 'Generic OK');
  t.deepEqual(res.data, expectedData);
});

// Dummy configuration without an errorHandler.
const configNoErrorHandler = {
  apiVersion: 'v1',
  apiKey: 'dummyApiKey',
  encryptionKey: 'dummyEncryptionKey',
  // errorHandler is omitted so that the "if" branch in error handling is not taken.
};

// Test for generic GET error branch when no errorHandler is provided.
test('generic GET error is formatted correctly when no errorHandler is provided', async (t) => {
  const errorResponse = makeErrorResponse(404, 'Not Found', 'Resource missing');

  nock(baseUrl).get('/error').reply(404, errorResponse);

  const client = createCngnApiClient(configNoErrorHandler);
  const err = await t.throwsAsync(
    async () => {
      await client.get('/error');
    },
    { instanceOf: Error }
  );

  t.is((err as any).statusCode, 404);
  t.is(err.message, 'Not Found');
  t.is((err as any).data.error, 'Resource missing');
});

// Test for generic POST error branch when no errorHandler is provided.
test('generic POST error is formatted correctly when no errorHandler is provided', async (t) => {
  const errorResponse = makeErrorResponse(400, 'Bad Request', 'Invalid data');

  nock(baseUrl).post('/error').reply(400, errorResponse);

  const client = createCngnApiClient(configNoErrorHandler);
  const err = await t.throwsAsync(
    async () => {
      await client.post('/error', { test: 'data' });
    },
    { instanceOf: Error }
  );

  t.is((err as any).statusCode, 400);
  t.is(err.message, 'Bad Request');
  t.is((err as any).data.error, 'Invalid data');
});
