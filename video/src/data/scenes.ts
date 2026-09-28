// All timing and staging for BakeryWalk lives here, not in the components.
// Swap the stages / keyframes / sprites to make a different story with the
// same machinery.
import {GIRL, naturalWalkSpeed, type CharacterState} from './characters';

export const VIDEO = {width: 1920, height: 1080, fps: 30, durationInFrames: 900};

/** [frame, value] pairs, linearly interpolated (clamped at the ends). */
export type Keyframes = [number, number][];

export const GIRL_SCALE = 0.7;
export const WALK = naturalWalkSpeed(GIRL, GIRL_SCALE); // ≈12.2 px/frame
export const GROUND_Y = 985; // screen y of the girl's soles

// ---------------------------------------------------------------------------
// Story beats (documentation + drives state / effects)
// ---------------------------------------------------------------------------
export type SceneBeat = {
  id: string;
  startFrame: number;
  endFrame: number;
  stage: StageId;
  characterState: CharacterState | null; // null = character not on screen
  note: string;
};

export const SCENES: SceneBeat[] = [
  {id: 'S1-opening', startFrame: 0, endFrame: 90, stage: 'street', characterState: null, note: 'Spring town, big sakura branch in front, slow pan'},
  {id: 'S2-walk', startFrame: 90, endFrame: 420, stage: 'street', characterState: 'walking', note: 'She walks in from behind a tree; foreground rushes past'},
  {id: 'S3-slowdown', startFrame: 420, endFrame: 540, stage: 'street', characterState: 'walking', note: 'Walk slows, world stops, she stops'},
  {id: 'S4-aroma', startFrame: 540, endFrame: 630, stage: 'street', characterState: 'surprised', note: 'Bread aroma paper ribbons; tree wipe begins'},
  {id: 'S5-bakery', startFrame: 630, endFrame: 770, stage: 'bakery', characterState: 'happy', note: 'Bakery revealed behind the wipe, slow push-in'},
  {id: 'S6-approach', startFrame: 770, endFrame: 866, stage: 'bakery', characterState: 'walking', note: 'She walks to the door; planters hide her feet'},
  {id: 'S7-arrive', startFrame: 866, endFrame: 900, stage: 'bakery', characterState: 'happy', note: 'Door bell, petals, fade out'},
];

// Fine-grained character state switches (inside the beats above).
export const CHARACTER_STATES: {from: number; state: CharacterState}[] = [
  {from: 0, state: 'walking'},
  {from: 508, state: 'stop'},
  {from: 548, state: 'surprised'},
  {from: 652, state: 'happy'},
  {from: 770, state: 'walking'},
  {from: 866, state: 'happy'},
];

// ---------------------------------------------------------------------------
// Camera & motion (px / frame on the character's ground plane, speed = 1.0)
// ---------------------------------------------------------------------------
export const CAMERA = {
  speed: [
    [0, 1.6], [90, 1.6], [200, WALK], [420, WALK], [505, 0],
    [648, 0], [660, 0.9], [770, 0.9], [784, 4.8], [852, 4.8], [866, 0],
  ] as Keyframes,
  zoom: [
    [0, 1.0], [640, 1.0], [770, 1.04], [866, 1.04], [900, 1.075],
  ] as Keyframes,
  /** transform-origin of the zoom (fractions of the frame). */
  zoomOriginX: [[0, 0.4], [640, 0.45], [900, 0.6]] as Keyframes,
  zoomOriginY: 0.62,
};

export const GIRL_TRACK = {
  enterFrame: 90,
  /** once the camera has caught up, she walks in place at this screen x (~37%) */
  lockFrame: 200,
  lockScreenX: 715,
  speed: [
    [89, 0], [90, WALK], [420, WALK], [505, 0],
    [770, 0], [784, WALK], [852, WALK], [866, 0],
  ] as Keyframes,
};

export const TRANSITION = {
  /** stage switches while the wipe tree fully covers the frame */
  switchFrame: 630,
  tree: {src: 'assets/street/transition_tree.png', from: 598, to: 662, x0: 1960, x1: -2760, y: -200, scale: 1},
};

