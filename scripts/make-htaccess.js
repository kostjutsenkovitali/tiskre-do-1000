// scripts/make-htaccess.js
const fs = require("fs");
const path = require("path");
const outDir = path.join(process.cwd(), "out");
if (!fs.existsSync(outDir)) {
  console.error("out/ not found. Run \`npm run export\` first.");
  process.exit(1);
}
const htaccess = `
# Enable rewrite engine
RewriteEngine On
RewriteBase /

# Handle authorization headers
RewriteCond %{HTTP:Authorization} .
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

# Redirect Trailing Slashes If Not A Folder
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} (.+)/$
RewriteRule ^ %1 [L,R=301]

# Serve existing files and directories directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Route all other requests to index.html for Next.js routing
RewriteRule ^.*$ /index.html [L]

# Security headers for LiteSpeed
<IfModule LiteSpeed>
  # Disable LSWS cache for dynamic content
  RewriteEngine On
  RewriteRule ^.*$ - [E=Cache-Control:no-cache]
</IfModule>

# Security and performance headers
<IfModule mod_headers.c>
  # Security headers
  Header always set X-Content-Type-Options nosniff
  Header always set X-Frame-Options DENY
  Header always set X-XSS-Protection "1; mode=block"
  
  # CORS headers
  Header always set Access-Control-Allow-Origin "*"
  Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>

# Enable compression for text files
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
</IfModule>

# Cache static files
<IfModule mod_expires.c>
  ExpiresActive on
  ExpiresByType image/gif "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/webp "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 month"
  ExpiresByType audio/mpeg "access plus 1 month"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType text/javascript "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
  ExpiresByType application/json "access plus 1 hour"
</IfModule>

# Directory access rules
Options -Indexes
Options +FollowSymLinks
DirectoryIndex index.html

# Allow access to static files
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp3|webp|pdf)$">
  Order allow,deny
  Allow from all
</FilesMatch>

# Allow access to main files
<FilesMatch "^(index\.html|robots\.txt|sitemap\.xml)$">
  Order allow,deny
  Allow from all
</FilesMatch>
`.trimStart();
fs.writeFileSync(path.join(outDir, ".htaccess"), htaccess, "utf8");
console.log("Wrote out/.htaccess");