import test from 'ava';
import nock from 'nock';
import proxyquire from 'proxyquire';

// Create a fake version of the ed25519 module.
// Instead of modifying the existing export, we provide a fake implementation
// that simply returns the encrypted data as "decrypted" for testing purposes.
const fakeEdUtils = {
  createEd25519CryptoUtils: async (_modifier?: string) => ({
    decryptWithPrivateKey: async (_privateKey: string, encryptedData: string) =>
      encryptedData,
  }),
};

// Use proxyquire to load the module with the fake ed25519 dependency.
const { createCngnApiClient } = proxyquire('./cngn', {
  './ed25519': fakeEdUtils,
});

// Define a dummy configuration.
const config = {
  apiVersion: 'v1',
  apiKey: 'dummyApiKey',
  encryptionKey: 'dummyEncryptionKey',
  encryptionModifier: 'dummyModifier',
  errorHandler: (err: any) => {
    console.error('Test error handler:', err);
  },
};

const baseUrl = 'https://api.cngn.co/v1/api';

test.before(() => {
  nock.disableNetConnect();
});

test.after.always(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

test('getBalance returns a formatted response with balance data', async (t) => {
  const expectedData = { balance: 100 };
  // Simulate API returning a response with data as a JSON string.
  const apiResponse = {
    status: 200,
    message: 'OK',
    data: JSON.stringify(expectedData),
  };

  nock(baseUrl).get('/balance').reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const response = await client.getBalance();

  t.is(response.statusCode, 200);
  t.is(response.message, 'OK');
  t.deepEqual(response.data, expectedData);
  t.is(response._metadata.path, '/balance');
});

test('getTransactionHistory returns a formatted response with transaction history', async (t) => {
  const expectedData = { transactions: [1, 2, 3] };
  const apiResponse = {
    status: 200,
    message: 'OK',
    data: JSON.stringify(expectedData),
  };

  nock(baseUrl)
    .get('/transactions')
    .query({ page: '1', limit: '10' })
    .reply(200, apiResponse);

  const client = createCngnApiClient(config);
  const response = await client.getTransactionHistory();

  t.is(response.statusCode, 200);
  t.is(response.message, 'OK');
  t.deepEqual(response.data, expectedData);
  t.is(response._metadata.path, '/transactions');
});

test('withdraw returns a formatted error response on failure', async (t) => {
  // Simulate an API error response with a top-level "error" property.
  const errorResponse = {
    status: 400,
    message: 'Bad Request',
    error: 'Invalid withdrawal',
  };

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
