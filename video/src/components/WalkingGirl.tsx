import React from 'react';
import {useCurrentFrame} from 'remotion';
import {dollMotion, PaperDoll} from './PaperDoll';
import {GIRL, type CharacterSprites, type CharacterState} from '../data/characters';

export type WalkingGirlProps = {
  /** screen x of the character anchor (hip line) */
  x: number;
  /** screen y of the soles */
  y: number;
  scale: number;
  state: CharacterState;
  /** px per frame; used to pick walk frames when `distance` is not given */
  walkingSpeed?: number;
  /** distance walked so far; hops are spaced by distance so they match the scrolling ground */
  distance?: number;
  direction?: 1 | -1;
  /** paper flip angle around the vertical axis (deg), 0 = flat to camera */
  flip?: number;
  /** extra jump height (reaction hops), screen px */
  hop?: number;
  zIndex?: number;
  sprites?: CharacterSprites;
};

/** The bakery girl: a PaperDoll driven by her sprite set. */
export const WalkingGirl: React.FC<WalkingGirlProps> = ({
  x, y, scale, state, walkingSpeed = 0, distance, direction = 1, flip = 0, hop = 0, zIndex = 100, sprites = GIRL,
}) => {
  const frame = useCurrentFrame();
  const motion = dollMotion({
    frame,
    walking: state === 'walking',
    distance: distance ?? frame * walkingSpeed,
    hopDistance: sprites.hopDistance,
    hopHeight: sprites.hopHeight,
    hop,
  });
  return (
    <PaperDoll
      src={`${sprites.dir}/${sprites.poses[state]}.png`}
      x={x}
      y={y}
      scale={scale}
      canvas={sprites.canvas}
      anchor={sprites.anchor}
      headTopY={sprites.headTop.y}
      motion={motion}
      flip={flip}
      direction={direction}
      zIndex={zIndex}
    />
  );
};
