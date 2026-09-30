import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
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

/**
 * Paper-Mario style paper doll: one flat die-cut sheet (no leg animation) that
 * - walks by hopping along, squashing a little on every landing,
 * - waddles side to side and flutters a little (it's paper),
 * - turns by flipping around its vertical axis, showing the paper edge.
 */
export const WalkingGirl: React.FC<WalkingGirlProps> = ({
  x, y, scale, state, walkingSpeed = 0, distance, direction = 1, flip = 0, hop = 0, zIndex = 100, sprites = GIRL,
}) => {
  const frame = useCurrentFrame();

  let lift = hop;
  let rock = 0; // rotateZ
  let flutter = 0; // rotateY wobble
  let sx = 1;
  let sy = 1;

  const name = sprites.poses[state];
  if (state === 'walking') {
    // No leg animation: the single paper sheet hops along ("hyoko hyoko").
    const d = distance ?? frame * walkingSpeed;
    const hopPos = d / sprites.hopDistance;
    const n = Math.floor(hopPos);
    const p = hopPos - n; // 0 = just landed, 1 = about to land again
    const arc = Math.sin(Math.PI * p);
    lift += sprites.hopHeight * Math.pow(arc, 0.85);
    // waddle: tip to one side on this hop, the other side on the next
    rock = 2 + (n % 2 ? 1 : -1) * 4 * arc;
    flutter = (n % 2 ? 1 : -1) * 6 * arc;
    // squash on landing, stretch at the top
    const landing = Math.max(0, 1 - p / 0.25) ** 2;
    sy = 1 - 0.09 * landing + 0.035 * arc;
    sx = 1 + 0.06 * landing - 0.02 * arc;
  } else {
    // idle: gentle breathing and a slow paper sway so it never looks frozen
    sy = 1 + Math.sin(frame / 8) * 0.012;
    sx = 1 - Math.sin(frame / 8) * 0.006;
    flutter = Math.sin(frame / 17) * 5;
  }
  // stretch while in the air during reaction hops
  if (hop > 0) {
    sy *= 1 + Math.min(0.08, hop / 600);
    sx *= 1 - Math.min(0.05, hop / 900);
  }

  const angle = flip + flutter;
  const facing = Math.cos((angle * Math.PI) / 180); // 1 = flat to camera, 0 = edge-on
  const edgeOn = Math.abs(facing) < 0.18;
  const w = sprites.canvas.w * scale;
  const h = sprites.canvas.h * scale;
  const left = x - sprites.anchor.x * scale;
  const top = y - sprites.anchor.y * scale - lift;
  const originX = sprites.anchor.x * scale;
  const originY = sprites.anchor.y * scale;
  // light falls from the upper left: the sheet darkens as it turns away
  const light = 0.82 + 0.18 * Math.abs(facing);
  // blob shadow shrinks and fades as she leaves the ground
  const shadowK = Math.max(0.45, 1 - lift / 140);

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, zIndex, perspective: 1600, perspectiveOrigin: `${x}px ${y - 250}px`}}>
      <div
        style={{
          position: 'absolute',
          left: x - 80 * shadowK,
          top: y - 12,
          width: 160 * shadowK,
          height: 26 * shadowK,
          borderRadius: '50%',
          background: 'rgba(60,42,30,0.30)',
          filter: 'blur(3px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: w,
          height: h,
          transformOrigin: `${originX}px ${originY}px`,
          transform: `rotateZ(${rock}deg) rotateY(${angle + (direction === -1 ? 180 : 0)}deg) scale(${sx}, ${sy})`,
        }}
      >
        <Img
          src={staticFile(`${sprites.dir}/${name}.png`)}
          style={{
            position: 'absolute',
            inset: 0,
            width: w,
            height: h,
            filter: `brightness(${light}) drop-shadow(4px 6px 3px rgba(58,42,30,0.18))`,
            opacity: edgeOn ? 0 : 1,
          }}
        />
      </div>
      {edgeOn && (
        // the sheet seen edge-on: just a thin strip of paper
        <div
          style={{
            position: 'absolute',
            left: x - 3,
            top: y - (sprites.anchor.y - sprites.headTop.y) * scale - lift,
            width: 6,
            height: (sprites.anchor.y - sprites.headTop.y) * scale,
            borderRadius: 3,
            background: 'linear-gradient(#fffdf8, #e8e0d2)',
            boxShadow: '2px 3px 3px rgba(58,42,30,0.25)',
          }}
        />
      )}
    </div>
  );
};
