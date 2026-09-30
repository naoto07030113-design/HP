import React from 'react';
import {random, useCurrentFrame} from 'remotion';

type Props = {
  /** first frame of the burst */
  from: number;
  /** where the bats pour out of (screen px) */
  origin: {x: number; y: number};
  count?: number;
  /** frames over which new bats keep coming */
  spawnFrames?: number;
  seed?: string;
  zIndex?: number;
  /** the last bats fly straight at the lens and fill the frame */
  finale?: {from: number; count: number};
};

/** A cute paper bat (die-cut: white border + card edge). wing: 0 = up, 1 = down. */
export const Bat: React.FC<{size: number; wing: number; style?: React.CSSProperties}> = ({size, wing, style}) => {
  const wy = -30 + wing * 50; // wing tip height
  const wings = `M0,6 C-20,-8 -50,${wy - 10} -92,${wy} C-80,${wy + 16} -74,${wy + 20} -66,${wy + 30} C-56,${wy + 18} -48,${wy + 26} -40,${wy + 36} C-30,${wy + 22} -20,18 0,14 C20,18 30,${wy + 22} 40,${wy + 36} C48,${wy + 26} 56,${wy + 18} 66,${wy + 30} C74,${wy + 20} 80,${wy + 16} 92,${wy} C50,${wy - 10} 20,-8 0,6Z`;
  const body = 'M0,-30 C22,-30 30,-10 30,6 C30,28 16,40 0,40 C-16,40 -30,28 -30,6 C-30,-10 -22,-30 0,-30Z M-24,-18 L-30,-50 L-8,-28Z M24,-18 L30,-50 L8,-28Z';
  return (
    <svg width={size} height={size} viewBox="-110 -90 220 180" style={{position: 'absolute', overflow: 'visible', ...style}}>
      <g transform="translate(2,6)" fill="#b9b2c8" stroke="#b9b2c8" strokeWidth={14} strokeLinejoin="round">
        <path d={wings} />
        <path d={body} />
      </g>
      <g fill="#fffdf8" stroke="#fffdf8" strokeWidth={12} strokeLinejoin="round">
        <path d={wings} />
        <path d={body} />
      </g>
      <path d={wings} fill="#4a3566" stroke="#33234a" strokeWidth={2} strokeLinejoin="round" />
      <path d={body} fill="#3b2a55" stroke="#2a1d3d" strokeWidth={2} strokeLinejoin="round" />
      <ellipse cx={-11} cy={-2} rx={8} ry={9} fill="#ffe36b" />
      <ellipse cx={11} cy={-2} rx={8} ry={9} fill="#ffe36b" />
      <circle cx={-9} cy={0} r={4} fill="#1a1024" />
      <circle cx={13} cy={0} r={4} fill="#1a1024" />
      <path d="M-8,16 L-4,24 L0,16 L4,24 L8,16" fill="#fff" stroke="#fff" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
};

/** Bats pouring out of a doorway, then a final wave that fills the screen. */
export const BatSwarm: React.FC<Props> = ({from, origin, count = 36, spawnFrames = 70, seed = 'bats', zIndex = 260, finale}) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  const bats: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const t0 = from + r('t') * spawnFrames;
    const t = frame - t0;
    const life = 50 + r('l') * 40;
    if (t < 0 || t > life) continue;
    const k = t / life;
    const ang = (-170 + r('a') * 160) * (Math.PI / 180); // mostly up and sideways
    const dist = (500 + r('d') * 1300) * (1 - Math.pow(1 - k, 2));
    const toward = r('c') < 0.5; // some fly at the camera and grow
    const size = (60 + r('s') * 60) * (toward ? 1 + k * 3 : 1 + k * 0.6);
    const x = origin.x + Math.cos(ang) * dist + Math.sin(t / 4 + i) * 30 - size / 2;
    const y = origin.y + Math.sin(ang) * dist * 0.75 + Math.sin(t / 3 + i * 2) * 20 - size / 2;
    const wing = 0.5 + 0.5 * Math.sin(t * 1.1 + i);
    bats.push(<Bat key={i} size={size} wing={wing} style={{left: x, top: y, transform: `rotate(${Math.sin(t / 5 + i) * 14}deg)`}} />);
  }
  if (finale && frame >= finale.from) {
    for (let i = 0; i < finale.count; i++) {
      const r = (k: string) => random(`${seed}-fin-${i}-${k}`);
      const t = frame - finale.from - r('t') * 25;
      if (t < 0) continue;
      const k = Math.min(1, t / 40);
      const tx = r('x') * 1920, ty = r('y') * 1080;
      const x = origin.x + (tx - origin.x) * k;
      const y = origin.y + (ty - origin.y) * k;
      const size = 120 + k * (500 + r('s') * 500);
      const wing = 0.5 + 0.5 * Math.sin(t * 1.2 + i);
      bats.push(<Bat key={`f${i}`} size={size} wing={wing} style={{left: x - size / 2, top: y - size / 2, transform: `rotate(${(r('r') - 0.5) * 30}deg)`}} />);
    }
  }
  return <div style={{position: 'absolute', inset: 0, zIndex, pointerEvents: 'none'}}>{bats}</div>;
};