export const EFFECTS = {
  aroma: {from: 552, to: 632},
  bellFrame: 872,
  fadeIn: [0, 12] as [number, number],
  fadeOut: [880, 900] as [number, number],
  petals: {count: 6, seed: 'sakura'},
};

// ---------------------------------------------------------------------------
// Stages: every depth layer is a separate PNG with its own parallax speed.
// z < 100 is behind the girl, z > 100 is in front of her.
// `at` = {frame, x}: screen x of the layer's left edge at that frame.
//   With `girl: true`, x is relative to the girl's screen x at that frame,
//   which makes occlusion beats (lamp passing in front of her) easy to aim.
// `tile` repeats the image horizontally (seamless strips).
// ---------------------------------------------------------------------------
export type Placement = {
  src: string;
  speed: number;
  y: number;
  z: number;
  scale?: number;
  tile?: boolean;
  at?: {frame: number; x: number; girl?: boolean};
  opacity?: number;
  shadow?: 'none' | 'soft' | 'mid' | 'deep';
  flip?: boolean;
  /** optional swing (deg) around the top centre, used for the door bell */
  swing?: {frame: number; amplitude: number};
};

export type StageId = 'street' | 'bakery';

const S = 'assets/street/';
const BK = 'assets/bakery/';
const GIRL_Z = 100;

