# Chrome Cookie Extractor

A TypeScript/Node.js tool to extract cookies from Chrome and Brave browsers and convert them to curl-compatible formats.

## Features

- 🍪 Extract cookies from Chrome and Brave browsers
- 🔒 **Decrypt encrypted cookies on macOS** - Full AES-CBC decryption support!
- 📱 Support for multiple browser profiles
- 🌐 Cross-platform support (macOS, Windows, Linux)
- 📋 Multiple output formats:
  - Netscape format (cookies.txt)
  - curl header format
  - JSON format
- 🎯 Domain filtering
- 🚀 **Fast extraction even while Chrome is running**
- ⚡ **Complete Chrome v10/v11 cookie decryption** using Keychain access

## Installation

### Global Installation (Recommended)
```bash
npm install -g chrome-cookie-extractor
```

After installation, you'll have access to two commands:
- `chrome-cookies` - Extract cookies to files or formats
- `auth-curl` - **NEW!** curl with automatic authentication

### Local Installation
```bash
npm install chrome-cookie-extractor
```

### Using npx (No Installation)
```bash
npx chrome-cookie-extractor --help
npx chrome-cookie-extractor auth-curl https://example.com
```

## Usage

### New: auth-curl - Authenticated curl

The easiest way to use this tool! `auth-curl` automatically extracts cookies for any domain and uses them with curl:

```bash
# Access any authenticated site with your Chrome session
auth-curl https://github.com/user/repo

# Get your Google account info  
auth-curl https://myaccount.google.com/profile

# API calls with authentication
auth-curl https://api.github.com/user

# POST requests with authentication
auth-curl https://api.example.com/data -X POST -d '{"key":"value"}' --json

# Save response to file
auth-curl https://private-site.com/data.json -o data.json

# Verbose output to see what's happening
auth-curl https://example.com -v
```

### Traditional: chrome-cookies

### Basic Usage
```bash
# Extract all cookies to cookies.txt
chrome-cookies

# Extract cookies for a specific domain
chrome-cookies -d google.com

# List available browser profiles
chrome-cookies --list-profiles
```

### Output Formats
```bash
# Save as Netscape format (default)
chrome-cookies -d example.com -o my-cookies.txt

# Output as curl header
chrome-cookies -d example.com --curl

# Output as JSON
chrome-cookies -d example.com --json
```

### Advanced Usage
```bash
# Extract from specific profile
chrome-cookies -p "Profile 1" -d github.com

# Verbose output with detailed information
chrome-cookies -d example.com --verbose

# Combine with curl
COOKIES=$(chrome-cookies -d example.com --curl)
curl $COOKIES https://example.com/api
```

## Command Line Options

### auth-curl Options

| Option | Description |
|--------|-------------|
| `<url>` | URL to request (required) |
| `-v, --verbose` | Show detailed output including cookies found |
| `-o, --output <file>` | Write response to file instead of stdout |
| `-H, --header <header>` | Add custom header (can be used multiple times) |
| `-X, --request <method>` | HTTP method (GET, POST, etc.) |
| `-d, --data <data>` | HTTP POST data |
| `--json` | Send data as JSON and set content-type |
| `--follow-redirects` | Follow HTTP redirects |
| `--insecure` | Allow insecure SSL connections |

### chrome-cookies Options

| Option | Description |
|--------|-------------|
| `-d, --domain <domain>` | Extract cookies for specific domain only |
| `-o, --output <file>` | Output file path (default: cookies.txt) |
| `-p, --profile <profile>` | Chrome profile name (Default, Profile 1, etc.) |
| `--curl` | Output in curl header format |
| `--json` | Output in JSON format |
| `--list-profiles` | List available Chrome/Brave profiles |
| `--verbose` | Verbose output with detailed information |
| `--help` | Show help information |
| `--version` | Show version number |

## Using with curl

### Method 1: Using cookies.txt file
```bash
# Generate cookies file
chrome-cookies -d example.com

# Use with curl
curl -b cookies.txt https://example.com/api
```

### Method 2: Direct header injection
```bash
# Get curl header format and use directly
COOKIES=$(chrome-cookies -d example.com --curl)
curl $COOKIES https://example.com/api
```

### Method 3: One-liner
```bash
curl $(chrome-cookies -d example.com --curl) https://example.com/api
```

## Browser Support

- ✅ Google Chrome
- ✅ Brave Browser
- ✅ Multiple profiles
- ✅ All platforms (macOS, Windows, Linux)

## Platform-specific Notes

### macOS Cookie Decryption

This tool now supports **full decryption** of Chrome's encrypted cookies on macOS:

