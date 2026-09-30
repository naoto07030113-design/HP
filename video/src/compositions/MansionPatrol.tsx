import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {BatSwarm} from '../components/BatSwarm';
import {DarkRoom, type Light} from '../components/DarkRoom';
import {Emote} from '../components/Emote';
import {dollMotion, PaperDoll} from '../components/PaperDoll';
import {PaperStage, placementLeft} from '../components/PaperStage';
import {MansionSoundtrack} from '../components/MansionSoundtrack';
import {ACTORS, CAMERA, DARKNESS, EVENTS, GROUND_Y, POLICE, STAGE, WINDOW_GLOWS, type ActorId} from '../data/mansion/story';
import {actorDistance, actorLook, actorScreenX, cameraX} from '../data/mansion/timeline';
import {sampleKeys} from '../lib/motion';
import type {LayerAnim} from '../lib/stage';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

// ---------------------------------------------------------------- prop animation
const animate = (id: string, f: number): LayerAnim | null => {
  if (id === 'bottle') {
    const b = EVENTS.bottle;
    if (f < b.wobble) return null;
    if (f < b.fall) {
      const t = (f - b.wobble) / (b.fall - b.wobble);
      return {rotate: Math.sin((f - b.wobble) * 0.9) * 9 * t, origin: '50% 100%'};
    }
    if (f < b.land) {
      const t = (f - b.fall) / (b.land - b.fall);
      return {rotate: -95 * t, dx: -40 * t, dy: 165 * t * t, origin: '50% 100%'};
    }
    const t = clamp01((f - b.land) / (b.rollEnd - b.land));
    const bounce = f - b.land < 8 ? -16 * Math.sin(((f - b.land) / 8) * Math.PI) : 0;
    return {rotate: -95 - 540 * easeOut(t), dx: -40 - 250 * easeOut(t), dy: 165 + bounce, origin: '50% 100%'};
  }
  if (id === 'painting') {
    const p = EVENTS.painting;
    if (f < p.wobble) return null;
    if (f < p.fall) {
      const t = (f - p.wobble) / (p.fall - p.wobble);
      return {rotate: Math.sin((f - p.wobble) * 0.5) * 7 * t, dy: t > 0.7 ? 6 : 0, origin: '50% 0%'};
    }
    if (f < p.land) {
      const t = (f - p.fall) / (p.land - p.fall);
      return {rotate: -10 * t, dy: 480 * t * t, origin: '50% 0%'};
    }
    const bounce = f - p.land < 9 ? -18 * Math.sin(((f - p.land) / 9) * Math.PI) : 0;
    return {rotate: -10, dy: 480 + bounce, origin: '50% 0%'};
  }
  if (id === 'leafL' || id === 'leafR') {
    const d = EVENTS.door;
    const t = clamp01((f - d.open) / (d.opened - d.open));
    const creak = t + 0.05 * Math.sin(t * 22) * (1 - t); // opens in little creaky jerks
    return {scaleX: 1 - 0.86 * clamp01(creak), origin: id === 'leafL' ? '0% 50%' : '100% 50%'};
  }
  return null;
};