export const STAGES: Record<StageId, Placement[]> = {
  street: [
    {src: S + 'sky.png', speed: 0, y: 0, z: 0, shadow: 'none'},
    {src: S + 'clouds.png', speed: 0.05, y: 10, z: 1, tile: true, shadow: 'none'},
    {src: S + 'mountains.png', speed: 0.1, y: 330, z: 2, tile: true, shadow: 'none'},
    {src: S + 'far_town.png', speed: 0.25, y: 468, z: 3, tile: true, shadow: 'soft'},
    {src: S + 'houses.png', speed: 0.45, y: 150, z: 4, tile: true, shadow: 'soft'},
    {src: S + 'street_shops.png', speed: 0.6, y: 222, z: 5, tile: true, shadow: 'mid'},
    {src: S + 'road.png', speed: 1.0, y: 740, z: 6, tile: true, shadow: 'none'},
    // --- foreground (in front of the girl) ---
    {src: S + 'fg_fence.png', speed: 1.18, y: 840, z: GIRL_Z + 5, scale: 0.9, at: {frame: 170, x: 1500}, shadow: 'mid'},
    {src: S + 'fg_planters.png', speed: 1.2, y: 800, z: GIRL_Z + 6, scale: 0.8, at: {frame: 260, x: 1700}, shadow: 'mid'},
    {src: S + 'fg_bench.png', speed: 1.15, y: 850, z: GIRL_Z + 4, scale: 0.85, at: {frame: 60, x: 1150}, shadow: 'mid'},
    {src: S + 'fg_flowers.png', speed: 1.25, y: 840, z: GIRL_Z + 7, scale: 0.85, at: {frame: 340, x: 1300}, shadow: 'mid'},
    {src: S + 'fg_fence.png', speed: 1.18, y: 840, z: GIRL_Z + 5, scale: 0.9, at: {frame: 400, x: 1750}, shadow: 'mid'},
    {src: S + 'fg_flowers.png', speed: 1.25, y: 850, z: GIRL_Z + 7, scale: 0.8, at: {frame: 200, x: 1400}, shadow: 'mid', flip: true},
    {src: S + 'fg_bench.png', speed: 1.15, y: 850, z: GIRL_Z + 4, scale: 0.85, at: {frame: 470, x: 1260}, shadow: 'mid'},
    {src: S + 'fg_flowers.png', speed: 1.25, y: 850, z: GIRL_Z + 7, scale: 0.8, at: {frame: 505, x: 20}, shadow: 'mid'},
    // --- front-most (closest to the lens) ---
    {src: S + 'front_branch.png', speed: 1.5, y: -70, z: GIRL_Z + 20, scale: 1.0, at: {frame: 0, x: -140}, shadow: 'deep'},
    {src: S + 'front_tree.png', speed: 1.7, y: -270, z: GIRL_Z + 21, scale: 0.9, at: {frame: 94, x: -405, girl: true}, shadow: 'deep'},
    {src: S + 'front_flowers.png', speed: 1.6, y: 700, z: GIRL_Z + 22, scale: 0.8, at: {frame: 250, x: 1300}, shadow: 'deep'},
    {src: S + 'front_lamp.png', speed: 1.8, y: -170, z: GIRL_Z + 23, scale: 0.95, at: {frame: 318, x: -176, girl: true}, shadow: 'deep'},
    {src: S + 'front_branch.png', speed: 1.55, y: -120, z: GIRL_Z + 20, scale: 0.9, at: {frame: 380, x: 700}, shadow: 'deep', flip: true},
    {src: S + 'front_flowers.png', speed: 1.6, y: 720, z: GIRL_Z + 22, scale: 0.75, at: {frame: 505, x: 1320}, shadow: 'deep'},
  ],
  bakery: [
    {src: BK + 'bakery_sky.png', speed: 0, y: 0, z: 0, shadow: 'none'},
    {src: S + 'clouds.png', speed: 0.05, y: 30, z: 1, tile: true, shadow: 'none'},
    {src: BK + 'bakery_far_bg.png', speed: 0.2, y: 290, z: 2, tile: true, shadow: 'soft'},
    {src: S + 'houses.png', speed: 0.42, y: 196, z: 3, tile: true, shadow: 'soft', at: {frame: 866, x: -300}},
    {src: BK + 'bakery_ground.png', speed: 1.0, y: 790, z: 4, tile: true, shadow: 'none'},
    // the shop, split into depth pieces (bread sits a hair deeper than the glass)
    ...shopPieces({frame: 866, x: -760, baseY: 850, scale: 0.92, speed: 0.6}),
    // --- foreground ---
    {src: BK + 'bakery_sign.png', speed: 1.12, y: 700, z: GIRL_Z + 4, scale: 0.72, at: {frame: 866, x: -600, girl: true}, shadow: 'mid'},
    {src: BK + 'bakery_table.png', speed: 1.18, y: 760, z: GIRL_Z + 5, scale: 0.7, at: {frame: 866, x: 330, girl: true}, shadow: 'mid'},
    {src: BK + 'bakery_planters.png', speed: 1.1, y: 770, z: GIRL_Z + 6, scale: 0.9, at: {frame: 866, x: -300, girl: true}, shadow: 'mid'},
    // --- front-most ---
    {src: BK + 'bakery_front_flowers.png', speed: 1.6, y: 640, z: GIRL_Z + 20, scale: 0.8, at: {frame: 866, x: -900}, shadow: 'deep'},
    {src: BK + 'bakery_front_branch.png', speed: 1.7, y: -80, z: GIRL_Z + 21, scale: 0.95, at: {frame: 866, x: 820}, shadow: 'deep'},
  ],
};

/** Building + window + bread + door + bell, positioned from one anchor. */
function shopPieces(o: {frame: number; x: number; baseY: number; scale: number; speed: number}): Placement[] {
  const s = o.scale;
  const top = o.baseY - 940 * s; // building canvas ground line is y=940
  const at = (cx: number) => ({frame: o.frame, x: o.x + cx * s, girl: true});
  return [
    {src: BK + 'bakery_building.png', speed: o.speed, y: top, z: 10, scale: s, at: at(0), shadow: 'mid'},
    {src: BK + 'bread_display.png', speed: o.speed - 0.02, y: top + 626 * s, z: 11, scale: s * 1.0, at: at(176), shadow: 'soft'},
    {src: BK + 'bakery_window.png', speed: o.speed, y: top + 596 * s, z: 12, scale: s, at: at(146), shadow: 'mid'},
    {src: BK + 'bakery_door.png', speed: o.speed, y: top + 604 * s, z: 12, scale: s, at: at(795), shadow: 'mid'},
    {src: BK + 'bakery_bell.png', speed: o.speed, y: top + 588 * s, z: 13, scale: s * 0.62, at: at(985), shadow: 'soft', swing: {frame: EFFECTS.bellFrame, amplitude: 22}},
  ];
}
