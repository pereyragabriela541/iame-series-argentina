/**
 * Flyer Race Week — edición completa.
 */
import sharp from "sharp";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "public/flyers/race-week-source.png");
const logoSrc = join(root, "public/assets/logo-iame-flyer.jpg");
const out = join(root, "public/flyers/race-week-fecha-5-2026.png");

function gradeBrighterCeleste(data) {
  for (let i = 0; i < data.length; i += 3) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    const lum = (r + g + b) / 3;
    const max = Math.max(r, g, b);

    if (lum < 160) {
      const lift = (160 - lum) * 0.48;
      r += lift;
      g += lift;
      b += lift;
    }

    if (b > 70 && g > 50 && b >= g - 12) {
      const t = Math.min(1, (b + g) / 290);
      r = r * (1 - t * 0.26) + 135 * t * 0.26;
      g = g * (1 - t * 0.12) + 208 * t * 0.12;
      b = b * (1 - t * 0.06) + 252 * t * 0.06;
    }

    if (r > 135 && g > 135 && b > 135) {
      const w = (max - 135) / 120;
      r = r + (255 - r) * w * 0.17;
      g = g + (255 - g) * w * 0.19;
      b = b + (255 - b) * w * 0.11;
    }

    data[i] = Math.round(Math.min(255, Math.max(0, r)));
    data[i + 1] = Math.round(Math.min(255, Math.max(0, g)));
    data[i + 2] = Math.round(Math.min(255, Math.max(0, b)));
  }
}

async function archCover(input) {
  return sharp(input)
    .extract({ left: 0, top: 378, width: 400, height: 88 })
    .blur(16)
    .modulate({ brightness: 1.12 })
    .toBuffer();
}

async function makeLogo() {
  const { data, info } = await sharp(logoSrc)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 55 && g < 55 && b < 55) data[i + 3] = 0;
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize({ width: 320, withoutEnlargement: true })
    .png()
    .toBuffer();
}

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

gradeBrighterCeleste(data);

const base = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: info.channels },
})
  .modulate({ brightness: 1.22, saturation: 1.16 })
  .png()
  .toBuffer();

const w = info.width;
const h = info.height;
const archPatch = await archCover(base);
const logo = await makeLogo();
const logoMeta = await sharp(logo).metadata();
const logoLeft = Math.round((w - logoMeta.width) / 2);
const logoTop = h - logoMeta.height - 10;

const svg = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="1.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect x="0" y="0" width="${w}" height="72" fill="#0f3550" opacity="0.92"/>
  <text x="${w / 2}" y="42" text-anchor="middle"
        font-family="Helvetica Neue, Arial, sans-serif" font-size="24"
        font-weight="600" letter-spacing="1.5" fill="#FFFFFF" filter="url(#glow)">
    18 y 19 de Julio
  </text>

  <rect x="100" y="592" width="824" height="138" fill="#0f3550" opacity="0.93"/>

  <text x="${w / 2}" y="648"
        text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif"
        font-size="40" font-weight="800" letter-spacing="4" fill="#FFFFFF" filter="url(#glow)">
    1996-2026
  </text>
  <text x="${w / 2}" y="692"
        text-anchor="middle" font-family="Georgia, Times New Roman, serif"
        font-size="26" font-style="italic" font-weight="600" fill="#F4FAFF" filter="url(#glow)">
    Gracias por la historia!
  </text>

  <rect x="140" y="848" width="744" height="142" fill="#0a2238" opacity="0.95"/>
</svg>`);

await sharp(base)
  .composite([
    { input: archPatch, left: 0, top: 378 },
    { input: svg, left: 0, top: 0 },
    { input: logo, left: logoLeft, top: logoTop },
  ])
  .png({ quality: 95, compressionLevel: 6 })
  .toFile(out);

console.log("Guardado:", out);
