// scripts/test-deployment.js
// Simple script to verify deployment files

const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), 'out');

console.log('🔍 Checking deployment files...\n');

// Check if out directory exists
if (!fs.existsSync(outDir)) {
  console.error('❌ Error: out/ directory not found. Run `npm run export` first.');
  process.exit(1);
}

console.log('✅ out/ directory exists');

// Check for essential files
const essentialFiles = [
  'index.html',
  '.htaccess',
  '_next/static/chunks/main.js',
  '_next/static/chunks/pages/_app.js'
];

for (const file of essentialFiles) {
  const filePath = path.join(outDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ Found: ${file}`);
  } else {
    console.warn(`⚠️  Missing: ${file}`);
  }
}

// Check .htaccess content
const htaccessPath = path.join(outDir, '.htaccess');
if (fs.existsSync(htaccessPath)) {
  const content = fs.readFileSync(htaccessPath, 'utf8');
  if (content.includes('RewriteEngine On')) {
    console.log('✅ .htaccess has rewrite rules');
  } else {
    console.warn('⚠️  .htaccess may be missing rewrite rules');
  }
  
  if (content.includes('LiteSpeed')) {
    console.log('✅ .htaccess has LiteSpeed configuration');
  } else {
    console.warn('ℹ️  .htaccess does not have LiteSpeed specific configuration');
  }
}

console.log('\n📋 Deployment check complete.');
console.log('\nNext steps:');
console.log('1. Upload all files from the out/ directory to your server');
console.log('2. Ensure .htaccess file is uploaded (it\'s a hidden file)');
console.log('3. Check file permissions (644 for files, 755 for directories)');
console.log('4. Verify your domain points to the correct directory');