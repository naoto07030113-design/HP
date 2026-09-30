import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';

export type DollMotionInput = {
  frame: number;
  walking: boolean;
  /** distance walked so far; hops are spaced by distance so they match the ground */
  distance: number;
  hopDistance: number;
  hopHeight: number;
  /** extra jump height from reaction hops, px */
  hop?: number;
  /** trembling amplitude, px (scared characters) */
  tremble?: number;
  /** 1 = full Paper-Mario bounce; lower = calmer, more natural gait */
  bounce?: number;
};
export type DollMotion = {lift: number; rock: number; flutter: number; sx: number; sy: number; shakeX: number};

/**
 * Paper-Mario style motion for one flat sheet: it walks by hopping along
 * (squash on landing, waddle side to side), breathes when idle, stretches
 * during reaction hops and can tremble.
 */
export const dollMotion = ({frame, walking, distance, hopDistance, hopHeight, hop = 0, tremble = 0, bounce = 1}: DollMotionInput): DollMotion => {
  let lift = hop;
  let rock = 0;
  let flutter = 0;
  let sx = 1;
  let sy = 1;
  if (walking) {
    const hopPos = distance / hopDistance;
    const n = Math.floor(hopPos);
    const p = hopPos - n; // 0 = just landed, 1 = about to land again
    const arc = Math.sin(Math.PI * p);
    lift += hopHeight * Math.pow(arc, 0.85);
    rock = 2 * bounce + (n % 2 ? 1 : -1) * 4 * arc * bounce;
    flutter = (n % 2 ? 1 : -1) * 6 * arc * bounce;
    const landing = Math.max(0, 1 - p / 0.25) ** 2;
    sy = 1 - 0.09 * landing * bounce + 0.035 * arc * bounce;
    sx = 1 + 0.06 * landing * bounce - 0.02 * arc * bounce;
  } else {
    sy = 1 + Math.sin(frame / 8) * 0.012;
    sx = 1 - Math.sin(frame / 8) * 0.006;
    flutter = Math.sin(frame / 17) * 5 * bounce;
  }
  if (hop > 0) {
    sy *= 1 + Math.min(0.08, hop / 600);
    sx *= 1 - Math.min(0.05, hop / 900);
  }
  // trembling: fast tiny jitter (deterministic)
  const shakeX = tremble ? Math.sin(frame * 2.7) * tremble + Math.sin(frame * 5.3) * tremble * 0.4 : 0;
  if (tremble) rock += Math.sin(frame * 3.1) * tremble * 0.25;
  return {lift, rock, flutter, sx, sy, shakeX};
};

export type PaperDollProps = {
  /** image path under public/ */
  src: string;
  /** screen x of the anchor (hip line) and y of the soles */
  x: number;
  y: number;
  scale: number;
  canvas: {w: number; h: number};
  anchor: {x: number; y: number};
  /** canvas y of the top of the head (for the edge-on paper strip) */
  headTopY: number;
  motion: DollMotion;
  /** paper flip angle around the vertical axis (deg), 0 = flat to camera */
  flip?: number;
  direction?: 1 | -1;
  zIndex?: number;
  /** tint for lighting (1 = normal) */
  brightness?: number;
  shadowColor?: string;
  /** render only a soft dark silhouette (the doll's shadow cast on the wall) */
  silhouette?: {dx: number; dy: number; scale: number; blur: number; opacity: number};
};

/** One flat die-cut paper sheet with a blob shadow; turns by flipping, showing its edge. */
export const PaperDoll: React.FC<PaperDollProps> = ({
  src, x, y, scale, canvas, anchor, headTopY, motion, flip = 0, direction = 1, zIndex = 100, brightness = 1, shadowColor = 'rgba(60,42,30,0.30)', silhouette,
}) => {
  const {lift, rock, flutter, sx, sy, shakeX} = motion;
  const angle = flip + flutter;
  const facing = Math.cos((angle * Math.PI) / 180); // 1 = flat to camera, 0 = edge-on
  const edgeOn = Math.abs(facing) < 0.18;
  const w = canvas.w * scale;
  const h = canvas.h * scale;
  const cx = x + shakeX;
  const left = cx - anchor.x * scale;
  const top = y - anchor.y * scale - lift;
  // the sheet darkens as it turns away from the light
  const light = (0.82 + 0.18 * Math.abs(facing)) * brightness;
  const shadowK = Math.max(0.45, 1 - lift / 140);
  if (silhouette) {
    const k = silhouette.scale;
    return (
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, zIndex, perspective: 1600, perspectiveOrigin: `${cx}px ${y - 250}px`}}>
        <div
          style={{
            position: 'absolute',
            left: cx - anchor.x * scale * k + silhouette.dx,
            top: y - anchor.y * scale * k - lift * k + silhouette.dy,
            width: w * k,
            height: h * k,
            transformOrigin: `${anchor.x * scale * k}px ${anchor.y * scale * k}px`,
            transform: `rotateZ(${rock * direction}deg) rotateY(${angle + (direction === -1 ? 180 : 0)}deg) scale(${sx}, ${sy})`,
            opacity: edgeOn ? 0 : silhouette.opacity,
          }}
        >
          <Img src={staticFile(src)} style={{position: 'absolute', inset: 0, width: w * k, height: h * k, filter: `brightness(0) blur(${silhouette.blur}px)`}} />
        </div>
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, zIndex, perspective: 1600, perspectiveOrigin: `${cx}px ${y - 250}px`}}>
      <div
        style={{
          position: 'absolute',
          left: cx - 80 * shadowK,
          top: y - 12,
          width: 160 * shadowK,
          height: 26 * shadowK,
          borderRadius: '50%',
          background: shadowColor,
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
          transformOrigin: `${anchor.x * scale}px ${anchor.y * scale}px`,
          transform: `rotateZ(${rock * direction}deg) rotateY(${angle + (direction === -1 ? 180 : 0)}deg) scale(${sx}, ${sy})`,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            position: 'absolute',
            inset: 0,
            width: w,
            height: h,
            filter: `brightness(${light}) drop-shadow(4px 6px 3px rgba(20,14,10,0.22))`,
            opacity: edgeOn ? 0 : 1,
          }}
        />
      </div>
      {edgeOn && (
        // the sheet seen edge-on: just a thin strip of paper
        <div
          style={{
            position: 'absolute',
            left: cx - 3,
            top: y - (anchor.y - headTopY) * scale - lift,
            width: 6,
            height: (anchor.y - headTopY) * scale,
            borderRadius: 3,
            background: 'linear-gradient(#fffdf8, #e8e0d2)',
            boxShadow: '2px 3px 3px rgba(58,42,30,0.25)',
          }}
        />
      )}
    </div>
  );
};
