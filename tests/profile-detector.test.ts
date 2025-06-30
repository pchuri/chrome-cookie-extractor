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
  });

  describe('detectBraveProfiles', () => {
    it('should return empty array if Brave directory does not exist', () => {
      mockOs.platform.mockReturnValue('darwin');
      mockOs.homedir.mockReturnValue('/Users/testuser');
      mockFs.existsSync.mockReturnValue(false);

      const profiles = ProfileDetector.detectBraveProfiles();

      expect(profiles).toEqual([]);
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