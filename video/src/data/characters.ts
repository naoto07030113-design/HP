// Character sprite sets. To use another character, generate a new set of
// full-body PNGs (same canvas / ground line) and add an entry here.
export type CharacterState = 'walking' | 'stop' | 'surprised' | 'happy';

export type CharacterSprites = {
  dir: string;
  walkCycle: string[]; // played in order while walking
  poses: Record<Exclude<CharacterState, 'walking'>, string>;
  canvas: {w: number; h: number};
  /** Point of the sprite that sits on the ground (x: hip line, y: sole line), canvas px. */
  anchor: {x: number; y: number};
  /** Distance between the feet at walk contact, canvas px (from the asset generator). */
  stepLength: number;
  /** Extra vertical bob (screen px) for each walk frame. */
  walkBob: number[];
  /** Frames each walk image is held at normal speed (4-6 keeps a stop-motion feel). */
  framesPerPose: number;
};

export const GIRL: CharacterSprites = {
  dir: 'assets/character',
  walkCycle: ['walk_01', 'walk_02', 'walk_03', 'walk_04'],
  poses: {stop: 'stop', surprised: 'surprised', happy: 'happy'},
  canvas: {w: 560, h: 900},
  anchor: {x: 262, y: 862},
  stepLength: 244.3,
  walkBob: [0, -3, 0, -2],
  framesPerPose: 7,
};

/** Screen px travelled per walk image, for a given sprite scale. */
export const distancePerPose = (c: CharacterSprites, scale: number) => (c.stepLength * scale) / 2;
/** Natural walking speed in screen px / frame (feet don't slide on the ground). */
export const naturalWalkSpeed = (c: CharacterSprites, scale: number) => distancePerPose(c, scale) / c.framesPerPose;
