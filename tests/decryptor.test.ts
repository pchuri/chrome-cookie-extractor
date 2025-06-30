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
});