// Character sprite sets. To use another character, generate a new set of
// full-body PNGs (same canvas / ground line) and add an entry here.
export type CharacterState = 'walking' | 'stop' | 'surprised' | 'happy' | 'cheer';

export type CharacterSprites = {
  dir: string;
  walkCycle: string[]; // played in order while walking
  poses: Record<Exclude<CharacterState, 'walking'>, string>;
  /** which way each pose faces; changing facing triggers a paper flip */
  facing: Record<CharacterState, 'side' | 'front'>;
  canvas: {w: number; h: number};
  /** Point of the sprite that sits on the ground (x: hip line, y: sole line), canvas px. */
  anchor: {x: number; y: number};
  /** Top of the head (canvas px), for placing emotes. */
  headTop: {x: number; y: number};
  /** Distance between the feet at walk contact, canvas px (from the asset generator). */
  stepLength: number;
  /** Frames each walk image is held (short = quick Paper-Mario steps). */
  framesPerPose: number;
  /** Height of the little hop on every step (screen px). */
  hopHeight: number;
};

export const GIRL: CharacterSprites = {
  dir: 'assets/character',
  walkCycle: ['walk_01', 'walk_02', 'walk_03', 'walk_04'],
  poses: {stop: 'stop', surprised: 'surprised', happy: 'happy', cheer: 'happy_front'},
  facing: {walking: 'side', stop: 'side', surprised: 'side', happy: 'side', cheer: 'front'},
  canvas: {w: 560, h: 900},
  anchor: {x: 262, y: 862},
  headTop: {x: 280, y: 96},
  stepLength: 131.0,
  framesPerPose: 4,
  hopHeight: 10,
};

/** Screen px travelled per walk image, for a given sprite scale. */
export const distancePerPose = (c: CharacterSprites, scale: number) => (c.stepLength * scale) / 2;
/** Natural walking speed in screen px / frame (feet don't slide on the ground). */
export const naturalWalkSpeed = (c: CharacterSprites, scale: number) => distancePerPose(c, scale) / c.framesPerPose;
