// Character sprite sets. To use another character, generate a new set of
// full-body PNGs (same canvas / ground line) and add an entry here.
export type CharacterState = 'walking' | 'stop' | 'surprised' | 'happy' | 'cheer';

export type CharacterSprites = {
  dir: string;
  /** One sprite for every state: walking is a single paper sheet hopping along. */
  poses: Record<CharacterState, string>;
  /** which way each pose faces; changing facing triggers a paper flip */
  facing: Record<CharacterState, 'side' | 'front'>;
  canvas: {w: number; h: number};
  /** Point of the sprite that sits on the ground (x: hip line, y: sole line), canvas px. */
  anchor: {x: number; y: number};
  /** Top of the head (canvas px), for placing emotes. */
  headTop: {x: number; y: number};
  /** Walking speed, screen px per frame. */
  walkSpeed: number;
  /** Ground covered by one hop while walking (screen px). */
  hopDistance: number;
  /** Height of each walking hop (screen px). */
  hopHeight: number;
};

export const GIRL: CharacterSprites = {
  dir: 'assets/character',
  poses: {walking: 'stroll', stop: 'stop', surprised: 'surprised', happy: 'happy', cheer: 'happy_front'},
  facing: {walking: 'side', stop: 'side', surprised: 'side', happy: 'side', cheer: 'front'},
  canvas: {w: 560, h: 900},
  anchor: {x: 262, y: 862},
  headTop: {x: 280, y: 96},
  walkSpeed: 10,
  hopDistance: 110, // one hop every 11 frames at walking speed (~2.7 hops/s)
  hopHeight: 18,
};
