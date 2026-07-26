#!/usr/bin/env node

import { Command } from 'commander';
import { ChromeCookieExtractor } from './extractor';
import { execSync } from 'child_process';
import chalk from 'chalk';

const program = new Command();

program
  .name('auth-curl')
  .description('curl with automatic Chrome cookie authentication')
  .version('1.0.0')
  .argument('<url>', 'URL to request')
  .option('-v, --verbose', 'Show detailed output')
  .option('-o, --output <file>', 'Write output to file instead of stdout')
  .option('-H, --header <header>', 'Add custom header (can be used multiple times)', [])
  .option('-X, --request <method>', 'HTTP method (GET, POST, etc.)', 'GET')
  .option('-d, --data <data>', 'HTTP POST data')
  .option('--json', 'Send data as JSON and set content-type')
  .option('--follow-redirects', 'Follow HTTP redirects')
  .option('--insecure', 'Allow insecure SSL connections')
  .option('--max-time <seconds>', 'Maximum time in seconds for the whole operation (passed through to curl)')
  .option('--connect-timeout <seconds>', 'Maximum time in seconds for the connection phase (passed through to curl)')
  .action(async (url: string, options) => {
    try {
      // Validate curl passthrough timing options (must be positive numbers)
      const validatePositiveSeconds = (value: string, flag: string): number => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw new Error(`Invalid value for ${flag}: "${value}" (expected a positive number of seconds)`);
        }
        return parsed;
      };
      if (options.maxTime !== undefined) {
        validatePositiveSeconds(options.maxTime, '--max-time');
      }
      if (options.connectTimeout !== undefined) {
        validatePositiveSeconds(options.connectTimeout, '--connect-timeout');
      }
      // Extract domain from URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      if (options.verbose) {
        console.log(chalk.blue(`🔍 Extracting cookies for domain: ${domain}`));
      }
      
      // Extract cookies for the domain
      const extractor = new ChromeCookieExtractor();
      const cookies = await extractor.extractCookies({ domain });
      
      if (cookies.length === 0) {
        console.log(chalk.yellow(`⚠️  No cookies found for ${domain}`));
        console.log(chalk.gray('Proceeding without authentication...'));
      } else {
        const usableCookies = cookies.filter(c => c.value !== '[ENCRYPTED]');
        if (options.verbose) {
          console.log(chalk.green(`✅ Found ${cookies.length} cookies (${usableCookies.length} decrypted)`));
        }
      }
      
      // Build curl command
      const curlArgs = ['curl'];
      
      // Add default headers for better compatibility
      curlArgs.push('-H', '"User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"');
      curlArgs.push('-H', '"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"');
      curlArgs.push('-H', '"Accept-Language: en-US,en;q=0.5"');
      curlArgs.push('-H', '"Connection: keep-alive"');
      curlArgs.push('-H', '"Upgrade-Insecure-Requests: 1"');
      
      // Add compressed support - curl will handle decompression automatically
      curlArgs.push('--compressed');
      
      // Add cookies using temporary file (safer than command line)
      let tempCookieFile: string | null = null;
      if (cookies.length > 0) {
        const usableCookies = cookies.filter(c => c.value !== '[ENCRYPTED]');
        if (usableCookies.length > 0) {
          const os = require('os');
          const fs = require('fs');
          const path = require('path');
          
          tempCookieFile = path.join(os.tmpdir(), `auth-curl-cookies-${Date.now()}.txt`);
          const netscapeFormat = extractor.formatAsNetscape(usableCookies);
          fs.writeFileSync(tempCookieFile, netscapeFormat);
          
          curlArgs.push('-b', tempCookieFile!);
        }
      }
      
      // Add custom headers
      if (options.header && options.header.length > 0) {
        options.header.forEach((header: string) => {
          curlArgs.push('-H', `"${header}"`);
        });
      }
      
      // Add JSON content-type if --json flag is used
      if (options.json) {
        curlArgs.push('-H', '"Content-Type: application/json"');
      }
      
      // Add HTTP method
      if (options.request !== 'GET') {
        curlArgs.push('-X', options.request);
      }
      
      // Add data
      if (options.data) {
        curlArgs.push('-d', `"${options.data}"`);
      }
      
      // Add other options
      if (options.followRedirects) {
        curlArgs.push('-L');
      }
      
      if (options.insecure) {
        curlArgs.push('-k');
      }

      // Passthrough curl timing options
      if (options.maxTime !== undefined) {
        curlArgs.push('--max-time', String(options.maxTime));
      }

      if (options.connectTimeout !== undefined) {
        curlArgs.push('--connect-timeout', String(options.connectTimeout));
      }

      if (options.output) {
        curlArgs.push('-o', options.output);
      }
      
      // Add URL
      curlArgs.push(`"${url}"`);
      
      const curlCommand = curlArgs.join(' ');
      
      if (options.verbose) {
        console.log(chalk.blue(`🚀 Executing: ${curlCommand}`));
        console.log(chalk.gray('─'.repeat(50)));
      }
      
      // Execute curl command and cleanup
      try {
        execSync(curlCommand, { 
          encoding: 'utf8',
          stdio: options.output ? 'pipe' : 'inherit'
        });
        
        if (options.output) {
          console.log(chalk.green(`✅ Output saved to ${options.output}`));
        }
      } catch (error) {
        if (options.verbose) {
          console.error(chalk.red('❌ curl command failed:'), error);
        }
        process.exit(1);
      } finally {
        // Cleanup temporary cookie file
        if (tempCookieFile) {
          try {
            const fs = require('fs');
            fs.unlinkSync(tempCookieFile);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), (error as Error).message);
      process.exit(1);
    }
  });

// Add help examples
program.addHelpText('after', `
Examples:
  $ auth-curl https://github.com/user/repo
  $ auth-curl https://api.github.com/user -v
  $ auth-curl https://example.com/api -X POST -d '{"key":"value"}' --json
  $ auth-curl https://myaccount.google.com/profile -o profile.html
  $ auth-curl https://private-site.com -H "Accept: application/json" -v
  $ auth-curl https://example.com/slow --max-time 20 --connect-timeout 5
`);

if (require.main === module) {
  program.parse();
}

export default program;