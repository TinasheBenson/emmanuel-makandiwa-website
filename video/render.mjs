// Renders the site's background films with HyperFrames, then encodes small
// web loops + posters into public/video/.
//
//   npm run video:render            # all films
//   npm run video:render -- hero    # one film
//
// Needs Node 22+, FFmpeg and a Chrome headless shell. In sandboxes without
// the HyperFrames-managed browser, set HYPERFRAMES_BROWSER_PATH.
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, writeFile, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MEDIA = join(ROOT, 'src/assets/media');
const OUT = join(ROOT, 'video/out');
const PUBLIC = join(ROOT, 'public/video');

/** Edit the image lists here when the real photography arrives. */
const films = {
  hero: { duration: 12, shots: ['hero.jpg', 'stage.jpg', 'crowd.jpg', 'worship.jpg'] },
  transforming: { duration: 12, shots: ['conference.jpg', 'crowd.jpg', 'outreach.jpg', 'stage.jpg'] },
};

const only = process.argv.slice(2);
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...opts });
const template = await readFile(join(ROOT, 'video/film-template.html'), 'utf8');
await mkdir(PUBLIC, { recursive: true });

for (const [id, film] of Object.entries(films)) {
  if (only.length && !only.includes(id)) continue;
  const dir = join(OUT, id);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  // Stage the composition: images, a local GSAP (no CDN at render time), html.
  for (const shot of film.shots) await copyFile(join(MEDIA, shot), join(dir, basename(shot)));
  await copyFile(join(ROOT, 'node_modules/gsap/dist/gsap.min.js'), join(dir, 'gsap.min.js'));
  const html = template
    .replaceAll('__ID__', id)
    .replaceAll('__DURATION__', String(film.duration))
    .replaceAll('__SHOTS__', JSON.stringify(film.shots.map((s) => basename(s))));
  await writeFile(join(dir, 'index.html'), html);

  console.log(`\n▶ ${id}: lint + render`);
  run('npx', ['hyperframes', 'lint'], { cwd: dir });
  const master = join(dir, 'master.mp4');
  run('npx', ['hyperframes', 'render', '--output', master, '--fps', '30', '--quality', 'high'], { cwd: dir });

  // Web encodes: 1280x720, no audio, tuned for small size (~1 MB per 12 s).
  const scale = 'scale=1280:-2:flags=lanczos';
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', master, '-vf', scale, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(PUBLIC, `${id}.mp4`)]);
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', master, '-vf', scale, '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', join(PUBLIC, `${id}.webm`)]);

  for (const ext of ['mp4', 'webm']) {
    const { size } = await stat(join(PUBLIC, `${id}.${ext}`));
    console.log(`  ${id}.${ext}: ${(size / 1024).toFixed(0)} KB`);
  }
}
