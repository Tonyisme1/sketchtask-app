import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, 'public', 'pwa-512x512.svg');
const svgBuffer = fs.readFileSync(svgPath);

// SVG Foreground trong suốt cho Adaptive Icon Android
const foregroundSvg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Bìa Sổ Tay Vàng Nghệ Căn Giữa -->
  <g transform="translate(30, 30) scale(0.88)">
    <!-- Bóng Đổ Sổ Tay -->
    <rect x="96" y="96" width="340" height="340" rx="32" fill="#262626" />
    
    <!-- Bìa Sổ Tay Vàng Nghệ -->
    <rect x="80" y="80" width="340" height="340" rx="32" fill="#FEF08A" stroke="#262626" stroke-width="16" />
    
    <!-- Dải Gáy Sổ (Notebook Spine) -->
    <rect x="80" y="80" width="70" height="340" rx="20" fill="#FDE047" stroke="#262626" stroke-width="16" />
    <line x1="150" y1="80" x2="150" y2="420" stroke="#262626" stroke-width="12" stroke-linecap="round" />
    
    <!-- Các khoen gáy sổ -->
    <circle cx="115" cy="140" r="10" fill="#262626" />
    <circle cx="115" cy="200" r="10" fill="#262626" />
    <circle cx="115" cy="260" r="10" fill="#262626" />
    <circle cx="115" cy="320" r="10" fill="#262626" />
    <circle cx="115" cy="380" r="10" fill="#262626" />

    <!-- Dấu Tick Hoàn Thành Vẽ Tay Sắc Nét -->
    <path d="M200 250 L260 310 L370 170" fill="none" stroke="#1C1917" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Dòng Kẻ Phác Thảo Ngang -->
    <line x1="200" y1="365" x2="350" y2="365" stroke="#78716C" stroke-width="12" stroke-linecap="round" stroke-dasharray="1 16" />
  </g>
</svg>
`);

const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

const densities = [
  { name: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { name: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { name: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { name: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { name: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

async function generateAndroidIcons() {
  console.log('Generating Android App Icons for SketchTask...');

  for (const d of densities) {
    const dirPath = path.join(resDir, d.name);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // 1. ic_launcher.png (Legacy Square / Rounded)
    await sharp(svgBuffer)
      .resize(d.size, d.size)
      .png()
      .toFile(path.join(dirPath, 'ic_launcher.png'));

    // 2. ic_launcher_round.png (Round Icon)
    await sharp(svgBuffer)
      .resize(d.size, d.size)
      .png()
      .toFile(path.join(dirPath, 'ic_launcher_round.png'));

    // 3. ic_launcher_foreground.png (Adaptive Foreground)
    await sharp(foregroundSvg)
      .resize(d.fgSize, d.fgSize)
      .png()
      .toFile(path.join(dirPath, 'ic_launcher_foreground.png'));

    console.log(`✓ Generated ${d.name} (${d.size}x${d.size} & fg ${d.fgSize}x${d.fgSize})`);
  }

  console.log('🎉 All Android native launcher icons generated successfully!');
}

generateAndroidIcons().catch(console.error);
