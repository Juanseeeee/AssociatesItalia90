import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, 'dist');
const indexHtml = path.join(distPath, 'index.html');
const notFoundHtml = path.join(distPath, '404.html');

try {
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, notFoundHtml);
    console.log('✅ Copied index.html to 404.html for SPA support on GitHub Pages');
  } else {
    console.error('❌ index.html not found in dist folder');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error copying file:', error);
  process.exit(1);
}
