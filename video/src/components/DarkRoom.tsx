import React from 'react';

export type Light =
  | {kind: 'cone'; x: number; y: number; angle: number; spread: number; length: number; strength?: number}
  | {kind: 'glow'; x: number; y: number; r: number; strength?: number};

type Props = {
  lights: Light[];
  /** 0 = no darkness, 1 = fully dark outside the lights */
  darkness: number;
  color?: string;
  /** warm tint added inside flashlight beams */
  beamTint?: string;
  zIndex?: number;
  id?: string;
  /** current frame, drives the dust drifting in the beams */
  frame?: number;
  /** soft warm halo around glows (candle bloom) */
  bloom?: number;
};

const conePath = (l: Extract<Light, {kind: 'cone'}>) => {
  const a = (l.angle * Math.PI) / 180;
  const s = (l.spread * Math.PI) / 180;
  const p1 = [l.x + Math.cos(a - s) * l.length, l.y + Math.sin(a - s) * l.length];
  const p2 = [l.x + Math.cos(a + s) * l.length, l.y + Math.sin(a + s) * l.length];
  const r = Math.tan(s) * l.length;
  return `M${l.x},${l.y}L${p1[0]},${p1[1]}A${r},${r * 0.9} ${l.angle} 0,1 ${p2[0]},${p2[1]}Z`;
};

/**
 * Darkness over the whole stage with holes cut by flashlight cones and soft
 * glows (candles, moonlit windows, the characters' own faint glow).
 */
export const DarkRoom: React.FC<Props> = ({lights, darkness, color = '#0b0a1d', beamTint = '#ffe9a8', zIndex = 200, id = 'dark', frame = 0, bloom = 0}) => {
  const cones = lights.filter((l): l is Extract<Light, {kind: 'cone'}> => l.kind === 'cone');
  const glows = lights.filter((l): l is Extract<Light, {kind: 'glow'}> => l.kind === 'glow');
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, zIndex, pointerEvents: 'none'}}>
      <defs>
        <radialGradient id={`${id}-warm`}>
          <stop offset="0%" stopColor="#ffd98a" stopOpacity={0.55} />
          <stop offset="35%" stopColor="#ffb85c" stopOpacity={0.16} />
          <stop offset="100%" stopColor="#ff9f40" stopOpacity={0} />
        </radialGradient>
        {cones.map((c, i) => (
          <clipPath key={i} id={`${id}-c${i}`}>
            <path d={conePath(c)} />
          </clipPath>
        ))}
        <radialGradient id={`${id}-g`}>
          <stop offset="0%" stopColor="#000" stopOpacity={1} />
          <stop offset="55%" stopColor="#000" stopOpacity={0.7} />
          <stop offset="100%" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={15} />
        </filter>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <rect width={1920} height={1080} fill="#fff" />
          <g filter={`url(#${id}-blur)`}>
            {cones.map((c, i) => (
              <path key={i} d={conePath(c)} fill="#000" fillOpacity={c.strength ?? 1} />
            ))}
          </g>
          {glows.map((l, i) => (
            <circle key={i} cx={l.x} cy={l.y} r={l.r} fill={`url(#${id}-g)`} opacity={l.strength ?? 1} />
          ))}
        </mask>
      </defs>
      <rect width={1920} height={1080} fill={color} opacity={darkness} mask={`url(#${id}-m)`} />
      <g filter={`url(#${id}-blur)`} style={{mixBlendMode: 'screen'}}>
        {cones.map((c, i) => (
          <path key={i} d={conePath(c)} fill={beamTint} opacity={0.24 * (c.strength ?? 1)} />
        ))}
      </g>
      {/* candle bloom */}
      {bloom > 0 &&
        glows.map((l, i) => (
          <circle key={`b${i}`} cx={l.x} cy={l.y} r={l.r * 0.55} fill={`url(#${id}-warm)`} opacity={bloom * (l.strength ?? 1)} style={{mixBlendMode: 'screen'}} />
        ))}
      {/* dust drifting through each flashlight beam */}
      {cones.map((c, i) => (
        <g key={`d${i}`} clipPath={`url(#${id}-c${i})`} style={{mixBlendMode: 'screen'}}>
          {Array.from({length: 46}).map((_, k) => {
            const rx = Math.sin(k * 12.9898 + i * 78.233) * 43758.5453;
            const ry = Math.sin(k * 39.346 + i * 11.135) * 24634.6345;
            const fx = rx - Math.floor(rx), fy = ry - Math.floor(ry);
            const x = ((fx * 1920 + frame * (0.4 + fx * 0.6)) % 1960) - 20;
            const y = ((fy * 1080 + frame * (0.25 + fy * 0.3) + Math.sin(frame / 20 + k) * 8) % 1100) - 10;
            return <circle key={k} cx={x} cy={y} r={0.8 + fy * 1.8} fill="#fff6dc" opacity={0.35 + fx * 0.45} />;
          })}
        </g>
      ))}
    </svg>
  );
};
