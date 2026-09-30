import React from 'react';
import {Img, random, staticFile, useCurrentFrame} from 'remotion';

/**
 * Makes the frame read as a photographed miniature: moving film grain,
 * a lens vignette and a gentle colour grade (cool shadows, warm light).
 */
export const FilmLook: React.FC<{grain?: number; vignette?: number; zIndex?: number}> = ({grain = 0.22, vignette = 0.55, zIndex = 500}) => {
  const frame = useCurrentFrame();
  const ox = Math.floor(random(`gx${frame}`) * 512);
  const oy = Math.floor(random(`gy${frame}`) * 512);
  const tiles: React.ReactNode[] = [];
  for (let x = -ox; x < 1920; x += 512)
    for (let y = -oy; y < 1080; y += 512)
      tiles.push(<Img key={`${x},${y}`} src={staticFile('assets/fx/film_grain.png')} style={{position: 'absolute', left: x, top: y, width: 512, height: 512}} />);
  return (
    <div style={{position: 'absolute', inset: 0, zIndex, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(40,60,110,0.10), rgba(90,50,20,0.06))', mixBlendMode: 'soft-light'}} />
      <div style={{position: 'absolute', inset: 0, opacity: grain, mixBlendMode: 'overlay'}}>{tiles}</div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 75% 70% at 50% 52%, rgba(0,0,0,0) 55%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
    </div>
  );
};
