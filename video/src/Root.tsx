import React from 'react';
import {Composition} from 'remotion';
import {BakeryWalk} from './compositions/BakeryWalk';
import {MansionPatrol} from './compositions/MansionPatrol';
import {VIDEO} from './data/scenes';
import {VIDEO as MANSION_VIDEO} from './data/mansion/story';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BakeryWalk"
        component={BakeryWalk}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="MansionPatrol"
        component={MansionPatrol}
        durationInFrames={MANSION_VIDEO.durationInFrames}
        fps={MANSION_VIDEO.fps}
        width={MANSION_VIDEO.width}
        height={MANSION_VIDEO.height}
      />
    </>
  );
};
