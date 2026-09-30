import React from 'react';
import {Img, staticFile} from 'remotion';
import manifest from '../data/asset-manifest.json';
import {SHADOWS, type ShadowDepth} from './PaperShadow';

type Size = {w: number; h: number};
const sizes = manifest as Record<string, Size>;
const VIEW_W = 1920;

export type ParallaxLayerProps = {
  src: string;
  /** camera position on the character plane */
  cameraX: number;
  /** 0 = fixed to the camera (sky), 1 = character plane, >1 = in front of the character */
  speed: number;
  /** layer-space x of the left edge (screen x when cameraX = 0) */
  x?: number;
  y: number;
  scale?: number;
  zIndex: number;
  opacity?: number;
  tile?: boolean;
  shadow?: ShadowDepth;
  flip?: boolean;
  rotate?: number;
  /** extra CSS transform for animated props, and its origin */
  transform?: string;
  transformOrigin?: string;
  brightness?: number;
};

export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  src, cameraX, speed, x = 0, y, scale = 1, zIndex, opacity = 1, tile = false, shadow = 'mid', flip = false, rotate = 0, transform, transformOrigin = '50% 0%', brightness,
}) => {
  const size = sizes[src];
  if (!size) throw new Error(`Unknown asset ${src}; run npm run assets`);
  const w = size.w * scale;
  const h = size.h * scale;
  const left = x - cameraX * speed;
  // cull layers that are fully off screen
  if (!tile && (left > VIEW_W + 40 || left + w < -40)) return null;

  const img = (key: string | number, l: number) => (
    <Img
      key={key}
      src={staticFile(src)}
      style={{
        position: 'absolute',
        left: l,
        top: 0,
        width: w,
        height: h,
        transform: `${transform ?? ''} ${flip ? 'scaleX(-1)' : ''} ${rotate ? `rotate(${rotate}deg)` : ''}`.trim() || undefined,
        transformOrigin,
      }}
    />
  );

  let copies: React.ReactNode[];
  if (tile) {
    const start = ((left % w) + w) % w - w;
    copies = [];
    for (let i = 0, lx = start; lx < VIEW_W; i++, lx += w) copies.push(img(i, lx));
  } else {
    copies = [img(0, left)];
  }
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: VIEW_W, height: h, zIndex, opacity, filter: `${brightness != null ? `brightness(${brightness}) ` : ''}${SHADOWS[shadow] === 'none' ? '' : SHADOWS[shadow]}`.trim() || undefined}}>
      {copies}
    </div>
  );
};
