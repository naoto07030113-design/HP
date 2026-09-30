import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {EVENTS, VIDEO} from '../data/mansion/story';
import {landingFrames} from '../data/mansion/timeline';
import {sampleKeys} from '../lib/motion';

const A = 'assets/audio/mansion/';
const SFX: {src: string; from: number; volume: number}[] = [
  {src: A + 'thunder.mp3', from: EVENTS.lightning[0][0], volume: 0.7},
  {src: A + 'thunder.mp3', from: EVENTS.lightning[2][0], volume: 0.5},
  {src: A + 'clink.mp3', from: EVENTS.bottle.wobble, volume: 0.6},
  {src: A + 'bottle.mp3', from: EVENTS.bottle.fall - 11, volume: 0.8},
  {src: A + 'sting.mp3', from: EVENTS.bottle.land, volume: 0.55},
  {src: A + 'thud.mp3', from: EVENTS.painting.land - 2, volume: 0.9},
  {src: A + 'sting.mp3', from: EVENTS.painting.land, volume: 0.6},
  {src: A + 'creak.mp3', from: EVENTS.door.open - 4, volume: 0.8},
  {src: A + 'sting.mp3', from: EVENTS.bats.from - 2, volume: 0.65},
  {src: A + 'bats.mp3', from: EVENTS.bats.from, volume: 0.8},
  {src: A + 'bats.mp3', from: EVENTS.bats.finale, volume: 0.9},
  {src: A + 'zip.mp3', from: 904, volume: 0.6},
  {src: A + 'zip.mp3', from: 908, volume: 0.45},
];
// BGM ducks under each scare and is cut by the fade-out
const BGM_VOLUME: [number, number][] = [
  [0, 0], [12, 0.5], [258, 0.5], [264, 0.18], [320, 0.18], [345, 0.5],
  [540, 0.5], [548, 0.15], [600, 0.15], [640, 0.5], [820, 0.5], [846, 0.2], [878, 0.2], [884, 0.55],
  [EVENTS.fadeOut[0], 0.55], [VIDEO.durationInFrames, 0],
];
const STEPS = [
  ...landingFrames('senior').map((f) => ({f, rate: 1, vol: 0.4})),
  ...landingFrames('junior').map((f) => ({f, rate: 1.5, vol: 0.28})),
];

export const MansionSoundtrack: React.FC = () => (
  <>
    <Audio src={staticFile(A + 'bgm.mp3')} volume={(f) => sampleKeys(BGM_VOLUME, f)} />
    {SFX.map((s, i) => (
      <Sequence key={i} from={s.from} layout="none">
        <Audio src={staticFile(s.src)} volume={s.volume} />
      </Sequence>
    ))}
    {STEPS.map((s, i) => (
      <Sequence key={`step-${i}`} from={s.f} durationInFrames={10} layout="none">
        <Audio src={staticFile('assets/audio/footsteps.mp3')} volume={s.vol} playbackRate={s.rate} />
      </Sequence>
    ))}
  </>
);
