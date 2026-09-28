import React from 'react';
import type {Placement} from '../data/scenes';
import {ParallaxLayer} from './ParallaxLayer';
import {cameraX as cameraXAtFrame, girlScreenX} from '../lib/timeline';

type Props = {
  placements: Placement[];
  cameraX: number;
  frame: number;
  /** filter placements by depth, so the character can be slotted in between */
  zRange?: [number, number];
};

/** Renders one stage (a list of depth layers) for the current camera position. */
export const PaperStage: React.FC<Props> = ({placements, cameraX, frame, zRange = [-Infinity, Infinity]}) => (
  <>
    {placements
      .filter((p) => p.z >= zRange[0] && p.z < zRange[1])
      .map((p, i) => {
        // `at` pins the layer's left edge to a screen x at a given frame
        const x = p.at ? p.at.x + (p.at.girl ? girlScreenX(p.at.frame) : 0) + cameraXAtFrame(p.at.frame) * p.speed : 0;
        let rotate = 0;
        if (p.swing && frame >= p.swing.frame) {
          const t = frame - p.swing.frame;
          rotate = Math.sin(t / 2.2) * p.swing.amplitude * Math.exp(-t / 14);
        }
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
            opacity={p.opacity}
            tile={p.tile}
            shadow={p.shadow}
            flip={p.flip}
            rotate={rotate}
          />
        );
      })}
  </>
);
