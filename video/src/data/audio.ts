import {EFFECTS, TRANSITION, VIDEO} from './scenes';

const A = 'assets/audio/';
// One-shot sound effects: [file, start frame, volume]
export const SFX: {src: string; from: number; volume: number}[] = [
  {src: A + 'birds.mp3', from: 6, volume: 0.35},
  {src: A + 'birds.mp3', from: 300, volume: 0.22},
  {src: A + 'sparkle.mp3', from: EFFECTS.aroma.from - 4, volume: 0.4},
  {src: A + 'wind.mp3', from: TRANSITION.tree.from - 2, volume: 0.45},
  {src: A + 'birds.mp3', from: 690, volume: 0.28},
  {src: A + 'bell.mp3', from: EFFECTS.bellFrame, volume: 0.55},
];
export const BGM = {src: A + 'bgm.mp3', volume: 0.65, fadeOutFrom: VIDEO.durationInFrames - 45};
export const FOOTSTEP = {src: A + 'footsteps.mp3', volume: 0.45};
