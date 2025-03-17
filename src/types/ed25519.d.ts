export type Ed25519CryptoUtils = {
  /**
   * Decrypts data using the provided Ed25519 private key.
   *
   * @param privateKey - The Ed25519 private key in OpenSSH format.
   * @param encryptedData - The encrypted data as a base64 string.
   * @returns A promise resolving with the decrypted plain text string.
   * @throws If decryption fails.
   */
  readonly decryptWithPrivateKey: (
    privateKey: string,
    encryptedData: string
  ) => Promise<string>;
};
