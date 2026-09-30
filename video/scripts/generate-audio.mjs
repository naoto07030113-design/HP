// Synthesises all audio from scratch (no third-party samples -> no licensing
// issues) and encodes it to MP3 with the ffmpeg bundled in Remotion.
//   bgm.mp3        ~30s acoustic "storybook" loop (plucked guitar + glockenspiel)
//   birds.mp3      a few spring bird chirps
//   footsteps.mp3  one soft step (triggered per step by the composition)
//   bell.mp3       little shop door bell
//   wind.mp3       paper whoosh for the tree wipe
//   sparkle.mp3    rising chime when she smells the bread
import {buf, bellTone, chirp, cleanup, fadeEdges, midi, noiseBurst, normalize, pluck, rand, room, save, SR} from './lib/synth.mjs';


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
cleanup();
console.log('audio done');
