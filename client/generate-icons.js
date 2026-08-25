import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public');

const svg192 = fs.readFileSync(path.join(publicDir, 'pwa-192x192.svg'));
const svg512 = fs.readFileSync(path.join(publicDir, 'pwa-512x512.svg'));

async function generate() {
  console.log('Generating PNG icons for PWA & PWABuilder...');

  // 1. 192x192 PNG
  await sharp(svg192)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 2. 512x512 PNG
  await sharp(svg512)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 3. Apple Touch Icon 180x180 PNG
  await sharp(svg512)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 4. Maskable 192 & 512 PNG
  await sharp(svg192)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-192x192.png'));

  await sharp(svg512)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 5. Screenshots cho PWABuilder (Mobile 750x1334 & Desktop 1280x800)
  const mobileScreenshotSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="750" height="1334" viewBox="0 0 750 1334">
      <rect width="750" height="1334" fill="#FBF9F4"/>
      <rect x="40" y="60" width="670" height="80" rx="8" fill="#FFFFFF" stroke="#262626" stroke-width="3"/>
      <text x="70" y="110" font-family="sans-serif" font-size="32" font-weight="bold" fill="#1C1917">SketchTask</text>
      <rect x="40" y="180" width="670" height="120" rx="10" fill="#FFFFFF" stroke="#262626" stroke-width="3"/>
      <text x="70" y="245" font-family="sans-serif" font-size="26" font-weight="bold" fill="#1C1917">✓ Hoàn thành thiết kế ứng dụng</text>
      <rect x="40" y="320" width="670" height="120" rx="10" fill="#FFFFFF" stroke="#262626" stroke-width="3"/>
      <text x="70" y="385" font-family="sans-serif" font-size="26" font-weight="bold" fill="#1C1917">✍️ Viết kế hoạch công việc hôm nay</text>
      <rect x="40" y="460" width="320" height="260" rx="10" fill="#FEF08A" stroke="#262626" stroke-width="3"/>
      <text x="70" y="520" font-family="sans-serif" font-size="22" font-weight="bold" fill="#1C1917">📌 Ý tưởng mới</text>
      <rect x="390" y="460" width="320" height="260" rx="10" fill="#BBF7D0" stroke="#262626" stroke-width="3"/>
      <text x="420" y="520" font-family="sans-serif" font-size="22" font-weight="bold" fill="#1C1917">🌟 Thói quen tốt</text>
    </svg>
  `);

  await sharp(mobileScreenshotSvg)
    .resize(750, 1334)
    .png()
    .toFile(path.join(publicDir, 'screenshot-mobile.png'));

  const desktopScreenshotSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
      <rect width="1280" height="800" fill="#FBF9F4"/>
      <rect x="40" y="40" width="260" height="720" rx="8" fill="#FFFFFF" stroke="#262626" stroke-width="3"/>
      <text x="70" y="90" font-family="sans-serif" font-size="24" font-weight="bold" fill="#1C1917">SketchTask</text>
      <rect x="330" y="40" width="910" height="720" rx="8" fill="#FFFFFF" stroke="#262626" stroke-width="3"/>
      <text x="370" y="100" font-family="sans-serif" font-size="28" font-weight="bold" fill="#1C1917">Sổ Tay Công Việc Cá Nhân</text>
    </svg>
  `);

  await sharp(desktopScreenshotSvg)
    .resize(1280, 800)
    .png()
    .toFile(path.join(publicDir, 'screenshot-desktop.png'));

  console.log('✅ Generated all PNG icons & screenshots successfully!');
}

generate().catch(console.error);
