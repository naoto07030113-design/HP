// "Mansion Patrol": two animal police officers explore a dark mansion.
// Senior (shiba) is scared but dependable; junior (rabbit) jumps at every noise.
// All timing / staging lives here; the composition only renders it.
import type {EmoteType} from '../../components/Emote';
import type {Keyframes, Placement} from '../../lib/stage';
import meta from './police-meta.json';

export const VIDEO = {width: 1920, height: 1080, fps: 30, durationInFrames: 1080};
export const GROUND_Y = 1000;
export const WALK = 5; // sneaking pace, px/frame

// ---------------------------------------------------------------------------
// Story beats (documentation)
// ---------------------------------------------------------------------------
export const BEATS = [
  {id: 'M1-enter', from: 0, to: 50, note: 'Lightning. The two officers stand at the entrance, junior shivering'},
  {id: 'M2-explore', from: 50, to: 236, note: 'Sneaking down the hall, flashlights sweeping'},
  {id: 'M3-bottle', from: 236, to: 345, note: 'A bottle wobbles, falls and rolls; junior jumps and hides, senior shines the light'},
  {id: 'M4-explore', from: 345, to: 505, note: 'On they go, junior clinging close'},
  {id: 'M5-painting', from: 505, to: 640, note: 'The owl portrait slides and crashes down; same panic, senior steadies them'},
  {id: 'M6-door', from: 640, to: 880, note: 'The big door at the end creaks open by itself... eyes in the dark'},
  {id: 'M7-bats', from: 880, to: 1080, note: 'Bats burst out, both flip around and flee; bats fill the screen'},
];

// ---------------------------------------------------------------------------
// Motion (px / frame on the floor plane). The camera follows the senior.
// ---------------------------------------------------------------------------
const WALK_KEYS: Keyframes = [
  [0, 0], [50, 0], [80, WALK], [220, WALK], [240, 0],
  [345, 0], [365, WALK], [500, WALK], [520, 0],
  [640, 0], [660, WALK], [790, WALK], [812, 0],
];
export const CAMERA = {
  speed: [...WALK_KEYS, [1080, 0]] as Keyframes,
  zoom: [[0, 1.05], [50, 1.0], [800, 1.0], [872, 1.07], [884, 1.0]] as Keyframes,
  shake: [[0, 0], [262, 0], [264, 7], [290, 0], [546, 0], [548, 13], [572, 0], [878, 0], [882, 14], [960, 9], [1080, 12]] as Keyframes,
};

export type OfficerPose = keyof typeof meta.beams;
export type Facing = 'right' | 'left';
export type ActorId = 'senior' | 'junior';

export type Actor = {
  id: ActorId;
  scale: number;
  hopDistance: number;
  hopHeight: number;
  /** screen x of the senior at frame 0; the junior follows at `gap` behind */
  poses: {from: number; pose: OfficerPose; facing?: Facing; tremble?: number}[];
  hops: [number, number, number][];
  emotes: {frame: number; type: EmoteType; duration: number}[];
  beam: {length: number; spread: number; jitter: number};
};

export const SENIOR_X0 = 880;
export const SENIOR_SPEED: Keyframes = [...WALK_KEYS, [902, 0], [914, -12], [1080, -12]];
/** junior's distance behind the senior (px); shrinks when she hides behind him, grows when she runs off ahead */
export const JUNIOR_GAP: Keyframes = [
  [0, 250], [264, 250], [292, 140], [345, 140], [372, 235],
  [546, 235], [574, 140], [640, 140], [668, 235],
  [812, 235], [832, 160], [902, 160], [950, 470], [1080, 470],
];

