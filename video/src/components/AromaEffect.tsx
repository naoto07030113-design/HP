import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

type Props = {from: number; to: number; x: number; y: number; zIndex?: number};

const RIBBONS = [
  {dx: 0, color: '#fff3dc', edge: '#d2b584', delay: 0, w: 30, amp: 40},
  {dx: 110, color: '#fffdf6', edge: '#cdbb9c', delay: 8, w: 24, amp: 32},
  {dx: 215, color: '#f3dcb4', edge: '#c9a36c', delay: 16, w: 28, amp: 44},
];

/** Bread aroma: long curling strips of cut paper that rise and fade (not smoke). */
export const AromaEffect: React.FC<Props> = ({from, to, x, y, zIndex = 120}) => {
  const frame = useCurrentFrame();
  if (frame < from || frame > to + 30) return null;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex, pointerEvents: 'none'}}>
      {RIBBONS.map((r, i) => {
        const f = frame - from - r.delay;
        const len = to - from;
        const reveal = interpolate(f, [0, len * 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const opacity = interpolate(f, [0, 10, len * 0.7, len], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const rise = interpolate(f, [0, len], [60, -140], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const sway = Math.sin(f / 12 + i) * 10;
        const d = `M0,420 C${r.amp},360 ${-r.amp},300 0,240 C${r.amp},180 ${-r.amp},120 0,60 C${r.amp * 0.6},20 ${-r.amp * 0.3},0 10,-20`;
        const total = 520;
        const common = {
          fill: 'none',
          strokeLinecap: 'round' as const,
          strokeDasharray: total,
          strokeDashoffset: total * (1 - reveal),
        };
        return (
          <svg
            key={i}
            width={120}
            height={480}
            viewBox="-60 -40 120 480"
            style={{
              position: 'absolute',
              left: x + r.dx + sway - 60,
              top: y + rise - 440,
              opacity,
              filter: 'drop-shadow(5px 8px 4px rgba(58,42,30,0.22))',
            }}
          >
            <path d={d} {...common} stroke={r.edge} strokeWidth={r.w} transform="translate(2.5,4.5)" />
            <path d={d} {...common} stroke={r.color} strokeWidth={r.w} />
            <path d={d} {...common} stroke="#ffffff" strokeWidth={r.w * 0.25} opacity={0.6} />
          </svg>
        );
      })}
    </div>
  );
};
