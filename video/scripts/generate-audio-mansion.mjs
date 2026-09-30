// Audio for "Mansion Patrol" (all synthesised, no samples):
//   bgm.mp3      36s: creepy tip-toe pizzicato + music box, then a frantic chase at 29.3s
//   thunder.mp3  crack + long rumble
//   clink.mp3    wobbling glass bottle
//   bottle.mp3   bottle falls, clatters and rolls away
//   thud.mp3     portrait crashes to the floor
//   sting.mp3    "shock!" stab for the jump scares
//   creak.mp3    old door creaking open
//   bats.mp3     flapping swarm with squeaks
//   zip.mp3      cartoon slide whistle as they run away
import {bellTone, buf, chirp, cleanup, fadeEdges, midi, noiseBurst, normalize, pluck, rand, room, save, SR} from './lib/synth.mjs';

const DIR = 'mansion';
const sine = (out, t0, dur, f0, f1, gain, decay = 4, vib = 0) => {
  const start = Math.floor(t0 * SR);
  let ph = 0;
  for (let i = 0; i < dur * SR && start + i < out.length; i++) {
    const x = i / (dur * SR);
    const f = f0 + (f1 - f0) * x + vib * Math.sin((i / SR) * 2 * Math.PI * 7);
    ph += (2 * Math.PI * f) / SR;
    out[start + i] += Math.sin(ph) * gain * Math.exp(-x * decay) * Math.min(1, i / 60);
  }
};

// ---------------- BGM ----------------
{
  const dur = 36.2;
  const chase = 29.33; // bats burst out (frame 880)
  const a = buf(dur);
  // A: sneaky D-minor tip-toe, 84 bpm
  const beat = 60 / 84;
  const bassLine = [38, 45, 41, 45, 38, 45, 40, 44, 37, 44, 40, 44, 38, 45, 41, 45];
  const tune = [[0, 74], [1, 77], [1.5, 76], [2, 74], [3, 73], [4, 74], [5, 70], [6, 69], [7, null],
    [8, 74], [9, 77], [9.5, 81], [10, 80], [11, 77], [12, 76], [13, 73], [14, 74], [15, null]];
  for (let t = 0, k = 0; t < chase - 0.2; t += beat, k++) {
    pluck(a, t, midi(bassLine[k % 16]), 0.3, 0.42, 0.25); // pizzicato
    if (k % 2 === 1) pluck(a, t + beat * 0.5, midi(bassLine[k % 16] + 12), 0.2, 0.16, 0.3);
  }
  for (let bar = 0; bar * 16 * beat < chase - 1; bar++) {
    if (bar === 0) continue;
    for (const [o, m] of tune) if (m && bar * 16 * beat + o * beat < chase - 0.3) bellTone(a, bar * 16 * beat + o * beat, midi(m), 1.4, 0.07, [[1, 1], [3.01, 0.25], [5.2, 0.08]], 3);
  }
  // low drone
  for (let i = 0; i < chase * SR; i++) {
    const t = i / SR;
    a[i] += 0.05 * Math.sin(2 * Math.PI * 73.4 * t) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.25 * t)) * Math.min(1, t / 2);
  }
  // B: frantic chase, 168 bpm 16ths running up and down
  const b16 = 60 / 168 / 4;
  const run = [62, 63, 65, 66, 68, 69, 71, 72, 74, 72, 71, 69, 68, 66, 65, 63];
  for (let t = chase, k = 0; t < dur - 0.3; t += b16, k++) {
    pluck(a, t, midi(run[k % 16] + (Math.floor(k / 32) % 2) * 3), 0.14, 0.14, 0.7);
    if (k % 4 === 0) pluck(a, t, midi(38 + (Math.floor(k / 16) % 2) * 5), 0.25, 0.4, 0.3);
    if (k % 8 === 0) bellTone(a, t, midi(86 + (k % 16 ? 1 : 0)), 0.4, 0.05);
  }
  save('bgm', normalize(fadeEdges(room(a, 0.16, 0.35, 0.3), 0.3, 1.2), 0.8), DIR);
}

// ---------------- thunder ----------------
{
  const a = buf(4.5);
  noiseBurst(a, 0, 0.35, 1.2, 0.6, (x) => Math.exp(-x * 5));
  noiseBurst(a, 0.05, 4.4, 1.6, 0.02, (x) => (0.5 + 0.5 * Math.sin(x * 23) * Math.sin(x * 7)) * Math.exp(-x * 2.2) * Math.min(1, x * 20));
  save('thunder', normalize(a, 0.8), DIR);
}