export const ACTORS: Record<ActorId, Actor> = {
  senior: {
    id: 'senior',
    scale: 0.7,
    hopDistance: 95,
    hopHeight: 14,
    poses: [
      {from: 0, pose: 'senior_walk'},
      {from: 264, pose: 'senior_alert'},
      {from: 290, pose: 'senior_brave', tremble: 1.2},
      {from: 348, pose: 'senior_walk'},
      {from: 548, pose: 'senior_alert'},
      {from: 574, pose: 'senior_brave', tremble: 1.5},
      {from: 643, pose: 'senior_walk'},
      {from: 815, pose: 'senior_brave', tremble: 1.2},
      {from: 882, pose: 'senior_alert'},
      {from: 906, pose: 'senior_flee', facing: 'left'},
    ],
    hops: [[264, 34, 12], [548, 40, 12], [882, 52, 14]],
    emotes: [
      {frame: 18, type: 'sweat', duration: 40},
      {frame: 264, type: 'exclaim', duration: 36},
      {frame: 300, type: 'sweat', duration: 44},
      {frame: 548, type: 'exclaim', duration: 36},
      {frame: 584, type: 'sweat', duration: 44},
      {frame: 822, type: 'sweat', duration: 44},
      {frame: 882, type: 'exclaim', duration: 30},
    ],
    beam: {length: 1150, spread: 13, jitter: 0.6},
  },
  junior: {
    id: 'junior',
    scale: 0.64,
    hopDistance: 60,
    hopHeight: 10,
    poses: [
      {from: 0, pose: 'junior_scared', tremble: 2.5},
      {from: 50, pose: 'junior_walk', tremble: 1.2},
      {from: 262, pose: 'junior_shock'},
      {from: 290, pose: 'junior_cling', tremble: 3},
      {from: 348, pose: 'junior_walk', tremble: 1.5},
      {from: 546, pose: 'junior_shock'},
      {from: 572, pose: 'junior_cling', tremble: 3.5},
      {from: 643, pose: 'junior_walk', tremble: 1.5},
      {from: 815, pose: 'junior_scared', tremble: 3},
      {from: 880, pose: 'junior_shock'},
      {from: 904, pose: 'junior_flee', facing: 'left'},
    ],
    hops: [[262, 95, 18], [546, 105, 20], [880, 115, 20]],
    emotes: [
      {frame: 262, type: 'exclaim', duration: 40},
      {frame: 546, type: 'exclaim', duration: 40},
      {frame: 880, type: 'exclaim', duration: 30},
    ],
    beam: {length: 760, spread: 10, jitter: 3},
  },
};

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
export const EVENTS = {
  bottle: {wobble: 228, fall: 250, land: 262, rollEnd: 318},
  painting: {wobble: 500, fall: 530, land: 548},
  door: {open: 846, opened: 874, eyes: 852},
  bats: {from: 882, finale: 972},
  lightning: [[4, 9], [15, 21], [700, 705]] as [number, number][],
  fadeOut: [1040, 1080] as [number, number],
};

// ---------------------------------------------------------------------------
// Stage: every depth layer is a separate PNG. z < 200 behind the officers
// (under the darkness), z >= 250 in front of them (darkened by brightness).
// ---------------------------------------------------------------------------
const A = 'assets/mansion/';
// officers are drawn at z 210 (above the darkness); foreground sits above them
const Z = 250;
const FG_DIM = 0.5;
const WALL = 0.7;

const wallProps: Placement[] = [];
// portraits, sconces and furniture repeating along the hall
for (let i = 0; i < 6; i++) {
  const x = 520 + i * 1150;
  wallProps.push({src: A + (i % 2 ? 'portrait_cat.png' : 'portrait_land.png'), speed: WALL, y: 170, z: 3, scale: 0.75, at: {frame: 0, x}, shadow: 'mid'});
  wallProps.push({src: A + 'sconce.png', speed: WALL, y: 300, z: 4, scale: 0.8, at: {frame: 0, x: x - 180}, shadow: 'soft', glow: {dx: 80, dy: 80, r: 170, strength: 0.75}});
  wallProps.push({src: A + 'sconce.png', speed: WALL, y: 300, z: 4, scale: 0.8, at: {frame: 0, x: x + 330}, shadow: 'soft', glow: {dx: 80, dy: 80, r: 170, strength: 0.75}});
}

