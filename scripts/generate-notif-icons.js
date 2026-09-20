import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon thông báo đơn sắc chuẩn Android Status Bar (Trắng trên nền trong suốt)
const notifSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <!-- Bìa Sổ Tay Trắng -->
  <rect x="18" y="14" width="60" height="68" rx="8" fill="none" stroke="#FFFFFF" stroke-width="6" />
  <!-- Gáy Sổ Trái -->
  <line x1="32" y1="14" x2="32" y2="82" stroke="#FFFFFF" stroke-width="4" />
  <!-- Các khoen sổ -->
  <circle cx="25" cy="28" r="2.5" fill="#FFFFFF" />
  <circle cx="25" cy="48" r="2.5" fill="#FFFFFF" />
  <circle cx="25" cy="68" r="2.5" fill="#FFFFFF" />
  <!-- Dấu Tick Hoàn Thành Sắc Nét -->
  <path d="M42 48 L52 58 L72 36" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`);

const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

const drawables = [
  { name: 'drawable', size: 48 },
  { name: 'drawable-mdpi', size: 24 },
  { name: 'drawable-hdpi', size: 36 },
  { name: 'drawable-xhdpi', size: 48 },
  { name: 'drawable-xxhdpi', size: 72 },
  { name: 'drawable-xxxhdpi', size: 96 },
];

async function generateNotifIcons() {
  console.log('Generating Android Notification Status Bar Icons...');

  for (const d of drawables) {
    const dirPath = path.join(resDir, d.name);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    await sharp(notifSvg)
      .resize(d.size, d.size)
      .png()
      .toFile(path.join(dirPath, 'ic_stat_sketchtask.png'));

    console.log(`✓ Generated ${d.name}/ic_stat_sketchtask.png (${d.size}x${d.size})`);
  }

  console.log('🎉 Notification Status Bar icons generated successfully!');
}

generateNotifIcons().catch(console.error);

