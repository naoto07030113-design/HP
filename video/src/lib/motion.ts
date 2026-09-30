import type {Keyframes} from './stage';

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export const sampleKeys = (keys: Keyframes, frame: number): number => {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (frame <= f1) return v0 + (v1 - v0) * smoothstep((frame - f0) / Math.max(1e-6, f1 - f0));
  }
  return keys[keys.length - 1][1];
};

/** Integrate a speed curve (px/frame) into a position for every frame. */
export const integrate = (keys: Keyframes, frames: number, start = 0, fromFrame = 0): number[] => {
  const out = new Array<number>(frames + 1).fill(start);
  let x = start;
  for (let f = fromFrame; f <= frames; f++) {
    out[f] = x;
    x += sampleKeys(keys, f);
  }
  return out;
};

export const at = (arr: number[], frame: number) => arr[Math.max(0, Math.min(arr.length - 1, Math.floor(frame)))];

/** Parabolic reaction hops: [start frame, height px, duration frames]. */
export const hopHeightAt = (hops: [number, number, number][], frame: number) => {
  for (const [f0, h, d] of hops) {
    const t = (frame - f0) / d;
    if (t >= 0 && t <= 1) return 4 * h * t * (1 - t);
  }
  return 0;
};

/**
 * Paper flip between two sprites when the facing changes: 0 -> 90deg showing
 * the old sprite, then -90 -> 0deg showing the new one.
 */
export const flipAt = <S extends string>(
  states: {from: number; state: S}[],
  facing: (s: S) => string,
  frame: number,
  flipFrames = 10,
): {state: S; flip: number} => {
  let current = states[0].state;
  for (const s of states) if (frame >= s.from) current = s.state;
  for (let i = 1; i < states.length; i++) {
    const prev = states[i - 1].state;
    const next = states[i];
    if (facing(prev) === facing(next.state)) continue;
    const t = (frame - (next.from - flipFrames / 2)) / flipFrames;
    if (t < 0 || t >= 1) continue;
    const e = smoothstep(t);
    return e < 0.5 ? {state: prev, flip: 180 * e} : {state: next.state, flip: 180 * e - 180};
  }
  return {state: current, flip: 0};
};