export const STAGE: Placement[] = [
  {src: A + 'mansion_wall.png', speed: WALL, y: 0, z: 1, tile: true, shadow: 'none'},
  {src: A + 'mansion_floor.png', speed: 1.0, y: 840, z: 2, tile: true, shadow: 'none'},
  ...wallProps,
  {src: A + 'clock.png', speed: 0.75, y: 330, z: 5, scale: 0.88, at: {frame: 0, x: 1350}, shadow: 'mid'},
  {src: A + 'armor.png', speed: 0.75, y: 300, z: 5, scale: 0.88, at: {frame: 120, x: 1700}, shadow: 'mid'},
  {src: A + 'armor.png', speed: 0.75, y: 300, z: 5, scale: 0.88, at: {frame: 440, x: 1650}, shadow: 'mid', flip: true},
  // bottle event: table + bottle, placed ahead of the senior where he stops
  {src: A + 'side_table.png', speed: 0.85, y: 735, z: 7, scale: 0.9, at: {frame: 240, x: 330, anchor: 'senior'}, shadow: 'mid'},
  {src: A + 'bottle.png', speed: 0.85, y: 690, z: 8, scale: 0.6, at: {frame: 240, x: 438, anchor: 'senior'}, shadow: 'soft', id: 'bottle'},
  // painting event: pale patch behind the owl portrait
  {src: A + 'portrait_mark.png', speed: WALL, y: 150, z: 3, scale: 0.8, at: {frame: 520, x: 230, anchor: 'senior'}, shadow: 'none'},
  {src: A + 'portrait_owl.png', speed: WALL, y: 150, z: 6, scale: 0.8, at: {frame: 520, x: 230, anchor: 'senior'}, shadow: 'deep', id: 'painting'},
  // the big door at the end of the hall
  {src: A + 'door_frame.png', speed: WALL, y: 100, z: 3, scale: 1, at: {frame: 812, x: 260, anchor: 'senior'}, shadow: 'mid', id: 'doorFrame'},
  {src: A + 'door_leaf.png', speed: WALL, y: 340, z: 4, scale: 1, at: {frame: 812, x: 320, anchor: 'senior'}, shadow: 'soft', id: 'leafL'},
  {src: A + 'door_leaf_r.png', speed: WALL, y: 340, z: 4, scale: 1, at: {frame: 812, x: 520, anchor: 'senior'}, shadow: 'soft', id: 'leafR'},
  // --- foreground (in front of the officers) ---
  {src: A + 'fg_candelabra.png', speed: 1.25, y: 470, brightness: 0.8, z: Z + 4, scale: 0.8, at: {frame: 0, x: 60}, shadow: 'mid', glow: {dx: 180, dy: 170, r: 230, strength: 0.8}},
  {src: A + 'fg_pillar.png', speed: 1.35, y: -40, brightness: FG_DIM, z: Z + 8, scale: 0.95, at: {frame: 130, x: 760}, shadow: 'deep'},
  {src: A + 'fg_vase.png', speed: 1.25, y: 700, brightness: FG_DIM, z: Z + 6, scale: 0.8, at: {frame: 420, x: 1500}, shadow: 'mid'},
  {src: A + 'fg_candelabra.png', speed: 1.25, y: 470, brightness: 0.8, z: Z + 4, scale: 0.8, at: {frame: 470, x: 1600}, shadow: 'mid', glow: {dx: 180, dy: 170, r: 230, strength: 0.8}},
  {src: A + 'fg_pillar.png', speed: 1.35, y: -40, brightness: FG_DIM, z: Z + 8, scale: 0.95, at: {frame: 700, x: 1000}, shadow: 'deep'},
  {src: A + 'fg_chair.png', speed: 1.2, y: 800, brightness: FG_DIM, z: Z + 5, scale: 0.75, at: {frame: 812, x: -120}, shadow: 'mid', flip: true},
  // --- front-most ---
  {src: A + 'front_curtain.png', speed: 1.6, y: -60, brightness: FG_DIM, z: Z + 20, scale: 0.9, at: {frame: 0, x: -250}, shadow: 'deep'},
  {src: A + 'front_cobweb.png', speed: 1.5, y: -20, brightness: FG_DIM, z: Z + 21, scale: 0.9, at: {frame: 0, x: -20}, shadow: 'soft'},
  {src: A + 'front_chandelier.png', speed: 1.4, y: -120, brightness: 0.8, z: Z + 22, scale: 0.9, at: {frame: 330, x: 700}, shadow: 'deep', glow: {dx: 350, dy: 170, r: 330, strength: 0.7}},
  {src: A + 'front_curtain.png', speed: 1.6, y: -60, brightness: FG_DIM, z: Z + 20, scale: 0.9, at: {frame: 600, x: 900}, shadow: 'deep', flip: true},
  {src: A + 'front_cobweb.png', speed: 1.5, y: -20, brightness: FG_DIM, z: Z + 21, scale: 0.9, at: {frame: 812, x: 1500}, shadow: 'soft', flip: true},
];

/** moonlit windows are painted on the wall tile at these x (tile px) */
export const WINDOW_GLOWS = {tile: 3840, xs: [440, 1720, 3000], y: 300, r: 260, strength: 0.55};
export const DARKNESS = 0.7;
export const POLICE = meta;
