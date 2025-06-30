#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ChromeCookieExtractor } from './extractor';
import * as os from 'os';

const program = new Command();

program
  .name('chrome-cookies')
  .description('Extract Chrome cookies and convert to curl-compatible format')
  .version('1.0.0');

program
  .option('-d, --domain <domain>', 'Extract cookies for specific domain only')
  .option('-o, --output <file>', 'Output file path', 'cookies.txt')
  .option('-p, --profile <profile>', 'Chrome profile name (Default, Profile 1, etc.)')
  .option('--curl', 'Output in curl header format')
  .option('--json', 'Output in JSON format')
  .option('--list-profiles', 'List available Chrome profiles')
  .option('--verbose', 'Verbose output');

program.action(async (options) => {
  try {
    const extractor = new ChromeCookieExtractor();
    const profiles = extractor.getProfiles();

    if (options.listProfiles) {
      console.log(chalk.blue('Available Chrome/Brave profiles:'));
      if (profiles.length === 0) {
        console.log(chalk.yellow('No profiles found'));
        console.log(chalk.gray('Make sure Chrome or Brave is installed and has been run at least once.'));
        return;
      }
      
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${chalk.green(profile.name)} - ${chalk.gray(profile.path)}`);
      });
      return;
    }

    if (profiles.length === 0) {
      console.error(chalk.red('❌ No Chrome/Brave profiles found'));
      console.error(chalk.gray('Make sure Chrome or Brave is installed and has been run at least once.'));
      process.exit(1);
    }

    if (options.verbose) {
      console.log(chalk.blue(`Found ${profiles.length} profile(s)`));
      profiles.forEach(profile => {
        console.log(chalk.gray(`  - ${profile.name}: ${profile.cookiesPath}`));
      });
    }

    const extractorOptions: any = {};
    
    if (options.domain) {
      extractorOptions.domain = options.domain;
    }
    
    if (options.profile) {
      extractorOptions.profiles = [options.profile];
    }

    if (options.verbose) {
      console.log(chalk.blue('Extracting cookies...'));
      if (os.platform() === 'darwin') {
        console.log(chalk.yellow('Note: On macOS, encrypted cookies will be decrypted if possible.'));
      }
    }

    const cookies = await extractor.extractCookies(extractorOptions);

    if (cookies.length === 0) {
      console.error(chalk.yellow('⚠️  No cookies found'));
      if (options.domain) {
        console.error(chalk.gray(`Try without domain filter or check if '${options.domain}' is correct`));
      }
      process.exit(1);
    }

    const encryptedCount = cookies.filter(c => c.value === '[ENCRYPTED]').length;
    const validCount = cookies.length - encryptedCount;

    if (options.verbose) {
      console.log(chalk.green(`✅ Extracted ${cookies.length} cookie(s)`));
      if (encryptedCount > 0) {
        console.log(chalk.yellow(`⚠️  ${encryptedCount} cookie(s) are encrypted and could not be decrypted`));
      }
      console.log(chalk.green(`📊 ${validCount} usable cookie(s)`));
    }

    if (options.json) {
      console.log(extractor.formatAsJson(cookies));
    } else if (options.curl) {
      const curlFormat = extractor.formatAsCurl(cookies);
      if (curlFormat) {
        console.log(curlFormat);
      } else {
        console.error(chalk.red('❌ No usable cookies found (all encrypted)'));
        process.exit(1);
      }
    } else {
      // Save as Netscape format
      await extractor.saveCookiesFile(cookies, options.output);
      console.log(chalk.green(`✅ Cookies saved to ${options.output}`));
      
      if (options.verbose) {
        console.log(chalk.blue('\nUsage examples:'));
        console.log(chalk.gray(`  curl -b ${options.output} https://example.com`));
        console.log(chalk.gray(`  wget --load-cookies ${options.output} https://example.com`));
      }
    }

  } catch (error) {
    console.error(chalk.red('❌ Error:'), (error as Error).message);
    if (options.verbose && (error as Error).stack) {
      console.error(chalk.gray((error as Error).stack));
    }
    process.exit(1);
  }
});

if (require.main === module) {
  program.parse();
}

export default program;
