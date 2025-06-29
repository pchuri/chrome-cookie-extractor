import { ProfileDetector } from '../src/profile-detector';
import * as os from 'os';
import * as path from 'path';

describe('ProfileDetector', () => {
  let detector: ProfileDetector;

  beforeEach(() => {
    detector = new ProfileDetector();
  });

  describe('getDefaultPaths', () => {
    it('should return macOS paths on darwin platform', () => {
      jest.spyOn(os, 'platform').mockReturnValue('darwin');
      jest.spyOn(os, 'homedir').mockReturnValue('/Users/testuser');

      const paths = detector.getDefaultPaths();

      expect(paths).toEqual({
        chrome: '/Users/testuser/Library/Application Support/Google/Chrome',
        brave: '/Users/testuser/Library/Application Support/BraveSoftware/Brave-Browser'
      });
    });

    it('should return Windows paths on win32 platform', () => {
      jest.spyOn(os, 'platform').mockReturnValue('win32');
      jest.spyOn(os, 'homedir').mockReturnValue('C:\\Users\\testuser');

      const paths = detector.getDefaultPaths();

      expect(paths).toEqual({
        chrome: 'C:\\Users\\testuser\\AppData\\Local\\Google\\Chrome\\User Data',
        brave: 'C:\\Users\\testuser\\AppData\\Local\\BraveSoftware\\Brave-Browser\\User Data'
      });
    });

    it('should return Linux paths on linux platform', () => {
      jest.spyOn(os, 'platform').mockReturnValue('linux');
      jest.spyOn(os, 'homedir').mockReturnValue('/home/testuser');

      const paths = detector.getDefaultPaths();

      expect(paths).toEqual({
        chrome: '/home/testuser/.config/google-chrome',
        brave: '/home/testuser/.config/BraveSoftware/Brave-Browser'
      });
    });
  });

  describe('getCookiesPath', () => {
    it('should construct correct cookies path', () => {
      const profilePath = '/path/to/profile';
      const cookiesPath = detector.getCookiesPath(profilePath);

      expect(cookiesPath).toBe(path.join(profilePath, 'Cookies'));
    });
  });
});