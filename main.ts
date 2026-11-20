// Entry program for the make.fun bounty "Make GTA 6 Cover Art"
// (gta6-cover-art-01): it hands in the Neon Coast Cover Studio, an offline
// browser web app that turns a photo and a caption into multi-panel
// sunset-neon cover art, exported as a PNG.
//
// The program copies app/ (the static web app) and screenshots/ (the
// screenshots its maker took) from beside this file to the output directory
// the grader gives it, and writes /output/dossier.json with buildDossier
// from the kit's vendored library, using the scorer's own caps.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's caps: the dossier text is capped at 160 KiB; the rest refuse
// an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files in app/ or 48 MiB of app files, or a path
// under app/ over 1000 bytes).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
console.log(`handed in app/ and screenshots/ to ${outDir} with dossier.json`);
