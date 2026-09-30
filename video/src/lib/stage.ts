// Types shared by every story: stages are lists of depth layers (Placements).

/** [frame, value] pairs, smoothly interpolated (clamped at the ends). */
export type Keyframes = [number, number][];

export type Placement = {
  src: string;
  speed: number;
  y: number;
  z: number;
  scale?: number;
  tile?: boolean;
  /**
   * Pin the layer's left edge to screen x at a frame. With `anchor` (or the
   * legacy `girl: true`), x is relative to that actor's screen x at the frame.
   */
  at?: {frame: number; x: number; girl?: boolean; anchor?: string};
  opacity?: number;
  shadow?: 'none' | 'soft' | 'mid' | 'deep';
  flip?: boolean;
  /** optional swing (deg) around the top centre, used for the door bell */
  swing?: {frame: number; amplitude: number};
  /** brightness multiplier (e.g. to darken foreground props in a dark room) */
  brightness?: number;
  /** name used by a story's animate() hook (falling bottle, opening door...) */
  id?: string;
  /** light source on this prop (candle, lamp): offset in image px, radius in screen px */
  glow?: {dx: number; dy: number; r: number; strength?: number};
};

/** Per-frame override for an animated prop (applied on top of its placement). */
export type LayerAnim = {
  dx?: number;
  dy?: number;
  rotate?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  /** CSS transform-origin inside the image, e.g. '50% 100%' */
  origin?: string;
  hidden?: boolean;
};
