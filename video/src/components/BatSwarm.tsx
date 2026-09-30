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
  /** 'cute' = Paper-Mario sticker bats, 'real' = realistic cut-paper bats */
  variant?: 'cute' | 'real';
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

/** Realistic cut-paper bat: membrane wings stretched over finger bones. wing: 0 = up, 1 = down. */
export const RealBat: React.FC<{size: number; wing: number; style?: React.CSSProperties}> = ({size, wing, style}) => {
  const w = wing;
  const wr: [number, number] = [52, -24 + 44 * w];
  const t1: [number, number] = [132, -64 + 120 * w];
  const t2: [number, number] = [116, -20 + 96 * w];
  const t3: [number, number] = [84, 16 + 62 * w];
  const foot: [number, number] = [14, 30];
  const inward = (a: [number, number], b: [number, number]) => {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return `${m[0] + (30 - m[0]) * 0.32},${m[1] + (8 - m[1]) * 0.32}`;
  };
  const membrane = `M6,-8L${wr}L${t1}Q${inward(t1, t2)} ${t2}Q${inward(t2, t3)} ${t3}Q${inward(t3, foot)} ${foot}Z`;
  const bones = `M6,-8L${wr}M${wr}L${t1}M${wr}L${t2}M${wr}L${t3}`;
  const oneWing = (
    <>
      <path d={membrane} fill="#17110f" stroke="#4d4244" strokeWidth={1.6} strokeLinejoin="round" />
      <path d={membrane} fill="url(#batSheen)" />
      <path d={bones} stroke="#3a3033" strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </>
  );
  return (
    <svg width={size} height={size} viewBox="-150 -110 300 220" style={{position: 'absolute', overflow: 'visible', ...style}}>
      <defs>
        <linearGradient id="batSheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.06} />
          <stop offset="1" stopColor="#000" stopOpacity={0.25} />
        </linearGradient>
      </defs>
      <g transform="translate(3,6)" opacity={0.35} fill="#000">
        <path d={membrane} />
        <path d={membrane} transform="scale(-1,1)" />
      </g>
      {oneWing}
      <g transform="scale(-1,1)">{oneWing}</g>
      <ellipse cx={0} cy={8} rx={17} ry={25} fill="#211815" stroke="#4d4244" strokeWidth={1.4} />
      <path d="M-10,-2q4,8 0,16M0,0q3,9 0,18M10,-2q-4,8 0,16" stroke="#3a2c26" strokeWidth={1.4} fill="none" />
      <path d="M-13,-22L-17,-44L-4,-30ZM13,-22L17,-44L4,-30Z" fill="#211815" stroke="#4d4244" strokeWidth={1.2} strokeLinejoin="round" />
      <circle cx={0} cy={-20} r={14} fill="#211815" stroke="#4d4244" strokeWidth={1.4} />
      <circle cx={-5} cy={-22} r={2.2} fill="#d9a441" />
      <circle cx={5} cy={-22} r={2.2} fill="#d9a441" />
      <path d="M-3,-12L0,-8L3,-12" stroke="#e8ddd0" strokeWidth={1.2} fill="none" />
    </svg>
  );
};

/** Bats pouring out of a doorway, then a final wave that fills the screen. */
export const BatSwarm: React.FC<Props> = ({from, origin, count = 36, spawnFrames = 70, seed = 'bats', zIndex = 260, finale, variant = 'cute'}) => {
  const frame = useCurrentFrame();
  const B = variant === 'real' ? RealBat : Bat;
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
    bats.push(<B key={i} size={size} wing={wing} style={{left: x, top: y, transform: `rotate(${Math.sin(t / 5 + i) * 14}deg)`, filter: variant === 'real' && size > 200 ? `blur(${Math.min(6, (size - 200) / 60)}px)` : undefined}} />);
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
      bats.push(<B key={`f${i}`} size={size} wing={wing} style={{left: x - size / 2, top: y - size / 2, transform: `rotate(${(r('r') - 0.5) * 30}deg)`, filter: variant === 'real' ? `blur(${Math.min(8, size / 150)}px)` : undefined}} />);
    }
  }
  return <div style={{position: 'absolute', inset: 0, zIndex, pointerEvents: 'none'}}>{bats}</div>;
};
