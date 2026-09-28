// Generates every PNG under public/assets/ from code.
// Usage: node scripts/generate-assets.mjs [character|street|bakery|all]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {doc, renderPng} from './lib/paper.mjs';
import {drawBody, DIM, POSES, stepLength} from './lib/character.mjs';
import {characterSheet} from './lib/sheet.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (...p) => path.join(root, 'public', 'assets', ...p);
const which = process.argv[2] || 'all';
const t0 = Date.now();
const manifestPath = path.join(root, 'src', 'data', 'asset-manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const save = (svg, file) => {
  const bytes = renderPng(svg, file);
  const m = svg.match(/width="(\d+)" height="(\d+)"/);
  manifest[path.relative(path.join(root, 'public'), file).replace(/\\/g, '/')] = {w: +m[1], h: +m[2]};
  console.log(`  ${path.relative(root, file)}  ${(bytes / 1024).toFixed(0)}kB`);
};

if (which === 'all' || which === 'character') {
  console.log('character');
  save(characterSheet(), out('character', 'char_ref.png'));
  for (const name of ['walk_01', 'walk_02', 'walk_03', 'walk_04', 'stop', 'surprised', 'happy']) {
    save(doc(DIM.W, DIM.H, drawBody(POSES[name])), out('character', `${name}.png`));
  }
  console.log(`  step length: ${stepLength().toFixed(1)} canvas px (canvas ${DIM.W}x${DIM.H}, ground y=${DIM.ground})`);
}
if (which === 'all' || which === 'street') {
  const {buildStreet} = await import('./lib/street.mjs');
  console.log('street');
  for (const [name, [w, h, svg]] of Object.entries(buildStreet())) save(doc(w, h, svg), out('street', `${name}.png`));
}
if (which === 'all' || which === 'bakery') {
  const {buildBakery} = await import('./lib/bakery.mjs');
  console.log('bakery');
  for (const [name, [w, h, svg]] of Object.entries(buildBakery())) save(doc(w, h, svg), out('bakery', `${name}.png`));
}
fs.mkdirSync(path.dirname(manifestPath), {recursive: true});
fs.writeFileSync(manifestPath, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2) + '\n');
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
