import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type EmoteType = 'exclaim' | 'heart' | 'note' | 'sweat';

type Props = {type: EmoteType; from: number; duration: number; x: number; y: number; zIndex?: number};

const WHITE = '#fffdf8';
type Paint = {fill: string; stroke: string; sw: number};
// Each icon is drawn from plain shapes so the same geometry can be reused for
// the white die-cut border (fat white stroke) and the printed icon on top.
const SHAPES: Record<EmoteType, (p: Paint) => React.ReactNode> = {
  exclaim: ({fill, stroke, sw}) => (
    <>
      <path d="M-13,-58 Q0,-66 13,-58 L7,6 Q0,11 -7,6 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <circle cx={0} cy={28} r={11} fill={fill} stroke={stroke} strokeWidth={sw} />
    </>
  ),
  heart: ({fill, stroke, sw}) => (
    <path d="M0,34 C-40,6 -44,-22 -24,-32 C-12,-38 -2,-30 0,-20 C2,-30 12,-38 24,-32 C44,-22 40,6 0,34Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
  ),
  sweat: ({fill, stroke, sw}) => (
    <path d="M0,-40 C14,-14 26,4 26,18 C26,34 14,44 0,44 C-14,44 -26,34 -26,18 C-26,4 -14,-14 0,-40Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
  ),
  note: ({fill, stroke, sw}) => (
    <>
      <path d="M-4,-40 L22,-48 L22,14" fill="none" stroke={stroke} strokeWidth={7 + sw} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-4,-40 L-4,24" stroke={stroke} strokeWidth={7 + sw} strokeLinecap="round" />
      <ellipse cx={11} cy={16} rx={13} ry={10} fill={fill} stroke={stroke} strokeWidth={sw} />
      <ellipse cx={-15} cy={26} rx={13} ry={10} fill={fill} stroke={stroke} strokeWidth={sw} />
    </>
  ),
};
const INK: Record<EmoteType, Paint> = {
  exclaim: {fill: '#e8475f', stroke: '#c4324a', sw: 2},
  heart: {fill: '#f47c96', stroke: '#d65a76', sw: 2},
  note: {fill: '#6aa0d8', stroke: '#6aa0d8', sw: 0.01},
  sweat: {fill: '#8fd0f5', stroke: '#5aa9d8', sw: 2},
};

/** Paper-Mario style reaction icon: a die-cut paper sticker that pops above the head. */
export const Emote: React.FC<Props> = ({type, from, duration, x, y, zIndex = 130}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame - from;
  if (t < 0 || t > duration) return null;
  const pop = spring({frame: t, fps, config: {damping: 9, stiffness: 180}});
  const out = t > duration - 6 ? (duration - t) / 6 : 1;
  const bob = Math.sin(t / 5) * 3;
  const tilt = type === 'exclaim' ? Math.sin(t / 3) * 6 * Math.exp(-t / 12) : Math.sin(t / 7) * 5;
  return (
    <svg
      width={160}
      height={160}
      viewBox="-80 -80 160 160"
      style={{
        position: 'absolute',
        left: x - 80,
        top: y - 150 + bob - pop * 12,
        zIndex,
        transform: `scale(${pop * out}) rotate(${tilt}deg)`,
        transformOrigin: '50% 100%',
        filter: 'drop-shadow(4px 6px 3px rgba(58,42,30,0.22))',
      }}
    >
      {/* white die-cut border + paper edge, then the printed icon */}
      <g transform="translate(1.5,4)">{SHAPES[type]({fill: '#cfc6b6', stroke: '#cfc6b6', sw: 22})}</g>
      {SHAPES[type]({fill: WHITE, stroke: WHITE, sw: 20})}
      {SHAPES[type](INK[type])}
    </svg>
  );
};
