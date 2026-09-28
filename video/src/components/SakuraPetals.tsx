import React from 'react';
import {random, useCurrentFrame} from 'remotion';

type Props = {count?: number; seed?: string; zIndex?: number; wind?: number; opacity?: number};

// A few cut-paper petals drifting across the frame (never a blizzard).
export const SakuraPetals: React.FC<Props> = ({count = 6, seed = 'petals', zIndex = 150, wind = 0, opacity = 1}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: 0, zIndex, pointerEvents: 'none', opacity}}>
      {Array.from({length: count}).map((_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const period = 150 + r('p') * 150; // frames to cross the screen
        const t = ((frame + r('o') * period) % period) / period;
        const size = 18 + r('s') * 22;
        const x = 2100 - t * (2300 + wind * 400) + Math.sin(frame / (18 + r('w') * 14) + i) * 40;
        const y = -60 + t * (700 + r('y') * 500) + r('y0') * 200;
        const rot = frame * (2 + r('r') * 4) * (r('d') > 0.5 ? 1 : -1) + r('a') * 360;
        const flip = 0.45 + 0.55 * Math.abs(Math.cos(frame / (10 + r('f') * 12) + i));
        const pink = r('c') > 0.4 ? '#f7c3cf' : '#fbdbe3';
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="-20 -20 40 40"
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: `rotate(${rot}deg) scaleY(${flip})`,
              filter: 'drop-shadow(3px 4px 2px rgba(58,42,30,0.16))',
            }}
          >
            <path d="M0,17 C-15,6 -13,-12 -4,-16 L0,-11 L4,-16 C13,-12 15,6 0,17Z" fill="#e79fb1" transform="translate(0.8,1.6)" />
            <path d="M0,17 C-15,6 -13,-12 -4,-16 L0,-11 L4,-16 C13,-12 15,6 0,17Z" fill={pink} stroke="#eaa9b9" strokeWidth={1.2} />
            <path d="M0,12 L0,-4" stroke="#f3aebe" strokeWidth={1.4} strokeLinecap="round" />
          </svg>
        );
      })}
    </div>
  );
};
