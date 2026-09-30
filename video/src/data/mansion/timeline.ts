import {at, flipAt, hopHeightAt, integrate, sampleKeys} from '../../lib/motion';
import {ACTORS, CAMERA, JUNIOR_GAP, SENIOR_SPEED, SENIOR_X0, VIDEO, type ActorId, type Facing, type OfficerPose} from './story';

const N = VIDEO.durationInFrames;
const CAM = integrate(CAMERA.speed, N);
const SENIOR = integrate(SENIOR_SPEED, N);
// distance walked (always positive, also when running away) drives the hops
const absKeys = (f: number) => Math.abs(sampleKeys(SENIOR_SPEED, f));
const juniorSpeed = (f: number) => sampleKeys(SENIOR_SPEED, f) - (sampleKeys(JUNIOR_GAP, f + 1) - sampleKeys(JUNIOR_GAP, f));
const cumulative = (fn: (f: number) => number) => {
  const out: number[] = [];
  let d = 0;
  for (let f = 0; f <= N; f++) {
    out.push(d);
    d += Math.abs(fn(f));
  }
  return out;
};
const DIST: Record<ActorId, number[]> = {senior: cumulative(absKeys), junior: cumulative(juniorSpeed)};

export const cameraX = (f: number) => at(CAM, f);
export const actorScreenX = (id: ActorId, f: number) => {
  const senior = SENIOR_X0 + at(SENIOR, f) - at(CAM, f);
  return id === 'senior' ? senior : senior - sampleKeys(JUNIOR_GAP, f);
};
export const actorSpeed = (id: ActorId, f: number) => (id === 'senior' ? sampleKeys(SENIOR_SPEED, f) : juniorSpeed(f));
export const actorDistance = (id: ActorId, f: number) => at(DIST[id], f);

export type ActorLook = {pose: OfficerPose; facing: Facing; flip: number; tremble: number; hop: number; walking: boolean};
export const actorLook = (id: ActorId, f: number): ActorLook => {
  const a = ACTORS[id];
  const states = a.poses.map((p) => ({from: p.from, state: p.pose}));
  const facingOf = (pose: OfficerPose) => a.poses.find((p) => p.pose === pose)?.facing ?? 'right';
  const {state, flip} = flipAt(states, facingOf, f);
  let tremble = 0;
  for (const p of a.poses) if (f >= p.from) tremble = p.tremble ?? 0;
  return {
    pose: state,
    facing: facingOf(state),
    flip,
    tremble,
    hop: hopHeightAt(a.hops, f),
    walking: Math.abs(actorSpeed(id, f)) > 0.4,
  };
};

/** Frames where a walking hop lands (for the tap sound). */
export const landingFrames = (id: ActorId): number[] => {
  const out: number[] = [];
  for (let f = 1; f < N; f++) {
    if (!actorLook(id, f).walking) continue;
    const h = ACTORS[id].hopDistance;
    if (Math.floor(actorDistance(id, f) / h) > Math.floor(actorDistance(id, f - 1) / h)) out.push(f);
  }
  return out;
};
