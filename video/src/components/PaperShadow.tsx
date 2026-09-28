import React from 'react';

// One light source for the whole film: shadows always fall down-right.
export const SHADOWS = {
  none: 'none',
  soft: 'drop-shadow(3px 4px 2px rgba(58,42,30,0.12))',
  mid: 'drop-shadow(5px 7px 3px rgba(58,42,30,0.14))',
  deep: 'drop-shadow(9px 12px 6px rgba(58,42,30,0.18))',
} as const;
export type ShadowDepth = keyof typeof SHADOWS;

export const PaperShadow: React.FC<{depth?: ShadowDepth; style?: React.CSSProperties; children: React.ReactNode}> = ({
  depth = 'mid',
  style,
  children,
}) => <div style={{filter: SHADOWS[depth], ...style}}>{children}</div>;
