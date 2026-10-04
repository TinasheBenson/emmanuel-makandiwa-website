// Generates warm, grainy placeholder photographs so layouts and the video
// pipeline can be built before the real images are migrated.
// Usage: node scripts/make-placeholders.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const OUT = new URL('../src/assets/media/', import.meta.url);
await mkdir(OUT, { recursive: true });

const palettes = [
  ['#1b2440', '#c8a15a', '#0d1220'],
  ['#2a1d14', '#e3c88f', '#120c08'],
  ['#14283a', '#9fb8c9', '#0a1520'],
  ['#3a2414', '#d9894a', '#170d06'],
  ['#1d1a2e', '#b59ad6', '#0c0a16'],
  ['#203026', '#c9d3a0', '#0c140f'],
];

const items = [
  ['portrait', 1600, 2000],
  ['hero', 2400, 1350],
  ['stage', 2000, 1300],
  ['crowd', 2000, 1300],
  ['worship', 2000, 1300],
  ['couple', 1600, 2000],
  ['conference', 2000, 1300],
  ['outreach', 2000, 1300],
  ['message-1', 1600, 1000],
  ['message-2', 1600, 1000],
  ['message-3', 1600, 1000],
  ['message-4', 1600, 1000],
  ['message-5', 1600, 1000],
  ['message-6', 1600, 1000],
  ['book-1', 1000, 1500],
  ['book-2', 1000, 1500],
  ['book-3', 1000, 1500],
  ['book-4', 1000, 1500],
  ['event-1', 1600, 1000],
  ['event-2', 1600, 1000],
  ['event-3', 1600, 1000],
];

for (const [i, [name, w, h]] of items.entries()) {
  const [a, b, c] = palettes[i % palettes.length];
  const isBook = name.startsWith('book');
  const label = name.replace(/-/g, ' ').toUpperCase();
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <radialGradient id="g" cx="${30 + (i * 17) % 50}%" cy="${25 + (i * 11) % 40}%" r="85%">
        <stop offset="0" stop-color="${b}" stop-opacity=".95"/>
        <stop offset=".35" stop-color="${a}"/>
        <stop offset="1" stop-color="${c}"/>
      </radialGradient>
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" filter="url(#n)"/>
    ${
      isBook
        ? `<rect x="${w * 0.08}" y="${h * 0.06}" width="${w * 0.84}" height="${h * 0.88}" fill="none" stroke="${b}" stroke-opacity=".6" stroke-width="3"/>
           <text x="50%" y="40%" text-anchor="middle" font-family="Georgia, serif" font-size="${w * 0.11}" fill="#f6f1e7">Life</text>
           <text x="50%" y="50%" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${w * 0.11}" fill="${b}">Lighter</text>
           <text x="50%" y="88%" text-anchor="middle" font-family="Arial" letter-spacing="6" font-size="${w * 0.03}" fill="#f6f1e7" opacity=".7">SAMPLE COVER</text>`
        : `<text x="${w * 0.04}" y="${h * 0.94}" font-family="Arial" letter-spacing="8" font-size="${Math.round(w * 0.016)}" fill="#fff" opacity=".35">PLACEHOLDER · ${label}</text>`
    }
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82, mozjpeg: true }).toFile(new URL(`${name}.jpg`, OUT).pathname);
}

// Social sharing default.
await sharp(new URL('hero.jpg', OUT).pathname)
  .resize(1200, 630, { fit: 'cover' })
  .jpeg({ quality: 80 })
  .toFile(new URL('../public/media/og-default.jpg', import.meta.url).pathname);

console.log(`Wrote ${items.length} placeholders`);
