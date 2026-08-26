import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

// SVG Logo Sổ Tay SketchTask
const logoSvgPath = path.join(__dirname, 'public', 'pwa-512x512.svg');
const logoBuffer = fs.readFileSync(logoSvgPath);

const splashScreens = [
  { dir: 'drawable', width: 480, height: 800, logoSize: 200 },
  { dir: 'drawable-port-mdpi', width: 320, height: 480, logoSize: 140 },
  { dir: 'drawable-port-hdpi', width: 480, height: 800, logoSize: 200 },
  { dir: 'drawable-port-xhdpi', width: 720, height: 1280, logoSize: 280 },
  { dir: 'drawable-port-xxhdpi', width: 960, height: 1600, logoSize: 360 },
  { dir: 'drawable-port-xxxhdpi', width: 1280, height: 1920, logoSize: 460 },
  { dir: 'drawable-land-mdpi', width: 480, height: 320, logoSize: 140 },
  { dir: 'drawable-land-hdpi', width: 800, height: 480, logoSize: 180 },
  { dir: 'drawable-land-xhdpi', width: 1280, height: 720, logoSize: 260 },
  { dir: 'drawable-land-xxhdpi', width: 1600, height: 960, logoSize: 340 },
  { dir: 'drawable-land-xxxhdpi', width: 1920, height: 1280, logoSize: 420 },
];

async function generateSplashScreens() {
  console.log('Generating Clean Solid Splash Screens for Android Native APK...');

  for (const s of splashScreens) {
    const targetDir = path.join(resDir, s.dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Tạo ảnh nền trơn #FBF9F4 không lồng logo để tránh hiện 2 lần logo
    await sharp({
      create: {
        width: s.width,
        height: s.height,
        channels: 4,
        background: { r: 251, g: 249, b: 244, alpha: 1 }, // #FBF9F4
      },
    })
      .png()
      .toFile(path.join(targetDir, 'splash.png'));
  }

  console.log('✅ Generated all solid splash screens successfully!');
}

generateSplashScreens().catch(console.error);

