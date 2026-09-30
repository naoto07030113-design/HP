// Render preview stills of chosen frames with a single bundle.
// Usage: node scripts/stills.mjs 30 120 330 ...
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const root = path.resolve(import.meta.dirname, '..');
const frames = process.argv.slice(2).map(Number);
const browserExecutable = process.env.REMOTION_CHROME || null;
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const id = process.env.COMP || 'BakeryWalk';
const composition = await selectComposition({serveUrl, id, browserExecutable});
for (const frame of frames) {
  const output = path.join(root, 'preview', `${id === 'BakeryWalk' ? '' : id + '-'}f${String(frame).padStart(3, '0')}.png`);
  await renderStill({serveUrl, composition, frame, output, browserExecutable, scale: 0.5});
  console.log('rendered', output);
}
