# Deployment Instructions

## Build Process

1. Clean previous builds:
   ```bash
   npm run clean
   ```

2. Build and export the static site:
   ```bash
   npm run build
   npm run export
   ```

3. This creates an \`out\` directory with all static files including an \`.htaccess\` file.

4. Test the deployment files:
   ```bash
   npm run test:deploy
   ```

## Apache Server Deployment

1. Upload all files from the \`out\` directory to your server's public_html or www directory.
2. Ensure the \`.htaccess\` file is uploaded (it's a hidden file, so make sure your FTP client shows hidden files).
3. The \`.htaccess\` file is crucial for proper routing in Next.js static exports.

## Nginx Server Deployment

1. Upload all files from the \`out\` directory to your server's root directory.
2. Copy the \`nginx.conf\` file to your Nginx configuration directory.
3. Modify the server_name and root path in the nginx.conf file to match your setup.
4. Reload Nginx configuration.

## ISPmanager/LiteSpeed Specific Instructions

Since your hosting environment uses LiteSpeed with ISPmanager:

1. Make sure the \`.htaccess\` file is uploaded to the root directory
2. In ISPmanager, check that:
   - The domain is properly configured
   - The document root points to the correct directory
   - The .htaccess file has read permissions (644)
3. LiteSpeed should automatically process the .htaccess file

## Common Issues and Solutions

### Forbidden Error
This usually means:
1. The server doesn't have read permissions for your files
2. The \`.htaccess\` file is missing or misconfigured
3. Directory indexing is disabled and no index file is found

### Fix Permissions (Linux servers)
```bash
chmod -R 755 /path/to/your/site/files
chmod 644 /path/to/your/site/files/*
```

### Check .htaccess is Working
Add this temporary line at the top of your .htaccess file to test:
```apache
# Temporary test - remove after confirming .htaccess works
Deny from all
```
If you get a 403 error, .htaccess is working. Remove this line for normal operation.

## ISPmanager Specific Troubleshooting

1. **Check File Manager in ISPmanager**:
   - Navigate to File Manager
   - Ensure all files are uploaded to the correct directory
   - Check that .htaccess file exists and has proper permissions (644)

2. **Restart Web Server**:
   - In ISPmanager, go to "Services"
   - Restart the web server service (Apache/LiteSpeed)

3. **Check Error Logs**:
   - In ISPmanager, go to "Logs"
   - Check Apache/LiteSpeed error logs for specific error messages

4. **Verify .htaccess Processing**:
   - LiteSpeed should process .htaccess automatically
   - If not working, check with your hosting provider that mod_rewrite is enabled

## Server Environment Testing

A \`test-server.php\` file is included in the \`out\` directory that can help diagnose server configuration issues:

1. Upload the \`test-server.php\` file to your server along with your site files
2. Visit \`https://yourdomain.com/test-server.php\` in your browser
3. Review the output for any configuration issues
4. Delete the file after testing for security

## Troubleshooting

1. Check server error logs for specific error messages
2. Verify all files were uploaded correctly
3. Ensure the server has read permissions on all files
4. Check that mod_rewrite is enabled on Apache servers