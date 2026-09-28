import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {distancePerPose, GIRL, type CharacterSprites, type CharacterState} from '../data/characters';
import {SHADOWS} from './PaperShadow';

export type WalkingGirlProps = {
  /** screen x of the character anchor (hip line) */
  x: number;
  /** screen y of the soles */
  y: number;
  scale: number;
  state: CharacterState;
  /** px per frame; used to pick walk frames when `distance` is not given */
  walkingSpeed?: number;
  /** distance walked so far; keeps the feet in sync with the scrolling ground */
  distance?: number;
  direction?: 1 | -1;
  zIndex?: number;
  sprites?: CharacterSprites;
};

export const WalkingGirl: React.FC<WalkingGirlProps> = ({
  x, y, scale, state, walkingSpeed = 0, distance, direction = 1, zIndex = 100, sprites = GIRL,
}) => {
  const frame = useCurrentFrame();
  let name: string;
  let bob = 0;
  if (state === 'walking') {
    const d = distance ?? frame * walkingSpeed;
    const i = Math.floor(d / distancePerPose(sprites, scale)) % sprites.walkCycle.length;
    name = sprites.walkCycle[i];
    bob = sprites.walkBob[i] ?? 0;
  } else {
    name = sprites.poses[state];
    // gentle breathing so a held pose never looks frozen
    bob = Math.sin(frame / 9) * 1.2;
  }
  const w = sprites.canvas.w * scale;
  const h = sprites.canvas.h * scale;
  const left = x - sprites.anchor.x * scale;
  const top = y - sprites.anchor.y * scale + bob;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, zIndex}}>
      {/* soft contact shadow on the ground */}
      <div
        style={{
          position: 'absolute',
          left: x - 95 * scale * 1.6 + 14,
          top: y - 14 * scale * 1.6 + 6,
          width: 190 * scale * 1.6,
          height: 28 * scale * 1.6,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(70,50,35,0.28) 0%, rgba(70,50,35,0) 70%)',
        }}
      />
      <Img
        src={staticFile(`${sprites.dir}/${name}.png`)}
        style={{
          position: 'absolute',
          left,
          top,
          width: w,
          height: h,
          transform: direction === -1 ? 'scaleX(-1)' : undefined,
          filter: SHADOWS.mid,
        }}
      />
    </div>
  );
};
