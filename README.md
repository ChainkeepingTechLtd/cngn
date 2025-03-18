# CNGN API Client Library

[![npm version](https://img.shields.io/npm/v/cngn.svg)](https://www.npmjs.com/package/@chainkeeping/cngn)
[![Build Status](https://img.shields.io/travis/chainkeepingtechltd/cngn.svg)](https://travis-ci.org/chainkeepingtechltd/cngn)
[![Coverage Status](https://img.shields.io/coveralls/chainkeepingtechltd/cngn.svg)](https://coveralls.io/github/chainkeepingtechltd/cngn)
[![License](https://img.shields.io/npm/l/@chainkeeping/cngn.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/chainkeepingtechltd/cngn.svg)](https://github.com/chainkeepingtechltd/cngn/stargazers)

A lightweight TypeScript library for interacting with cNGN endpoints using AES-256-CBC encryption and Ed25519 decryption. This library provides a simple and configurable API client with built-in encryption for secure data transmission.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [NPM Scripts](#npm-scripts)
- [Contributing](#contributing)
- [License](#license)
- [Resources](#resources)

## Installation

Install via npm:

```bash
npm install @chainkeeping/cngn
```

Or using yarn:

```bash
yarn add @chainkeeping/cngn
```

## Usage

ES Module (using async/await)

```bash
import { createCngnApiClient } from '@chainkeeping/cngn';

(async () => {
  const client = createCngnApiClient({
    apiVersion: 'v1',
    apiKey: 'YOUR_API_KEY',
    encryptionKey: 'YOUR_ENCRYPTION_KEY', // required for both encryption
    privateKey: 'YOUR_PRIVATE_KEY', // required for decryption
    errorHandler: (error) => console.error("API error:", error)
  });
  try {
    const balance = await client.getBalance();
    console.log(balance);
  } catch (err) {
    console.error(err);
  }
})();
```

CommonJS (using async/await)

```bash
const { createCngnApiClient } = require('@chainkeeping/cngn');

(async () => {
  const client = createCngnApiClient({
    apiVersion: 'v1',
    apiKey: 'YOUR_API_KEY',
    encryptionKey: 'YOUR_ENCRYPTION_KEY', // required for encryption
    privateKey: 'YOUR_PRIVATE_KEY', // required for decryption
    errorHandler: (error) => console.error("API error:", error)
  });
  try {
    const balance = await client.getBalance();
    console.log(balance);
  } catch (err) {
    console.error(err);
  }
})();
```

## Features

- **Secure Data Transmission:** Automatically encrypts POST payloads using AES-256-CBC and decrypts responses using Ed25519 decryption, ensuring your data is secure in transit.
- **Simple API:** Provides methods such as `getBalance`, `getTransactionHistory`, `withdraw`, `verifyWithdrawal`, `redeemAsset`, `createVirtualAccount`, `updateExternalAccounts`, `getBanks`, and `swapAsset` for interacting with CNGN endpoints.
- **Customizable Error Handling:** Accepts an optional `errorHandler` to override default error processing.
- **Configurable Requests:** Easily override Axios configurations and add custom headers.
- **Fully Typed with TypeScript:** Enjoy full type safety and autocompletion in modern editors.
- **Tested and Documented:** Comprehensive unit tests ensure reliability and maintain 100% test coverage.

## NPM Scripts

- **`npm test`**: Run the test suite using AVA.
- **`npm run watch`**: Run tests in watch mode.
- **`npm run build`**: Build the project into distributable bundles.
- **`npm run lint`**: Lint the code using ESLint.
- **`npm run doc`**: Generate API documentation using TypeDoc.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Clone your fork and run `npm install`.
3. Run `npm test` to ensure all tests pass.
4. Create a new branch for your feature or bugfix.
5. Commit your changes using conventional commit messages.
6. Open a pull request.

For detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Resources

- **API Documentation:** Automatically generated with TypeDoc and published on GitHub Pages.
- **GitHub Repository:** [https://github.com/chainkeepingtechltd/cngn](https://github.com/chainkeepingtechltd/cngn)
- **Issues:** [https://github.com/chainkeepingtechltd/cngn/issues](https://github.com/chainkeepingtechltd/cngn/issues)
- **Changelog:** See [CHANGELOG.md](CHANGELOG.md) for release notes.
