import React from 'react';
import {Composition} from 'remotion';
import {BakeryWalk} from './compositions/BakeryWalk';
import {VIDEO} from './data/scenes';

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
    </>
  );
};