// ---------------------------------------------------------------- composition
export const MansionPatrol: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = cameraX(frame);
  const zoom = sampleKeys(CAMERA.zoom, frame);
  const amp = sampleKeys(CAMERA.shake, frame);
  const shakeX = amp * (random(`sx${frame}`) - 0.5) * 2;
  const shakeY = amp * (random(`sy${frame}`) - 0.5) * 2;
  const anchorX = (a: string, f: number) => actorScreenX(a as ActorId, f);

  // lightning
  let flash = 0;
  for (const [a, b] of EVENTS.lightning) if (frame >= a && frame <= b) flash = Math.max(flash, 1 - Math.abs(frame - (a + b) / 2) / ((b - a) / 2 + 1));

  // ---- characters
  const lights: Light[] = [];
  const dolls: React.ReactNode[] = [];
  const emotes: React.ReactNode[] = [];
  (['junior', 'senior'] as ActorId[]).forEach((id, i) => {
    const a = ACTORS[id];
    const look = actorLook(id, frame);
    const x = actorScreenX(id, frame);
    const motion = dollMotion({
      frame: frame + i * 7,
      walking: look.walking,
      distance: actorDistance(id, frame),
      hopDistance: a.hopDistance,
      hopHeight: a.hopHeight,
      hop: look.hop,
      tremble: look.tremble,
    });
    const dir = look.facing === 'left' ? -1 : 1;
    dolls.push(
      <PaperDoll
        key={id}
        src={`assets/police/${look.pose}.png`}
        x={x}
        y={GROUND_Y}
        scale={a.scale}
        canvas={POLICE.canvas}
        anchor={POLICE.anchor}
        headTopY={150}
        motion={motion}
        flip={look.flip}
        direction={dir}
        zIndex={id === 'senior' ? 211 : 210}
        brightness={0.92}
        shadowColor="rgba(10,6,20,0.45)"
      />,
    );
    // faint glow around each officer so they stay readable in the dark
    lights.push({kind: 'glow', x: x + motion.shakeX, y: GROUND_Y - 220 * a.scale - motion.lift, r: 380 * a.scale, strength: 0.6});
    // flashlight beam from the lens of the current pose
    const beam = POLICE.beams[look.pose];
    const facing = Math.cos(((look.flip + motion.flutter) * Math.PI) / 180);
    if (beam && Math.abs(facing) > 0.35) {
      const bx = x + motion.shakeX + (beam.x - POLICE.anchor.x) * a.scale * dir * Math.abs(facing);
      const by = GROUND_Y - (POLICE.anchor.y - beam.y) * a.scale - motion.lift;
      const jitter = Math.sin(frame * 1.7 + i) * a.beam.jitter + Math.sin(frame / 13 + i) * 3;
      const angle = dir === 1 ? beam.angle + jitter : 180 - beam.angle - jitter;
      lights.push({kind: 'cone', x: bx, y: by, angle, spread: a.beam.spread, length: a.beam.length, strength: 0.95});
    }
    for (const e of a.emotes) {
      emotes.push(
        <Emote
          key={`${id}-${e.frame}`}
          type={e.type}
          from={e.frame}
          duration={e.duration}
          x={x + 60 * dir}
          y={GROUND_Y - (POLICE.anchor.y - 120) * a.scale - motion.lift}
          zIndex={400}
        />,
      );
    }
  });

  // ---- candles, chandelier, moonlit windows
  for (const p of STAGE) {
    if (!p.glow) continue;
    const left = placementLeft(p, cam, cameraX, anchorX);
    const s = p.scale ?? 1;
    const flicker = 0.9 + 0.1 * Math.sin(frame / 3 + left);
    lights.push({kind: 'glow', x: left + p.glow.dx * s, y: p.y + p.glow.dy * s, r: p.glow.r * flicker, strength: p.glow.strength});
  }
  const wallOffset = -cam * 0.7;
  for (let n = -1; n <= 2; n++)
    for (const wx of WINDOW_GLOWS.xs) {
      const x = wx + n * WINDOW_GLOWS.tile + (((wallOffset % WINDOW_GLOWS.tile) + WINDOW_GLOWS.tile) % WINDOW_GLOWS.tile) - WINDOW_GLOWS.tile;
      if (x > -400 && x < 2300) lights.push({kind: 'glow', x, y: WINDOW_GLOWS.y, r: WINDOW_GLOWS.r, strength: WINDOW_GLOWS.strength});
    }

  // ---- door: eyes in the dark, then bats
  const door = STAGE.find((p) => p.id === 'doorFrame')!;
  const doorLeft = placementLeft(door, cam, cameraX, anchorX);
  const doorway = {x: doorLeft + 260, y: door.y + 470};
  const eyesOn = frame >= EVENTS.door.eyes && frame < EVENTS.bats.from + 4;

  const darkness = DARKNESS * (1 - 0.85 * flash);
  const fade = interpolate(frame, EVENTS.fadeOut, [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeIn = interpolate(frame, [0, 8], [1, 0], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: '#0b0a1d', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${shakeX}px, ${shakeY}px) scale(${zoom})`, transformOrigin: '50% 62%'}}>
        <PaperStage placements={STAGE} cameraX={cam} frame={frame} cameraXAt={cameraX} anchorXAt={anchorX} animate={animate} />
        {eyesOn &&
          [[-70, -40], [40, -90], [90, 10], [-20, 60], [-110, 40], [120, -60]].map(([dx, dy], i) => {
            const on = frame >= EVENTS.door.eyes + i * 4;
            const blink = Math.sin(frame / 5 + i * 2) > -0.9 ? 1 : 0.1;
            return on ? (
              <div key={i} style={{position: 'absolute', left: doorway.x + dx, top: doorway.y + dy, zIndex: 205, display: 'flex', gap: 10}}>
                {[0, 1].map((k) => (
                  <div key={k} style={{width: 16, height: 11 * blink, borderRadius: '50%', background: '#ffe36b', boxShadow: '0 0 12px #ffcf3d'}} />
                ))}
              </div>
            ) : null;
          })}
        {dolls}
        <DarkRoom lights={lights} darkness={darkness} zIndex={200} />
        {emotes}
        <BatSwarm from={EVENTS.bats.from} origin={doorway} count={40} spawnFrames={80} finale={{from: EVENTS.bats.finale, count: 26}} zIndex={390} />
      </AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: '#e8ecff', opacity: flash * 0.35, mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{backgroundColor: '#05040c', opacity: Math.max(fade, fadeIn)}} />
      <MansionSoundtrack />
    </AbsoluteFill>
  );
};