- ✅ **AES-CBC decryption** with Keychain integration
- ✅ **Chrome v10/v11 format support** 
- ✅ **Automatic key derivation** from system keychain
- ✅ **Works with Chrome running** - no need to close browser

#### Setup for macOS Decryption

1. **Grant Keychain Access**: The tool needs access to Chrome's encryption key stored in macOS Keychain
2. **Terminal Permissions**: Ensure your terminal has "Full Disk Access" in System Preferences > Security & Privacy
3. **First Run**: You may be prompted to allow keychain access - click "Always Allow"

### macOS
- **Full encrypted cookie decryption support**
- Accesses Chrome Safe Storage key from Keychain automatically
- Works with Chrome v10/v11 encryption format
- No manual setup required after initial keychain permission

### Windows
- Supports standard Chrome cookie extraction
- May require running as administrator for some profiles

### Linux
- Standard SQLite extraction
- Works with most Chrome installations

## Programmatic Usage

```typescript
import { ChromeCookieExtractor } from 'chrome-cookie-extractor';

const extractor = new ChromeCookieExtractor();

// Get available profiles
const profiles = extractor.getProfiles();
console.log('Available profiles:', profiles);

// Extract cookies
const cookies = await extractor.extractCookies({
  domain: 'example.com',
  profiles: ['Default']
});

// Format output
const curlFormat = extractor.formatAsCurl(cookies);
const jsonFormat = extractor.formatAsJson(cookies);
const netscapeFormat = extractor.formatAsNetscape(cookies);
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Sensitive Data**: Cookies may contain sensitive authentication tokens and personal data
2. **Encrypted Cookies**: On macOS, the tool may access your Keychain to decrypt cookies
3. **File Permissions**: Ensure cookie files are stored securely and not committed to version control
4. **Browser State**: For best results, close Chrome/Brave before extraction

## Troubleshooting

### No profiles found
- Ensure Chrome or Brave is installed and has been run at least once
- Check that browser profiles exist in standard locations
- Use `--list-profiles` to see available profiles

### Permission denied errors
- On macOS: Grant Terminal/iTerm access to Full Disk Access in System Preferences
- On Windows: Run as administrator if needed
- On Linux: Check file permissions for Chrome profile directories

### Encrypted cookies show as [ENCRYPTED]
- **macOS**: This tool now fully decrypts Chrome cookies automatically
- **First time setup**: Grant keychain access when prompted  
- **Permissions**: Ensure Terminal has "Full Disk Access" in System Preferences
- If decryption still fails, check that Chrome Safe Storage is accessible in Keychain Access.app

### Database locked errors
- **No longer required**: Tool works even while Chrome is running
- Uses direct database access with timeout handling
- Automatically falls back to temporary copy method if needed

## Examples

### Real-world Authentication Example

```bash
# Extract Google authentication cookies
chrome-cookies -d google.com --curl

# Use with curl to access authenticated Google services
GOOGLE_COOKIES=$(chrome-cookies -d google.com --curl)
curl $GOOGLE_COOKIES "https://myaccount.google.com/profile"

# Extract GitHub cookies for API access
chrome-cookies -d github.com -o github-cookies.txt
curl -b github-cookies.txt "https://api.github.com/user"
```

### Web Scraping with Python requests
```python
import requests

# Extract cookies using the tool
cookies = subprocess.check_output(['chrome-cookies', '-d', 'example.com', '--json'])
cookie_dict = json.loads(cookies)

# Convert to requests format
session = requests.Session()
for cookie in cookie_dict:
    session.cookies.set(cookie['name'], cookie['value'], domain=cookie['domain'])

response = session.get('https://example.com/api')
```

### Using with wget
```bash
# Generate cookies file
chrome-cookies -d example.com

# Use with wget
wget --load-cookies cookies.txt https://example.com/file.zip
```

### Integration with scripts
```bash
#!/bin/bash

# Extract cookies for multiple domains
for domain in "github.com" "google.com" "stackoverflow.com"; do
    echo "Extracting cookies for $domain..."
    chrome-cookies -d "$domain" -o "${domain}.cookies.txt"
done
```

## Building from Source

```bash
git clone https://github.com/pchuri/chrome-cookie-extractor
cd chrome-cookie-extractor

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
npm start -- --help

# Create binary executables
npm run package
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

### v1.0.0
- Initial TypeScript implementation  
- Support for Chrome and Brave browsers
- Cross-platform compatibility
- Multiple output formats
- **Full AES-CBC cookie decryption on macOS**
- **Chrome v10/v11 encryption support**
- **Works while Chrome is running**
- **Complete Keychain integration**
- CLI interface with comprehensive options
