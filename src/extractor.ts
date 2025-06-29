import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Cookie, ChromeProfile, ExtractorOptions } from './types';
import { ProfileDetector } from './profile-detector';
import { CookieDecryptor } from './decryptor';

export class ChromeCookieExtractor {
  private profiles: ChromeProfile[];

  constructor() {
    this.profiles = ProfileDetector.detectAllProfiles();
  }

  getProfiles(): ChromeProfile[] {
    return this.profiles;
  }

  async extractCookies(options: ExtractorOptions = {}): Promise<Cookie[]> {
    if (this.profiles.length === 0) {
      throw new Error('No Chrome/Brave profiles found');
    }

    const allCookies: Cookie[] = [];
    const { domain, profiles: requestedProfiles } = options;

    const profilesToProcess = requestedProfiles
      ? this.profiles.filter(p => requestedProfiles.includes(p.name))
      : this.profiles;

    for (const profile of profilesToProcess) {
      try {
        const cookies = await this.extractFromDatabase(profile.cookiesPath, domain);
        allCookies.push(...cookies);
      } catch (error) {
        console.error(`Warning: Failed to extract cookies from ${profile.name}:`, error);
      }
    }

    return allCookies;
  }

  private async extractFromDatabase(cookiesPath: string, domain?: string): Promise<Cookie[]> {
    return new Promise((resolve, reject) => {
      // Try direct access first without copying
      const db = new sqlite3.Database(cookiesPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          // If direct access fails, try the copy method
          this.extractFromDatabaseWithCopy(cookiesPath, domain)
            .then(resolve)
            .catch(reject);
          return;
        }
        
        // Set busy timeout to handle locks
        db.run("PRAGMA busy_timeout = 30000", (err) => {
          if (err) {
            console.warn('Could not set busy timeout:', err);
          }
        });
        
        // Check table structure
        db.all("PRAGMA table_info(cookies)", (err, rows: any[]) => {
          if (err) {
            db.close();
            reject(err);
            return;
          }
          
          const columns = rows.map(row => row.name);
          const hasEncryptedValue = columns.includes('encrypted_value');
          
          let query: string;
          let params: any[] = [];
          
          if (hasEncryptedValue) {
            query = `
              SELECT name, value, encrypted_value, host_key, path, expires_utc, 
                     is_secure, is_httponly, creation_utc
              FROM cookies
            `;
          } else {
            query = `
              SELECT name, value, host_key, path, expires_utc, 
                     is_secure, is_httponly, creation_utc
              FROM cookies
            `;
          }
          
          if (domain) {
            query += ' WHERE host_key LIKE ?';
            params.push(`%${domain}%`);
          }
          
          db.all(query, params, (err, rows: any[]) => {
            if (err) {
              db.close();
              reject(err);
              return;
            }
            
            const cookies: Cookie[] = [];
            
            for (const row of rows) {
              let finalValue: string;
              
              if (hasEncryptedValue && row.encrypted_value) {
                // Try to decrypt the encrypted value
                const decryptedValue = CookieDecryptor.decryptValue(row.encrypted_value);
                finalValue = decryptedValue !== '[ENCRYPTED]' ? decryptedValue : row.value || '[ENCRYPTED]';
              } else {
                finalValue = row.value || '';
              }
              
              cookies.push({
                name: row.name,
                value: finalValue,
                domain: row.host_key,
                path: row.path,
                expires: row.expires_utc,
                secure: Boolean(row.is_secure),
                httponly: Boolean(row.is_httponly),
                creationTime: row.creation_utc
              });
            }
            
            db.close();
            resolve(cookies);
          });
        });
      });
    });
  }

  private async extractFromDatabaseWithCopy(cookiesPath: string, domain?: string): Promise<Cookie[]> {
    // Create temporary copy to avoid database lock issues
    const tempDir = os.tmpdir();
    const tempCookiesPath = path.join(tempDir, `cookies_${Date.now()}_${Math.random().toString(36).slice(2)}.db`);
    
    try {
      fs.copyFileSync(cookiesPath, tempCookiesPath);
      
      return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(tempCookiesPath, sqlite3.OPEN_READONLY, (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Check table structure
          db.all("PRAGMA table_info(cookies)", (err, rows: any[]) => {
            if (err) {
              db.close();
              reject(err);
              return;
            }
            
            const columns = rows.map(row => row.name);
            const hasEncryptedValue = columns.includes('encrypted_value');
            
            let query: string;
            let params: any[] = [];
            
            if (hasEncryptedValue) {
              query = `
                SELECT name, value, encrypted_value, host_key, path, expires_utc, 
                       is_secure, is_httponly, creation_utc
                FROM cookies
              `;
            } else {
              query = `
                SELECT name, value, host_key, path, expires_utc, 
                       is_secure, is_httponly, creation_utc
                FROM cookies
              `;
            }
            
            if (domain) {
              query += ' WHERE host_key LIKE ?';
              params.push(`%${domain}%`);
            }
            
            db.all(query, params, (err, rows: any[]) => {
              if (err) {
                db.close();
                reject(err);
                return;
              }
              
              const cookies: Cookie[] = [];
              
              for (const row of rows) {
                let finalValue: string;
                
                if (hasEncryptedValue && row.encrypted_value) {
                  // Try to decrypt the encrypted value
                  const decryptedValue = CookieDecryptor.decryptValue(row.encrypted_value);
                  finalValue = decryptedValue !== '[ENCRYPTED]' ? decryptedValue : row.value || '[ENCRYPTED]';
                } else {
                  finalValue = row.value || '';
                }
                
                cookies.push({
                  name: row.name,
                  value: finalValue,
                  domain: row.host_key,
                  path: row.path,
                  expires: row.expires_utc,
                  secure: Boolean(row.is_secure),
                  httponly: Boolean(row.is_httponly),
                  creationTime: row.creation_utc
                });
              }
              
              db.close();
              resolve(cookies);
            });
          });
        });
      });
      
    } finally {
      // Clean up temporary file
      if (fs.existsSync(tempCookiesPath)) {
        fs.unlinkSync(tempCookiesPath);
      }
    }
  }

  formatAsNetscape(cookies: Cookie[]): string {
    const lines = ['# Netscape HTTP Cookie File'];
    
    for (const cookie of cookies) {
      // Skip encrypted cookies
      if (cookie.value === '[ENCRYPTED]') {
        continue;
      }
      
      // Convert Chrome's expires_utc (Windows FILETIME) to Unix timestamp
      const expires = cookie.expires > 0 
        ? Math.floor((cookie.expires - 11644473600000000) / 1000000)
        : 0;
      
      const domain = cookie.domain;
      const domainFlag = domain.startsWith('.') ? 'TRUE' : 'FALSE';
      const path = cookie.path;
      const secure = cookie.secure ? 'TRUE' : 'FALSE';
      const name = cookie.name;
      const value = cookie.value;
      
      lines.push(`${domain}\t${domainFlag}\t${path}\t${secure}\t${expires}\t${name}\t${value}`);
    }
    
    return lines.join('\n');
  }

  formatAsCurl(cookies: Cookie[]): string {
    const validCookies = cookies.filter(c => c.value !== '[ENCRYPTED]');
    
    if (validCookies.length === 0) {
      return '';
    }
    
    const cookiePairs = validCookies.map(c => `${c.name}=${c.value}`);
    return `-H "Cookie: ${cookiePairs.join('; ')}"`;
  }

  formatAsJson(cookies: Cookie[]): string {
    return JSON.stringify(cookies, null, 2);
  }

  async saveCookiesFile(cookies: Cookie[], outputPath: string): Promise<void> {
    const netscapeFormat = this.formatAsNetscape(cookies);
    fs.writeFileSync(outputPath, netscapeFormat, 'utf8');
  }
}
