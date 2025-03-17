import test from 'ava';
import nock from 'nock';
import proxyquire from 'proxyquire';

// Create a fake version of the ed25519 module.
// Its decryptWithPrivateKey function simply returns the encrypted data as-is.
const fakeEdUtils = {
  createEd25519CryptoUtils: async () => ({
    decryptWithPrivateKey: async (_privateKey: string, encryptedData: string) =>
      encryptedData,
  }),
};

// Use proxyquire to load the API client module with the fake ed25519 dependency.
const { createCngnApiClient } = proxyquire('./cngn', {
  './ed25519': fakeEdUtils,
});

// Dummy configuration for testing.
const config = {
  apiVersion: 'v1',
  apiKey: 'dummyApiKey',
  encryptionKey: 'dummyEncryptionKey',
  errorHandler: (err: any) => {
    console.error('Test error handler:', err);
  },
};

const baseUrl = 'https://api.cngn.co/v1/api';

// Helper to simulate a successful API response.
// Note: Our API client expects the axios response to have a "data" property
// that is an object with properties: status, message, and data (which is a JSON string).
const makeSuccessResponse = (status: number, message: string, data: any) => ({
  status,
  message,
  data: JSON.stringify(data),
});

// Helper to simulate an error API response.
// For error responses, we provide status, message, and a top-level error property.
const makeErrorResponse = (
  status: number,
  message: string,
  errorMsg: string
) => ({
  status,
  message,
  error: errorMsg,
});

test.before(() => {
  nock.disableNetConnect();
});

test.after.always(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

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

test('getTransactionHistory returns a formatted response with transaction history', async (t) => {
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

test('withdraw returns a formatted response with withdrawal data', async (t) => {
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

test('verifyWithdrawal returns a formatted response with verification data', async (t) => {
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

test('redeemAsset returns a formatted response with redemption data', async (t) => {
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

test('createVirtualAccount returns a formatted response with virtual account data', async (t) => {
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

test('updateExternalAccounts returns a formatted response with updated account info', async (t) => {
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

test('getBanks returns a formatted response with banks data', async (t) => {
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

test('swapAsset returns a formatted response with swap data', async (t) => {
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
  // Simulate an API error response with a top-level "error" property.
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
