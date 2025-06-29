import { Decryptor } from '../src/decryptor';
import * as os from 'os';

describe('Decryptor', () => {
  let decryptor: Decryptor;

  beforeEach(() => {
    decryptor = new Decryptor();
  });

  describe('isMacOS', () => {
    it('should return true on macOS', () => {
      jest.spyOn(os, 'platform').mockReturnValue('darwin');
      expect(decryptor.isMacOS()).toBe(true);
    });

    it('should return false on other platforms', () => {
      jest.spyOn(os, 'platform').mockReturnValue('linux');
      expect(decryptor.isMacOS()).toBe(false);
    });
  });

  describe('decryptCookie', () => {
    it('should return original value for non-encrypted cookies', () => {
      const result = decryptor.decryptCookie(Buffer.from('test'), 'plaintext');
      expect(result).toBe('plaintext');
    });

    it('should return [ENCRYPTED] for encrypted cookies on non-macOS', () => {
      jest.spyOn(os, 'platform').mockReturnValue('linux');
      const encryptedValue = Buffer.concat([Buffer.from('v10'), Buffer.from('encrypted')]);
      
      const result = decryptor.decryptCookie(encryptedValue, '');
      expect(result).toBe('[ENCRYPTED]');
    });
  });
});