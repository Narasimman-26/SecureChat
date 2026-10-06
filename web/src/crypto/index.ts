import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'SecureChatVault';
const DB_VERSION = 1;
const STORE_NAME = 'key_store';

// Helper for environments (Browser IndexedDB vs fallback in Node tests)
let memoryStore = new Map<string, any>();

async function getVaultDB(): Promise<IDBPDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return null;
  }
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function storeKeyInVault(key: string, value: any): Promise<void> {
  const db = await getVaultDB();
  if (db) {
    await db.put(STORE_NAME, value, key);
  } else {
    memoryStore.set(key, value);
  }
}

export async function getKeyFromVault(key: string): Promise<any> {
  const db = await getVaultDB();
  if (db) {
    return (await db.get(STORE_NAME, key)) ?? null;
  }
  return memoryStore.get(key) ?? null;
}

export async function clearVault(): Promise<void> {
  const db = await getVaultDB();
  if (db) {
    await db.clear(STORE_NAME);
  }
  memoryStore.clear();
}

// Base64 Helpers
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate ECDH P-256 Keypair.
 * The private key is strictly NON-EXTRACTABLE (`extractable: false`)
 * to prevent exfiltration even via XSS or developer tools.
 */
export async function generateIdentityKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKeyJwk: string;
}> {
  const cryptoSubtle = globalThis.crypto.subtle;

  // Generate ECDH P-256 key pair with extractable: false for private key
  const keyPair = await cryptoSubtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    false, // Private key is non-extractable!
    ['deriveKey', 'deriveBits']
  );

  // Export public key as JWK string for sharing with peers
  const publicJwk = await cryptoSubtle.exportKey('jwk', keyPair.publicKey);
  const publicKeyJwk = JSON.stringify(publicJwk);

  // Store non-extractable private key directly into IndexedDB
  await storeKeyInVault('identity_private_key', keyPair.privateKey);
  await storeKeyInVault('identity_public_key', publicKeyJwk);

  return {
    privateKey: keyPair.privateKey,
    publicKeyJwk,
  };
}

/**
 * Retrieve current user's non-extractable private key from IndexedDB.
 */
export async function getIdentityPrivateKey(): Promise<CryptoKey | null> {
  return await getKeyFromVault('identity_private_key');
}

/**
 * Retrieve current user's public key string from IndexedDB.
 */
export async function getIdentityPublicKey(): Promise<string | null> {
  return await getKeyFromVault('identity_public_key');
}

/**
 * Derive AES-256-GCM symmetric key from local private key and remote user's public key (ECDH).
 * Returns the derived CryptoKey, cached per peer.
 */
export async function deriveChatKey(
  peerPublicKeyJwkStr: string,
  myPrivateKey?: CryptoKey
): Promise<CryptoKey> {
  const cryptoSubtle = globalThis.crypto.subtle;
  const privateKey = myPrivateKey || (await getIdentityPrivateKey());
  if (!privateKey) {
    throw new Error('Local identity private key not found in secure vault');
  }

  // Parse and import peer's public key
  const peerJwk = typeof peerPublicKeyJwkStr === 'string'
    ? JSON.parse(peerPublicKeyJwkStr)
    : peerPublicKeyJwkStr;

  const peerPublicKey = await cryptoSubtle.importKey(
    'jwk',
    peerJwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    false,
    []
  );

  // Derive 256-bit AES-GCM key
  const derivedKey = await cryptoSubtle.deriveKey(
    {
      name: 'ECDH',
      public: peerPublicKey,
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Encrypt a plaintext string using AES-256-GCM with a fresh 12-byte IV.
 */
export async function encryptMessage(
  plaintext: string,
  aesKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const cryptoSubtle = globalThis.crypto.subtle;

  // 12-byte IV standard for AES-GCM
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encodedPlaintext = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await cryptoSubtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    encodedPlaintext
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM and the derived chat key.
 * Throws if tampered or invalid.
 */
export async function decryptMessage(
  ciphertextBase64: string,
  ivBase64: string,
  aesKey: CryptoKey
): Promise<string> {
  const cryptoSubtle = globalThis.crypto.subtle;

  const ciphertext = base64ToArrayBuffer(ciphertextBase64);
  const iv = base64ToArrayBuffer(ivBase64);

  const decryptedBuffer = await cryptoSubtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    aesKey,
    ciphertext as BufferSource
  );

  return new TextDecoder().decode(decryptedBuffer);
}
