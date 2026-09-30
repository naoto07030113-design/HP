import React from 'react';
import {Audio, interpolate, Sequence, staticFile} from 'remotion';
import {BGM, FOOTSTEP, SFX} from '../data/audio';
import {GIRL} from '../data/characters';
import {VIDEO} from '../data/scenes';
import {landingFrames} from '../lib/timeline';

const STEPS = landingFrames(GIRL.hopDistance);

export const Soundtrack: React.FC = () => (
  <>
    <Audio
      src={staticFile(BGM.src)}
      volume={(f) =>
        BGM.volume * interpolate(f, [0, 20, BGM.fadeOutFrom, VIDEO.durationInFrames], [0, 1, 1, 0], {extrapolateRight: 'clamp'})
      }
    />
    {SFX.map((s, i) => (
      <Sequence key={i} from={s.from} layout="none">
        <Audio src={staticFile(s.src)} volume={s.volume} />
      </Sequence>
    ))}
    {STEPS.map((f, i) => (
      <Sequence key={`step-${f}`} from={f} durationInFrames={10} layout="none">
        <Audio src={staticFile(FOOTSTEP.src)} volume={FOOTSTEP.volume * (i % 2 ? 0.85 : 1)} />
      </Sequence>
    ))}
  </>
);
