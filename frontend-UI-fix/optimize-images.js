import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');

async function optimizeImages() {
  const files = fs.readdirSync(publicDir);

  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const filePath = path.join(publicDir, file);
      const ext = path.extname(file);
      const basename = path.basename(file, ext);
      const webpPath = path.join(publicDir, `${basename}.webp`);

      console.log(`Optimizing ${file}...`);
      await sharp(filePath)
        .webp({ quality: 80 })
        .toFile(webpPath);
      
      console.log(`Created ${basename}.webp`);
    }
  }
  console.log('All images optimized to WebP!');
}

optimizeImages().catch(console.error);
