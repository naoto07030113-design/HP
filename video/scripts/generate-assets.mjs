// Generates every PNG under public/assets/ from code.
// Usage: node scripts/generate-assets.mjs [character|street|bakery|all]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {doc, renderPng, setPaperStyle} from './lib/paper.mjs';
import {drawBody, DIM, POSES} from './lib/character.mjs';
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
  for (const name of ['stroll', 'stop', 'surprised', 'happy', 'happy_front']) {
    save(doc(DIM.W, DIM.H, drawBody(POSES[name])), out('character', `${name}.png`));
  }
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
if (which === 'all' || which === 'police') {
  setPaperStyle({real: true}); // photographed-real-card look for the mansion film
  const {drawOfficer, OFFICER_POSES, ADIM} = await import('./lib/animals.mjs');
  const {policeSheet} = await import('./lib/sheet.mjs');
  console.log('police');
  const meta = {canvas: {w: ADIM.W, h: ADIM.H}, anchor: {x: ADIM.hipX, y: ADIM.ground}, beams: {}};
  for (const [name, pose] of Object.entries(OFFICER_POSES)) {
    const {svg, beam} = drawOfficer(pose);
    save(doc(ADIM.W, ADIM.H, svg), out('police', `${name}.png`));
    meta.beams[name] = beam && {x: +beam.x.toFixed(1), y: +beam.y.toFixed(1), angle: beam.angle};
  }
  save(policeSheet(), out('police', 'police_ref.png'));
  fs.writeFileSync(path.join(root, 'src', 'data', 'mansion', 'police-meta.json'), JSON.stringify(meta, null, 2) + '\n');
}
if (which === 'all' || which === 'mansion') {
  setPaperStyle({real: true});
  const {buildMansion} = await import('./lib/mansion.mjs');
  console.log('mansion');
  for (const [name, [w, h, svg]] of Object.entries(buildMansion())) save(doc(w, h, svg), out('mansion', `${name}.png`));
  // film grain tile (overlaid and jittered every frame for the photographed look)
  save(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><filter id="n" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="3"/><feColorMatrix type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1"/></filter><rect width="512" height="512" filter="url(#n)"/></svg>`, out('fx', 'film_grain.png'));
}
fs.mkdirSync(path.dirname(manifestPath), {recursive: true});
fs.writeFileSync(manifestPath, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2) + '\n');
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
