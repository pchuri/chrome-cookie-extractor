import * as crypto from 'crypto';
import * as os from 'os';
import { execSync } from 'child_process';

export class CookieDecryptor {
  private static readonly CHROME_SAFE_STORAGE_SERVICES = [
    'Chrome Safe Storage',
    'Chromium Safe Storage',
    'Brave Safe Storage',
    'Edge Safe Storage'
  ];

  static decryptValue(encryptedValue: Buffer): string {
    if (os.platform() !== 'darwin') {
      // Non-macOS platforms - return as is (might not be encrypted)
      return encryptedValue.toString('utf8');
    }

    try {
      // Check for Chrome v80+ encryption prefix
      if (encryptedValue.subarray(0, 3).toString() === 'v10' || 
          encryptedValue.subarray(0, 3).toString() === 'v11') {
        
        // Get Chrome Safe Storage password from Keychain
        const password = this.getChromeSafeStoragePassword();
        if (!password) {
          return '[ENCRYPTED]';
        }

        // Derive AES key using PBKDF2
        const salt = Buffer.from('saltysalt');
        const iterations = 1003;
        const keyLength = 16;
        
        const key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha1');

        // Extract the encrypted data after removing v10/v11 prefix
        const encryptedData = encryptedValue.subarray(3); // Remove v10/v11 prefix
        
        // Use AES-CBC decryption based on pycookiecheat implementation
        try {
          // Chrome uses AES-CBC with fixed IV of 16 space characters
          const iv = Buffer.alloc(16, ' '); // 16 bytes of space character as IV
          
          const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
          decipher.setAutoPadding(false); // Handle padding manually
          
          let decrypted = Buffer.concat([
            decipher.update(encryptedData), // Use encrypted data after prefix removal
            decipher.final()
          ]);
          
          // Remove PKCS7 padding manually
          const paddingLength = decrypted[decrypted.length - 1];
          if (paddingLength && paddingLength <= 16) {
            decrypted = decrypted.subarray(0, decrypted.length - paddingLength);
          }
          
          const result = decrypted.toString('utf8');
          
          if (result && result.length > 0 && result.length < 10000 && !result.includes('\0')) {
            return result;
          }
        } catch (e) {
          // Silent fail - decryption not possible
        }
        
        return '[ENCRYPTED]';
      } else {
        // Older encryption format or unencrypted
        const result = encryptedValue.toString('utf8');
        // Check if it looks like valid cookie data (no null bytes)
        if (result && result.length > 0 && !result.includes('\0')) {
          return result;
        }
        return '[ENCRYPTED]';
      }
    } catch (error) {
      console.error('Cookie decryption failed:', error);
      return '[ENCRYPTED]';
    }
  }

  private static getChromeSafeStoragePassword(): Buffer | null {
    try {
      // First try the simple approach that works
      try {
        const result = execSync('security find-generic-password -w -s "Chrome Safe Storage"', { 
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        const password = result.trim();
        if (password) {
          return Buffer.from(password, 'base64');
        }
      } catch (error) {
        // Fall back to the comprehensive approach
      }
      
      // Try different service names and account names
      const usernames = [
        process.env.USER,
        process.env.LOGNAME,
        os.userInfo().username,
        'al02628760' // Fallback
      ].filter(Boolean);

      for (const service of this.CHROME_SAFE_STORAGE_SERVICES) {
        for (const username of usernames) {
          try {
            const command = [
              'security',
              'find-generic-password',
              '-w',
              '-s', `"${service}"`,
              '-a', `"${username}"`
            ];

            const result = execSync(command.join(' '), { 
              encoding: 'utf8',
              stdio: ['pipe', 'pipe', 'pipe']
            });

            const password = result.trim();
            if (password) {
              return Buffer.from(password, 'base64');
            }
          } catch (error) {
            // Continue trying other combinations
            continue;
          }
        }
      }

      console.error('Could not find Chrome Safe Storage password in Keychain');
      return null;
    } catch (error) {
      console.error('Error accessing Keychain:', error);
      return null;
    }
  }
}
