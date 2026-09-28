// Synthesises all audio from scratch (no third-party samples -> no licensing
// issues) and encodes it to MP3 with the ffmpeg bundled in Remotion.
//   bgm.mp3        ~30s acoustic "storybook" loop (plucked guitar + glockenspiel)
//   birds.mp3      a few spring bird chirps
//   footsteps.mp3  one soft step (triggered per step by the composition)
//   bell.mp3       little shop door bell
//   wind.mp3       paper whoosh for the tree wipe
//   sparkle.mp3    rising chime when she smells the bread
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const SR = 44100;
const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'public', 'assets', 'audio');
const tmpDir = path.join(root, '.remotion', 'audio-tmp');
fs.mkdirSync(outDir, {recursive: true});
fs.mkdirSync(tmpDir, {recursive: true});

let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const buf = (sec) => new Float32Array(Math.ceil(sec * SR));
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Karplus-Strong plucked string (reads as a soft nylon guitar)
const pluck = (out, t0, freq, dur, gain = 0.3, bright = 0.5) => {
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
const bellTone = (out, t0, freq, dur, gain = 0.15, partials = [[1, 1], [2.76, 0.35], [5.4, 0.15], [8.93, 0.06]], decay = 2.2) => {
  const start = Math.floor(t0 * SR);
  for (let i = 0; i < dur * SR && start + i < out.length; i++) {
    const t = i / SR;
    let v = 0;
    for (const [m, a] of partials) v += a * Math.sin(2 * Math.PI * freq * m * t) * Math.exp(-t * decay * (0.6 + m * 0.35));
    const att = Math.min(1, i / 40);
    out[start + i] += v * gain * att;
  }
};
const noiseBurst = (out, t0, dur, gain, lpA = 0.15, shape = (x) => Math.exp(-x * 6)) => {
  const start = Math.floor(t0 * SR);
  let lp = 0, lp2 = 0;
  for (let i = 0; i < dur * SR && start + i < out.length; i++) {
    const x = i / (dur * SR);
    lp += lpA * (rand() * 2 - 1 - lp);
    lp2 += lpA * (lp - lp2);
    out[start + i] += lp2 * gain * shape(x);
  }
};
const chirp = (out, t0, f0, f1, dur, gain) => {
  const start = Math.floor(t0 * SR);
  let ph = 0;
  for (let i = 0; i < dur * SR && start + i < out.length; i++) {
    const x = i / (dur * SR);
    const f = f0 + (f1 - f0) * Math.sin(x * Math.PI * 0.9) + 180 * Math.sin(i / SR * 2 * Math.PI * 38);
    ph += (2 * Math.PI * f) / SR;
    out[start + i] += Math.sin(ph) * gain * Math.sin(Math.PI * x) ** 2;
  }
};

const normalize = (a, peak = 0.89) => {
  let m = 0;
  for (const v of a) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < a.length; i++) a[i] = (a[i] / m) * peak;
  return a;
};
const fadeEdges = (a, fin, fout) => {
  const ni = fin * SR, no = fout * SR;
  for (let i = 0; i < ni && i < a.length; i++) a[i] *= i / ni;
  for (let i = 0; i < no && i < a.length; i++) a[a.length - 1 - i] *= i / no;
  return a;
};
// simple feedback delay "room"
const room = (a, delay = 0.11, fb = 0.28, mix = 0.25) => {
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

const writeWav = (file, data) => {
  const b = Buffer.alloc(44 + data.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + data.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(file, b);
};
const save = (name, data) => {
  const wav = path.join(tmpDir, name + '.wav');
  const mp3 = path.join(outDir, name + '.mp3');
  writeWav(wav, data);
  execFileSync('npx', ['remotion', 'ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '160k', mp3], {cwd: root, stdio: 'inherit'});
  console.log(`  ${path.relative(root, mp3)}  ${(data.length / SR).toFixed(2)}s`);
};

// ---------------- BGM ----------------
{
  const dur = 30.5;
  const a = buf(dur);
  const bpm = 100, beat = 60 / bpm, bar = beat * 4;
  // F  Dm  Bb  C  | F  Am  Bb  C ...
  const chords = [
    [53, [65, 69, 72, 77]], [50, [62, 65, 69, 74]], [46, [62, 65, 70, 74]], [48, [64, 67, 72, 76]],
    [53, [65, 69, 72, 77]], [45, [64, 69, 72, 76]], [46, [62, 65, 70, 74]], [48, [64, 67, 70, 76]],
  ];
  const arp = [0, 1, 2, 3, 2, 1, 2, 1];
  const melody = [ // [beat offset in bar, midi, len] per bar pattern (8 bars cycle)
    [[0, 81, 1], [1, 79, 0.5], [1.5, 77, 0.5], [2, 76, 1], [3, 77, 1]],
    [[0, 77, 1.5], [1.5, 74, 0.5], [2, 76, 2]],
    [[0, 74, 1], [1, 77, 1], [2, 81, 1], [3, 79, 1]],
    [[0, 79, 2], [2, 76, 1], [3, 72, 1]],
    [[0, 81, 1], [1, 84, 0.5], [1.5, 81, 0.5], [2, 79, 1], [3, 77, 1]],
    [[0, 76, 1.5], [1.5, 77, 0.5], [2, 79, 2]],
    [[0, 77, 1], [1, 74, 1], [2, 77, 1], [3, 81, 1]],
    [[0, 79, 3], [3, 76, 1]],
  ];
  const bars = Math.ceil(dur / bar);
  for (let b = 0; b < bars; b++) {
    const [bass, notes] = chords[b % chords.length];
    const t = b * bar;
    pluck(a, t, midi(bass - 12), bar * 1.1, 0.34, 0.3);
    pluck(a, t + beat * 2, midi(bass - 5), bar * 0.6, 0.18, 0.3);
    arp.forEach((k, i) => pluck(a, t + i * beat * 0.5 + (i % 2 ? 0.012 : 0), midi(notes[k]), beat * 1.6, 0.13, 0.55));
    if (b >= 1 && b < bars - 1) for (const [o, m, l] of melody[b % 8]) bellTone(a, t + o * beat, midi(m), l * beat + 1.2, 0.09);
  }
  save('bgm', normalize(fadeEdges(room(a, 0.13, 0.3, 0.22), 1.5, 2.5), 0.8));
}

// ---------------- birds ----------------
{
  const a = buf(5);
  const calls = [[0.3, 3200, 4200], [0.45, 3300, 4400], [1.6, 2600, 3600], [1.72, 2700, 3700], [1.84, 2800, 3900], [3.2, 3600, 4700], [3.35, 3500, 4600]];
  for (const [t, f0, f1] of calls) chirp(a, t, f0, f1, 0.09 + rand() * 0.04, 0.25);
  save('birds', normalize(fadeEdges(room(a, 0.09, 0.25, 0.3), 0.05, 0.4), 0.6));
}

// ---------------- footstep (single soft paper-ish tap) ----------------
{
  const a = buf(0.22);
  noiseBurst(a, 0, 0.12, 1, 0.12, (x) => Math.exp(-x * 9));
  noiseBurst(a, 0.004, 0.06, 0.6, 0.45, (x) => Math.exp(-x * 14));
  save('footsteps', normalize(a, 0.5));
}

// ---------------- door bell ----------------
{
  const a = buf(2.6);
  for (const [t, f] of [[0, 1568], [0.14, 1760], [0.3, 1568], [0.52, 1760]]) {
    bellTone(a, t, f, 2.0, 0.25, [[1, 1], [2.02, 0.4], [3.01, 0.2], [4.2, 0.1]], 1.6);
  }
  save('bell', normalize(fadeEdges(room(a, 0.07, 0.2, 0.2), 0.001, 0.3), 0.7));
}

// ---------------- wind / paper whoosh ----------------
{
  const a = buf(2.2);
  noiseBurst(a, 0, 2.2, 1, 0.05, (x) => Math.sin(Math.PI * Math.min(1, x * 1.3)) ** 2);
  noiseBurst(a, 0.4, 1.2, 0.5, 0.25, (x) => Math.sin(Math.PI * x) ** 3);
  save('wind', normalize(a, 0.6));
}

// ---------------- sparkle (aroma moment) ----------------
{
  const a = buf(2.4);
  [84, 88, 91, 96, 100].forEach((m, i) => bellTone(a, i * 0.08, midi(m), 1.8, 0.2, [[1, 1], [2.76, 0.3], [5.4, 0.1]], 2.6));
  save('sparkle', normalize(fadeEdges(room(a, 0.1, 0.3, 0.3), 0.001, 0.4), 0.55));
}
fs.rmSync(tmpDir, {recursive: true, force: true});
console.log('audio done');
