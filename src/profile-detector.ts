import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { ChromeProfile, Platform } from './types';

export class ProfileDetector {
  private static readonly PROFILE_NAMES = ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4'];

  static detectChromeProfiles(): ChromeProfile[] {
    const platform = os.platform() as Platform;
    const homeDir = os.homedir();
    
    let chromeBasePath: string;
    
    switch (platform) {
      case Platform.DARWIN:
        chromeBasePath = path.join(homeDir, 'Library/Application Support/Google/Chrome');
        break;
      case Platform.WIN32:
        chromeBasePath = path.join(homeDir, 'AppData/Local/Google/Chrome/User Data');
        break;
      case Platform.LINUX:
        chromeBasePath = path.join(homeDir, '.config/google-chrome');
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!fs.existsSync(chromeBasePath)) {
      return [];
    }

    const profiles: ChromeProfile[] = [];

    for (const profileName of this.PROFILE_NAMES) {
      const profilePath = path.join(chromeBasePath, profileName);
      const cookiesPath = path.join(profilePath, 'Cookies');

      if (fs.existsSync(cookiesPath)) {
        profiles.push({
          name: profileName,
          path: profilePath,
          cookiesPath
        });
      }
    }

    return profiles;
  }

  static detectBraveProfiles(): ChromeProfile[] {
    const platform = os.platform() as Platform;
    const homeDir = os.homedir();
    
    let braveBasePath: string;
    
    switch (platform) {
      case Platform.DARWIN:
        braveBasePath = path.join(homeDir, 'Library/Application Support/BraveSoftware/Brave-Browser');
        break;
      case Platform.WIN32:
        braveBasePath = path.join(homeDir, 'AppData/Local/BraveSoftware/Brave-Browser/User Data');
        break;
      case Platform.LINUX:
        braveBasePath = path.join(homeDir, '.config/BraveSoftware/Brave-Browser');
        break;
      default:
        return [];
    }

    if (!fs.existsSync(braveBasePath)) {
      return [];
    }

    const profiles: ChromeProfile[] = [];

    for (const profileName of this.PROFILE_NAMES) {
      const profilePath = path.join(braveBasePath, profileName);
      const cookiesPath = path.join(profilePath, 'Cookies');

      if (fs.existsSync(cookiesPath)) {
        profiles.push({
          name: `Brave-${profileName}`,
          path: profilePath,
          cookiesPath
        });
      }
    }

    return profiles;
  }

  static detectAllProfiles(): ChromeProfile[] {
    return [
      ...this.detectChromeProfiles(),
      ...this.detectBraveProfiles()
    ];
  }
}
