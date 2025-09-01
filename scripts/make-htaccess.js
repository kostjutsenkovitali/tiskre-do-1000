// scripts/make-htaccess.js
const fs = require("fs");
const path = require("path");
const outDir = path.join(process.cwd(), "out");
if (!fs.existsSync(outDir)) {
  console.error("out/ not found. Run `npm run export` first.");
  process.exit(1);
}
const htaccess = `
Options -MultiViews
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
`.trimStart();
fs.writeFileSync(path.join(outDir, ".htaccess"), htaccess, "utf8");
console.log("Wrote out/.htaccess");
