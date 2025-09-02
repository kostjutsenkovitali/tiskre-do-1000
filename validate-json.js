const fs = require('fs');
const path = require('path');

const files = ['en.json', 'et.json', 'de.json', 'fi.json', 'fr.json', 'sv.json'];
const messagesDir = './src/messages';

files.forEach(f => {
  try {
    const filePath = path.join(messagesDir, f);
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    console.log(`${f}: OK`);
  } catch (e) {
    console.log(`${f}: ERROR - ${e.message}`);
  }
});