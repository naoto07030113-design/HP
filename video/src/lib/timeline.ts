import {CAMERA, CHARACTER_STATES, FLIP_FRAMES, GIRL_TRACK, HOPS, VIDEO, type Keyframes} from '../data/scenes';
import {GIRL} from '../data/characters';
import type {CharacterState} from '../data/characters';

export const sampleKeys = (keys: Keyframes, frame: number): number => {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (frame <= f1) {
      const t = (frame - f0) / Math.max(1e-6, f1 - f0);
      const e = t * t * (3 - 2 * t); // smoothstep between keys: no jerky starts / stops
      return v0 + (v1 - v0) * e;
    }
  }
  return keys[keys.length - 1][1];
};

/** Integrate a speed curve into positions for every frame (deterministic). */
const integrate = (keys: Keyframes, start = 0, fromFrame = 0) => {
  const out = new Array<number>(VIDEO.durationInFrames + 1).fill(start);
  let x = start;
  for (let f = fromFrame; f <= VIDEO.durationInFrames; f++) {
    out[f] = x;
    x += sampleKeys(keys, f);
  }
  return out;
};

const CAM_X = integrate(CAMERA.speed);
const GIRL_DIST = integrate(GIRL_TRACK.speed, 0, GIRL_TRACK.enterFrame);
// place her so that she is exactly at lockScreenX on lockFrame
const GIRL_WORLD0 = CAM_X[GIRL_TRACK.lockFrame] + GIRL_TRACK.lockScreenX - GIRL_DIST[GIRL_TRACK.lockFrame];

const clampF = (f: number) => Math.max(0, Math.min(VIDEO.durationInFrames, Math.floor(f)));

/** Camera x on the character plane (speed 1.0). */
export const cameraX = (frame: number) => CAM_X[clampF(frame)];
/** Distance the character has walked (drives walk-cycle frame selection). */
export const girlDistance = (frame: number) => GIRL_DIST[clampF(frame)];
/** Character anchor x on screen. */
export const girlScreenX = (frame: number) => GIRL_WORLD0 + GIRL_DIST[clampF(frame)] - CAM_X[clampF(frame)];

export const characterStateAt = (frame: number): CharacterState => {
  let s: CharacterState = CHARACTER_STATES[0].state;
  for (const c of CHARACTER_STATES) if (frame >= c.from) s = c.state;
  return s;
};

/** Frames where a foot touches the ground (walk_01 / walk_03), for footstep sounds. */
export const footstepFrames = (distancePerPose: number, cycleLength: number): number[] => {
  const frames: number[] = [];
  let prev = -1;
  for (let f = GIRL_TRACK.enterFrame; f < VIDEO.durationInFrames; f++) {
    if (characterStateAt(f) !== 'walking') {
      prev = -1;
      continue;
    }
    const i = Math.floor(girlDistance(f) / distancePerPose) % cycleLength;
    if (i !== prev && i % 2 === 0 && prev !== -1) frames.push(f);
    prev = i;
  }
  return frames;
};

/**
 * What the paper doll shows at a frame. When the facing changes (side <-> front)
 * the sheet flips around its vertical axis: 0 -> 90deg with the old pose,
 * then -90 -> 0deg with the new one.
 */
export const characterVisualAt = (frame: number): {state: CharacterState; flip: number} => {
  for (let i = 1; i < CHARACTER_STATES.length; i++) {
    const prev = CHARACTER_STATES[i - 1].state;
    const next = CHARACTER_STATES[i];
    if (GIRL.facing[prev] === GIRL.facing[next.state]) continue;
    const t = (frame - (next.from - FLIP_FRAMES / 2)) / FLIP_FRAMES;
    if (t < 0 || t >= 1) continue;
    const e = t * t * (3 - 2 * t);
    return e < 0.5 ? {state: prev, flip: 180 * e} : {state: next.state, flip: 180 * e - 180};
  }
  return {state: characterStateAt(frame), flip: 0};
};

/** Height of any reaction hop in progress (parabolic jump). */
export const hopAt = (frame: number) => {
  for (const [f0, h, d] of HOPS) {
    const t = (frame - f0) / d;
    if (t >= 0 && t <= 1) return 4 * h * t * (1 - t);
  }
  return 0;
};