// ---------------- glass clink (wobble) ----------------
{
  const a = buf(1.0);
  for (const t of [0, 0.16, 0.3, 0.42]) bellTone(a, t, 2350 + rand() * 300, 0.4, 0.3, [[1, 1], [2.3, 0.4], [3.9, 0.2]], 9);
  save('clink', normalize(a, 0.55), DIR);
}

// ---------------- bottle falls + rolls ----------------
{
  const a = buf(2.6);
  noiseBurst(a, 0.38, 0.08, 0.9, 0.5, (x) => Math.exp(-x * 8));
  for (const t of [0.4, 0.47, 0.58, 0.66]) bellTone(a, t, 1800 + rand() * 900, 0.5, 0.35, [[1, 1], [2.4, 0.5], [4.1, 0.3]], 7);
  // rolling: rumbling noise with a rotating "tock"
  const start = Math.floor(0.7 * SR);
  let lp = 0;
  for (let i = 0; i < 1.8 * SR; i++) {
    const x = i / (1.8 * SR);
    lp += 0.08 * (rand() * 2 - 1 - lp);
    const rot = 0.5 + 0.5 * Math.sin(2 * Math.PI * (14 - 10 * x) * (i / SR));
    a[start + i] += lp * 1.8 * rot * (1 - x) ** 1.5;
  }
  save('bottle', normalize(room(a, 0.08, 0.2, 0.2), 0.7), DIR);
}

// ---------------- portrait crash ----------------
{
  const a = buf(1.8);
  sine(a, 0, 0.6, 110, 40, 1.0, 5);
  noiseBurst(a, 0, 0.25, 1.1, 0.35, (x) => Math.exp(-x * 7));
  noiseBurst(a, 0.06, 0.5, 0.5, 0.12, (x) => Math.exp(-x * 5));
  for (const t of [0.12, 0.2, 0.3]) noiseBurst(a, t, 0.05, 0.4, 0.6, (x) => Math.exp(-x * 10)); // frame rattle
  save('thud', normalize(room(a, 0.1, 0.25, 0.25), 0.85), DIR);
}

// ---------------- shock sting ----------------
{
  const a = buf(1.4);
  for (const m of [85, 86, 92]) bellTone(a, 0, midi(m), 1.3, 0.25, [[1, 1], [2.01, 0.5], [3.02, 0.25]], 3.5);
  pluck(a, 0, midi(38), 0.8, 0.8, 0.9);
  noiseBurst(a, 0, 0.1, 0.4, 0.7, (x) => Math.exp(-x * 9));
  save('sting', normalize(room(a, 0.12, 0.3, 0.25), 0.75), DIR);
}

// ---------------- door creak ----------------
{
  const dur = 1.7;
  const a = buf(dur);
  let t = 0;
  while (t < dur - 0.05) {
    const x = t / dur;
    const rate = 55 + 70 * Math.sin(x * Math.PI * 3.2) ** 2 + rand() * 20; // stick-slip pulses
    const start = Math.floor(t * SR);
    for (let i = 0; i < 0.012 * SR && start + i < a.length; i++) {
      const tt = i / SR;
      a[start + i] += Math.sin(2 * Math.PI * (700 + 400 * x) * tt) * Math.exp(-tt * 380) * Math.sin(Math.PI * x) ** 0.5;
    }
    t += 1 / rate;
  }
  save('creak', normalize(room(a, 0.09, 0.3, 0.3), 0.6), DIR);
}

// ---------------- bat swarm ----------------
{
  const dur = 4.5;
  const a = buf(dur);
  for (let k = 0; k < 90; k++) {
    const t = rand() * (dur - 0.4);
    noiseBurst(a, t, 0.06, 0.5 + rand() * 0.4, 0.2, (x) => Math.sin(Math.PI * x)); // wing flap
  }
  for (let k = 0; k < 16; k++) chirp(a, rand() * (dur - 0.3), 5200 + rand() * 1500, 6800 + rand() * 1500, 0.06, 0.18); // squeaks
  save('bats', normalize(fadeEdges(a, 0.05, 0.8), 0.7), DIR);
}

// ---------------- slide whistle ----------------
{
  const a = buf(0.8);
  sine(a, 0, 0.75, 1700, 380, 0.5, 1.2, 25);
  save('zip', normalize(a, 0.5), DIR);
}
cleanup();
console.log('mansion audio done');
