#!/usr/bin/env node

// Simple smoke test to verify the main modules can be imported
try {
  require('./dist/cli.js');
  require('./dist/auth-curl.js');
  require('./dist/extractor.js');
  require('./dist/decryptor.js');
  
  console.log('✅ All modules loaded successfully');
  process.exit(0);
} catch (error) {
  console.error('❌ Module loading failed:', error.message);
  process.exit(1);
}