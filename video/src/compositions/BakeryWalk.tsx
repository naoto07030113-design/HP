import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {AromaEffect} from '../components/AromaEffect';
import {PaperStage} from '../components/PaperStage';
import {SakuraPetals} from '../components/SakuraPetals';
import {WalkingGirl} from '../components/WalkingGirl';
import {SHADOWS} from '../components/PaperShadow';
import {Soundtrack} from '../components/Soundtrack';
import manifest from '../data/asset-manifest.json';
import {CAMERA, EFFECTS, GIRL_SCALE, GIRL_TRACK, GROUND_Y, STAGES, TRANSITION, VIDEO} from '../data/scenes';
import {cameraX, characterStateAt, girlDistance, girlScreenX, sampleKeys} from '../lib/timeline';

const PAPER = '#f4ecdd';

export const BakeryWalk: React.FC = () => {
  const frame = useCurrentFrame();
  const stage = frame < TRANSITION.switchFrame ? 'street' : 'bakery';
  const cam = cameraX(frame);
  const zoom = sampleKeys(CAMERA.zoom, frame);
  const originX = sampleKeys(CAMERA.zoomOriginX, frame);
  const gx = girlScreenX(frame);

  // wipe: a huge blossom tree sweeps past the lens
  const tr = TRANSITION.tree;
  const treeSize = (manifest as Record<string, {w: number; h: number}>)[tr.src];
  const treeX = interpolate(frame, [tr.from, tr.to], [tr.x0, tr.x1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const showTree = frame >= tr.from && frame <= tr.to;

  const fade = Math.max(
    interpolate(frame, EFFECTS.fadeIn, [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    interpolate(frame, EFFECTS.fadeOut, [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );

  return (
    <AbsoluteFill style={{backgroundColor: PAPER, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: `${originX * 100}% ${CAMERA.zoomOriginY * 100}%`}}>
        <PaperStage placements={STAGES[stage]} cameraX={cam} frame={frame} />
        {frame >= GIRL_TRACK.enterFrame && (
          <WalkingGirl
            x={gx}
            y={GROUND_Y}
            scale={GIRL_SCALE}
            state={characterStateAt(frame)}
            distance={girlDistance(frame)}
            zIndex={100}
          />
        )}
        <AromaEffect from={EFFECTS.aroma.from} to={EFFECTS.aroma.to} x={gx + 110} y={GROUND_Y - 190} zIndex={115} />
        <SakuraPetals count={EFFECTS.petals.count} seed={EFFECTS.petals.seed} zIndex={140} />
      </AbsoluteFill>
      {showTree && treeSize && (
        <Img
          src={staticFile(tr.src)}
          style={{
            position: 'absolute',
            left: treeX,
            top: tr.y,
            width: treeSize.w * tr.scale,
            height: treeSize.h * tr.scale,
            filter: SHADOWS.deep,
          }}
        />
      )}
      <AbsoluteFill style={{backgroundColor: PAPER, opacity: fade}} />
      <Soundtrack />
    </AbsoluteFill>
  );
};

export const BAKERY_WALK_DURATION = VIDEO.durationInFrames;
