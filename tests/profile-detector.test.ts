import { ProfileDetector } from '../src/profile-detector';
import * as os from 'os';
import * as fs from 'fs';

// Mock fs and os modules
jest.mock('fs');
jest.mock('os');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockOs = os as jest.Mocked<typeof os>;

describe('ProfileDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectChromeProfiles', () => {
    it('should return empty array if Chrome directory does not exist', () => {
      mockOs.platform.mockReturnValue('darwin');
      mockOs.homedir.mockReturnValue('/Users/testuser');
      mockFs.existsSync.mockReturnValue(false);

      const profiles = ProfileDetector.detectChromeProfiles();

      expect(profiles).toEqual([]);
    });

    it('should detect Chrome profiles on macOS', () => {
      mockOs.platform.mockReturnValue('darwin');
      mockOs.homedir.mockReturnValue('/Users/testuser');
      mockFs.existsSync.mockImplementation((path: any) => {
        const pathStr = path.toString();
        // Mock Chrome base directory exists
        if (pathStr === '/Users/testuser/Library/Application Support/Google/Chrome') {
          return true;
        }
        // Mock Default profile cookies exist
        if (pathStr === '/Users/testuser/Library/Application Support/Google/Chrome/Default/Cookies') {
          return true;
        }
        return false;
      });

      const profiles = ProfileDetector.detectChromeProfiles();

      expect(profiles.length).toBeGreaterThan(0);
      expect(profiles[0]).toHaveProperty('name');
      expect(profiles[0]).toHaveProperty('path');
      expect(profiles[0]).toHaveProperty('cookiesPath');
    });

    it('should detect Chrome profiles on win32', () => {
      mockOs.platform.mockReturnValue('win32');
      mockOs.homedir.mockReturnValue('C:/Users/test');
      mockFs.existsSync.mockImplementation((p: any) => {
        const s = p.toString();
        if (s === 'C:/Users/test/AppData/Local/Google/Chrome/User Data') return true;
        if (s === 'C:/Users/test/AppData/Local/Google/Chrome/User Data/Default/Cookies') return true;
        return false;
      });

      const profiles = ProfileDetector.detectChromeProfiles();
      expect(profiles.length).toBeGreaterThan(0);
    });

    it('should detect Chrome profiles on linux', () => {
      mockOs.platform.mockReturnValue('linux');
      mockOs.homedir.mockReturnValue('/home/test');
      mockFs.existsSync.mockImplementation((p: any) => {
        const s = p.toString();
        if (s === '/home/test/.config/google-chrome') return true;
        if (s === '/home/test/.config/google-chrome/Default/Cookies') return true;
        return false;
      });

      const profiles = ProfileDetector.detectChromeProfiles();
      expect(profiles.length).toBeGreaterThan(0);
    });

    it('should throw on unsupported platform', () => {
      mockOs.platform.mockReturnValue('aix');
      mockOs.homedir.mockReturnValue('/tmp');
      expect(() => ProfileDetector.detectChromeProfiles()).toThrow();
    });
  });

  describe('detectBraveProfiles', () => {
    it('should return empty array if Brave directory does not exist', () => {
      mockOs.platform.mockReturnValue('darwin');
      mockOs.homedir.mockReturnValue('/Users/testuser');
      mockFs.existsSync.mockReturnValue(false);

      const profiles = ProfileDetector.detectBraveProfiles();

      expect(profiles).toEqual([]);
    });

    it('should detect Brave profiles on linux', () => {
      mockOs.platform.mockReturnValue('linux');
      mockOs.homedir.mockReturnValue('/home/test');
      mockFs.existsSync.mockImplementation((p: any) => {
        const s = p.toString();
        if (s === '/home/test/.config/BraveSoftware/Brave-Browser') return true;
        if (s === '/home/test/.config/BraveSoftware/Brave-Browser/Default/Cookies') return true;
        return false;
      });

      const profiles = ProfileDetector.detectBraveProfiles();
      expect(profiles.length).toBeGreaterThan(0);
    });

    it('should detect Brave profiles on win32', () => {
      mockOs.platform.mockReturnValue('win32');
      mockOs.homedir.mockReturnValue('C:/Users/test');
      mockFs.existsSync.mockImplementation((p: any) => {
        const s = p.toString();
        if (s === 'C:/Users/test/AppData/Local/BraveSoftware/Brave-Browser/User Data') return true;
        if (s === 'C:/Users/test/AppData/Local/BraveSoftware/Brave-Browser/User Data/Default/Cookies') return true;
        return false;
      });

      const profiles = ProfileDetector.detectBraveProfiles();
      expect(profiles.length).toBeGreaterThan(0);
    });
  });

  describe('detectAllProfiles', () => {
    it('should combine Chrome and Brave profiles', () => {
      mockOs.platform.mockReturnValue('darwin');
      mockOs.homedir.mockReturnValue('/Users/testuser');
      mockFs.existsSync.mockReturnValue(false);

      const profiles = ProfileDetector.detectAllProfiles();

      expect(Array.isArray(profiles)).toBe(true);
    });
  });
});