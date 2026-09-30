import React from 'react';
import type {LayerAnim, Placement} from '../lib/stage';
import {ParallaxLayer} from './ParallaxLayer';

type Props = {
  placements: Placement[];
  cameraX: number;
  frame: number;
  /** camera x at any frame (resolves `at` pins) */
  cameraXAt: (frame: number) => number;
  /** screen x of a named actor at a frame (resolves `at.anchor` pins) */
  anchorXAt?: (anchor: string, frame: number) => number;
  /** per-frame overrides for animated props, looked up by placement id */
  animate?: (id: string, frame: number) => LayerAnim | null;
  /** filter placements by depth, so the character can be slotted in between */
  zRange?: [number, number];
};

/** Screen x of a placement's left edge for the current camera position. */
export const placementLeft = (
  p: Placement,
  cameraX: number,
  cameraXAt: (frame: number) => number,
  anchorXAt?: (anchor: string, frame: number) => number,
) => {
  let x = 0;
  if (p.at) {
    const anchor = p.at.anchor ?? (p.at.girl ? 'girl' : undefined);
    x = p.at.x + (anchor && anchorXAt ? anchorXAt(anchor, p.at.frame) : 0) + cameraXAt(p.at.frame) * p.speed;
  }
  return x - cameraX * p.speed;
};

/** Renders one stage (a list of depth layers) for the current camera position. */
export const PaperStage: React.FC<Props> = ({placements, cameraX, frame, cameraXAt, anchorXAt, animate, zRange = [-Infinity, Infinity]}) => (
  <>
    {placements
      .filter((p) => p.z >= zRange[0] && p.z < zRange[1])
      .map((p, i) => {
        // `at` pins the layer's left edge to a screen x at a given frame
        let x = 0;
        if (p.at) {
          const anchor = p.at.anchor ?? (p.at.girl ? 'girl' : undefined);
          x = p.at.x + (anchor && anchorXAt ? anchorXAt(anchor, p.at.frame) : 0) + cameraXAt(p.at.frame) * p.speed;
        }
        let rotate = 0;
        if (p.swing && frame >= p.swing.frame) {
          const t = frame - p.swing.frame;
          rotate = Math.sin(t / 2.2) * p.swing.amplitude * Math.exp(-t / 14);
        }
        const a = p.id && animate ? animate(p.id, frame) : null;
        if (a?.hidden) return null;
        const transform = a
          ? `translate(${a.dx ?? 0}px, ${a.dy ?? 0}px) rotate(${a.rotate ?? 0}deg) scale(${a.scaleX ?? 1}, ${a.scaleY ?? 1})`
          : undefined;
        return (
          <ParallaxLayer
            key={`${p.src}-${i}`}
            src={p.src}
            cameraX={cameraX}
            speed={p.speed}
            x={x}
            y={p.y}
            scale={p.scale}
            zIndex={p.z}
            opacity={(p.opacity ?? 1) * (a?.opacity ?? 1)}
            tile={p.tile}
            shadow={p.shadow}
            flip={p.flip}
            rotate={rotate}
            transform={transform}
            transformOrigin={a?.origin}
            brightness={p.brightness}
          />
        );
      })}
  </>
);
