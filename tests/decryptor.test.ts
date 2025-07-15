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

  it('decrypts v10 value with keychain password', () => {
    mockOs.platform.mockReturnValue('darwin');
    const password = Buffer.from('mypassword', 'utf8');
    jest.spyOn<any, any>(CookieDecryptor as any, 'getChromeSafeStoragePassword').mockReturnValue(password);

    const crypto = require('crypto');
    const salt = Buffer.from('saltysalt');
    const key = crypto.pbkdf2Sync(password, salt, 1003, 16, 'sha1');
    const iv = Buffer.alloc(16, ' ');
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    cipher.setAutoPadding(true);
    const encrypted = Buffer.concat([cipher.update('secret'), cipher.final()]);
    const data = Buffer.concat([Buffer.from('v10'), encrypted]);

    const result = CookieDecryptor.decryptValue(data);
    expect(result).toBe('secret');
  });
});
