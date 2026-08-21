import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Master SVG design for FocusGuard Logo (full bleed background for maskable compatibility)
const svgFullBleed = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="innerShield" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
    <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#3b82f6" flood-opacity="0.45"/>
    </filter>
  </defs>
  
  <!-- Solid square background for maskable compliance -->
  <rect width="512" height="512" fill="url(#bgGrad)"/>
  
  <!-- Outer glowing shield -->
  <g filter="url(#glow)">
    <path d="M256 72L384 132V256C384 350 256 440 256 440C256 440 128 350 128 256V132L256 72Z" fill="url(#shieldGrad)"/>
    <path d="M256 120L348 164V256C348 322 256 392 256 392C256 392 164 322 164 256V164L256 120Z" fill="url(#innerShield)" opacity="0.9"/>
    <!-- Focus Energy Bolt -->
    <path d="M244 176L212 250H258L236 332L312 236H266L288 176H244Z" fill="url(#boltGrad)"/>
  </g>
</svg>
`;

async function generate() {
  const svgBuffer = Buffer.from(svgFullBleed);

  const targets = [
    { file: 'icon-192.png', size: 192 },
    { file: 'icon-192x192.png', size: 192 },
    { file: 'icon-512.png', size: 512 },
    { file: 'icon-512x512.png', size: 512 },
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'favicon.png', size: 64 },
  ];

  for (const target of targets) {
    const dest = path.join(iconsDir, target.file);
    await sharp(svgBuffer)
      .resize(target.size, target.size)
      .png()
      .toFile(dest);
    console.log(`Generated ${dest} (${target.size}x${target.size})`);
  }

  // Also put copies in public root for fallback
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.resolve('public/icon-192.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.resolve('public/icon-512.png'));
  console.log('Icons generation completed successfully.');
}

generate().catch(err => {
  console.error('Failed generating icons:', err);
  process.exit(1);
});
