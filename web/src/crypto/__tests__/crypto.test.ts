import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateIdentityKeyPair,
  deriveChatKey,
  encryptMessage,
  decryptMessage,
  clearVault,
  base64ToArrayBuffer,
  arrayBufferToBase64,
} from '../index';

describe('End-to-End Encryption Engine (Web Crypto API)', () => {
  beforeEach(async () => {
    await clearVault();
  });

  it('generates non-extractable ECDH P-256 keypair and valid JWK public key', async () => {
    const { privateKey, publicKeyJwk } = await generateIdentityKeyPair();

    expect(privateKey).toBeDefined();
    expect(privateKey.algorithm.name).toBe('ECDH');
    expect(privateKey.extractable).toBe(false); // Non-extractable guarantee!

    const parsedJwk = JSON.parse(publicKeyJwk);
    expect(parsedJwk.kty).toBe('EC');
    expect(parsedJwk.crv).toBe('P-256');
    expect(parsedJwk.x).toBeDefined();
    expect(parsedJwk.y).toBeDefined();
  });

  it('performs ECDH key agreement between Alice and Bob with symmetrical derived keys', async () => {
    // 1. Generate Alice's keys
    const aliceKeys = await generateIdentityKeyPair();
    // 2. Generate Bob's keys
    const bobKeys = await generateIdentityKeyPair();

    // 3. Alice derives shared AES key using Bob's public key
    const aliceDerivedKey = await deriveChatKey(bobKeys.publicKeyJwk, aliceKeys.privateKey);

    // 4. Bob derives shared AES key using Alice's public key
    const bobDerivedKey = await deriveChatKey(aliceKeys.publicKeyJwk, bobKeys.privateKey);

    expect(aliceDerivedKey.algorithm.name).toBe('AES-GCM');
    expect(bobDerivedKey.algorithm.name).toBe('AES-GCM');

    // 5. Test message roundtrip across parties
    const secretMessage = 'Antigravity Zero-Knowledge Handshake #2026';
    const encryptedByAlice = await encryptMessage(secretMessage, aliceDerivedKey);

    expect(encryptedByAlice.ciphertext).toBeDefined();
    expect(encryptedByAlice.iv).toBeDefined();
    expect(encryptedByAlice.ciphertext).not.toBe(secretMessage);

    const decryptedByBob = await decryptMessage(
      encryptedByAlice.ciphertext,
      encryptedByAlice.iv,
      bobDerivedKey
    );

    expect(decryptedByBob).toBe(secretMessage);
  });

  it('detects tampering of ciphertext and fails authentication (AES-GCM Tag Mismatch)', async () => {
    const aliceKeys = await generateIdentityKeyPair();
    const bobKeys = await generateIdentityKeyPair();

    const aliceKey = await deriveChatKey(bobKeys.publicKeyJwk, aliceKeys.privateKey);
    const bobKey = await deriveChatKey(aliceKeys.publicKeyJwk, bobKeys.privateKey);

    const plaintext = 'Transfer $50,000 to Bob';
    const encrypted = await encryptMessage(plaintext, aliceKey);

    // Tamper with the ciphertext by flipping bytes
    const rawCiphertext = base64ToArrayBuffer(encrypted.ciphertext);
    rawCiphertext[0] ^= 0xff; // Flip bits
    const tamperedCiphertext = arrayBufferToBase64(rawCiphertext);

    // Decryption MUST throw an error
    await expect(
      decryptMessage(tamperedCiphertext, encrypted.iv, bobKey)
    ).rejects.toThrow();
  });

  it('detects tampering of Initialization Vector (IV)', async () => {
    const aliceKeys = await generateIdentityKeyPair();
    const bobKeys = await generateIdentityKeyPair();

    const aliceKey = await deriveChatKey(bobKeys.publicKeyJwk, aliceKeys.privateKey);
    const bobKey = await deriveChatKey(aliceKeys.publicKeyJwk, bobKeys.privateKey);

    const encrypted = await encryptMessage('Verify IV integrity check', aliceKey);

    // Tamper with IV
    const rawIv = base64ToArrayBuffer(encrypted.iv);
    rawIv[0] ^= 0xaa;
    const tamperedIv = arrayBufferToBase64(rawIv);

    await expect(
      decryptMessage(encrypted.ciphertext, tamperedIv, bobKey)
    ).rejects.toThrow();
  });
});
