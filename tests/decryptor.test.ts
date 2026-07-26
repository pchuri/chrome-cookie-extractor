import { CookieDecryptor } from '../src/decryptor';
import * as os from 'os';

// Mock os module
jest.mock('os');
jest.mock('child_process');

const mockOs = os as jest.Mocked<typeof os>;

describe('CookieDecryptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('decryptValue', () => {
    it('should return plaintext on non-macOS platforms', () => {
      mockOs.platform.mockReturnValue('linux');
      const testData = Buffer.from('test-cookie-value');

      const result = CookieDecryptor.decryptValue(testData);

      expect(result).toBe('test-cookie-value');
    });

    it('should handle encrypted values on macOS', () => {
      mockOs.platform.mockReturnValue('darwin');
      const testData = Buffer.from('v10encrypted-data');

      const result = CookieDecryptor.decryptValue(testData);

      // Should return encrypted placeholder if keychain access fails
      expect(typeof result).toBe('string');
    });

    it('should handle unencrypted values', () => {
      mockOs.platform.mockReturnValue('darwin');
      const testData = Buffer.from('plain-text-value');

      const result = CookieDecryptor.decryptValue(testData);

      expect(typeof result).toBe('string');
    });
  });

  const crypto = require('crypto');

  // Synthetic-only helper: builds a v10-encrypted cookie payload the same way
  // Chrome does (PBKDF2 key from the raw Keychain password string, fixed IV of 16
  // spaces, AES-128-CBC, PKCS7 padding). No real cookies or Keychain data here.
  function buildV10Payload(password: string, plaintext: Buffer): Buffer {
    const key = crypto.pbkdf2Sync(Buffer.from(password, 'utf8'), Buffer.from('saltysalt'), 1003, 16, 'sha1');
    const iv = Buffer.alloc(16, ' ');
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    cipher.setAutoPadding(true);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return Buffer.concat([Buffer.from('v10'), encrypted]);
  }

  it('derives the AES key from the raw Keychain password string (not base64-decoded)', () => {
    mockOs.platform.mockReturnValue('darwin');
    // A base64-looking Keychain password. The correct scheme uses this STRING
    // as-is for PBKDF2; base64-decoding it (the old bug) would derive a wrong key.
    const password = '9VRabc1234567890abcd==';
    jest.spyOn<any, any>(CookieDecryptor as any, 'getChromeSafeStoragePassword')
      .mockReturnValue(Buffer.from(password, 'utf8'));

    const data = buildV10Payload(password, Buffer.from('secret-value'));

    const result = CookieDecryptor.decryptValue(data);
    expect(result).toBe('secret-value');
  });

  it('strips the 32-byte domain-hash prefix when it matches sha256(host_key)', () => {
    mockOs.platform.mockReturnValue('darwin');
    const password = 'mypassword';
    jest.spyOn<any, any>(CookieDecryptor as any, 'getChromeSafeStoragePassword')
      .mockReturnValue(Buffer.from(password, 'utf8'));

    const hostKey = 'www.example.com';
    const domainHash = crypto.createHash('sha256').update(hostKey).digest(); // 32 bytes
    const plaintext = Buffer.concat([domainHash, Buffer.from('session=abc123')]);
    const data = buildV10Payload(password, plaintext);

    const result = CookieDecryptor.decryptValue(data, hostKey);
    // The 32-byte hash is removed; only the real cookie value remains.
    expect(result).toBe('session=abc123');
  });

  it('leaves the value untouched when the leading 32 bytes are NOT sha256(host_key) (older Chrome)', () => {
    mockOs.platform.mockReturnValue('darwin');
    const password = 'mypassword';
    jest.spyOn<any, any>(CookieDecryptor as any, 'getChromeSafeStoragePassword')
      .mockReturnValue(Buffer.from(password, 'utf8'));

    // Pre-M130 payload: plaintext is the raw cookie value with no domain-hash prefix.
    const hostKey = 'www.example.com';
    const data = buildV10Payload(password, Buffer.from('legacy-cookie-value'));

    const result = CookieDecryptor.decryptValue(data, hostKey);
    expect(result).toBe('legacy-cookie-value');
  });

  it('does not strip anything when host_key is not provided', () => {
    mockOs.platform.mockReturnValue('darwin');
    const password = 'mypassword';
    jest.spyOn<any, any>(CookieDecryptor as any, 'getChromeSafeStoragePassword')
      .mockReturnValue(Buffer.from(password, 'utf8'));

    const data = buildV10Payload(password, Buffer.from('secret'));

    const result = CookieDecryptor.decryptValue(data);
    expect(result).toBe('secret');
  });
});
