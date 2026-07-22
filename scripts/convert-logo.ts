import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoDir = path.join(__dirname, '../src/assets/logo');

async function convertSvgToPng(svgName, size, suffix = '') {
  const svgPath = path.join(logoDir, `${svgName}.svg`);
  const pngName = `${svgName}${suffix}-${size}.png`;
  const pngPath = path.join(logoDir, pngName);

  await sharp(svgPath)
    .resize(size, size, { fit: 'contain' })
    .png()
    .toFile(pngPath);

  console.log(`Created ${pngName}`);
}

async function main() {
  // LajurMark variants
  await convertSvgToPng('jalur-mark', 24);
  await convertSvgToPng('jalur-mark', 32);
  await convertSvgToPng('jalur-mark', 48);
  await convertSvgToPng('jalur-mark', 64);
  await convertSvgToPng('jalur-mark', 128);
  await convertSvgToPng('jalur-mark', 256);

  console.log('Done! PNG files created in src/assets/logo/');
}

main().catch(console.error);
