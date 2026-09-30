// Tiny synthesiser shared by the audio scripts: everything is generated from
// scratch (no third-party samples) and encoded to MP3 with Remotion's ffmpeg.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

export const SR = 44100;
const root = path.resolve(import.meta.dirname, '..', '..');
const tmpDir = path.join(root, '.remotion', 'audio-tmp');
fs.mkdirSync(tmpDir, {recursive: true});

let seed = 12345;
export const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
export const buf = (sec) => new Float32Array(Math.ceil(sec * SR));
export const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Karplus-Strong plucked string (reads as a soft nylon guitar)
export const pluck = (out, t0, freq, dur, gain = 0.3, bright = 0.5) => {
  const N = Math.max(2, Math.round(SR / freq));
  const ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = (rand() * 2 - 1) * (0.6 + 0.4 * bright);
  const start = Math.floor(t0 * SR);
  const len = Math.floor(dur * SR);
  let idx = 0, prev = 0;
  for (let i = 0; i < len && start + i < out.length; i++) {
    const cur = ring[idx];
    const next = ring[(idx + 1) % N];
    const v = 0.996 * (0.5 * (cur + next));
    ring[idx] = v;
    idx = (idx + 1) % N;
    const lp = prev + 0.55 * (cur - prev);
    prev = lp;
    const env = i < 60 ? i / 60 : 1;
    const tail = i > len - 2000 ? (len - i) / 2000 : 1;
    out[start + i] += lp * gain * env * tail;
  }
};
// glockenspiel / music box tone
export const bellTone = (out, t0, freq, dur, gain = 0.15, partials = [[1, 1], [2.76, 0.35], [5.4, 0.15], [8.93, 0.06]], decay = 2.2) => {
  const start = Math.floor(t0 * SR);
  for (let i = 0; i < dur * SR && start + i < out.length; i++) {
    const t = i / SR;
    let v = 0;
    for (const [m, a] of partials) v += a * Math.sin(2 * Math.PI * freq * m * t) * Math.exp(-t * decay * (0.6 + m * 0.35));
    const att = Math.min(1, i / 40);
    out[start + i] += v * gain * att;
  }
};
export const noiseBurst = (out, t0, dur, gain, lpA = 0.15, shape = (x) => Math.exp(-x * 6)) => {
  const start = Math.floor(t0 * SR);
  let lp = 0, lp2 = 0;
  for (let i = 0; i < dur * SR && start + i < out.length; i++) {
    const x = i / (dur * SR);
    lp += lpA * (rand() * 2 - 1 - lp);
    lp2 += lpA * (lp - lp2);
    out[start + i] += lp2 * gain * shape(x);
  }
};
export const chirp = (out, t0, f0, f1, dur, gain) => {
  const start = Math.floor(t0 * SR);
  let ph = 0;
  for (let i = 0; i < dur * SR && start + i < out.length; i++) {
    const x = i / (dur * SR);
    const f = f0 + (f1 - f0) * Math.sin(x * Math.PI * 0.9) + 180 * Math.sin(i / SR * 2 * Math.PI * 38);
    ph += (2 * Math.PI * f) / SR;
    out[start + i] += Math.sin(ph) * gain * Math.sin(Math.PI * x) ** 2;
  }
};

export const normalize = (a, peak = 0.89) => {
  let m = 0;
  for (const v of a) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < a.length; i++) a[i] = (a[i] / m) * peak;
  return a;
};
export const fadeEdges = (a, fin, fout) => {
  const ni = fin * SR, no = fout * SR;
  for (let i = 0; i < ni && i < a.length; i++) a[i] *= i / ni;
  for (let i = 0; i < no && i < a.length; i++) a[a.length - 1 - i] *= i / no;
  return a;
};
// simple feedback delay "room"
export const room = (a, delay = 0.11, fb = 0.28, mix = 0.25) => {
  const d = Math.floor(delay * SR);
  const out = new Float32Array(a.length);
  const line = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    const del = i >= d ? line[i - d] : 0;
    line[i] = a[i] + del * fb;
    out[i] = a[i] + del * mix;
  }
  return out;
};

export const writeWav = (file, data) => {
  const b = Buffer.alloc(44 + data.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + data.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(file, b);
};
/** Write `data` as public/assets/audio/<subdir>/<name>.mp3 */
export const save = (name, data, subdir = '') => {
  const outDir = path.join(root, 'public', 'assets', 'audio', subdir);
  fs.mkdirSync(outDir, {recursive: true});
  const wav = path.join(tmpDir, name + '.wav');
  const mp3 = path.join(outDir, name + '.mp3');
  writeWav(wav, data);
  execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '160k', mp3], {cwd: root, stdio: 'inherit'});
  console.log(`  ${path.relative(root, mp3)}  ${(data.length / SR).toFixed(2)}s`);
};

export const cleanup = () => fs.rmSync(tmpDir, {recursive: true, force: true});
