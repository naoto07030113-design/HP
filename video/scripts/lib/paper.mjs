// Papercraft SVG toolkit.
// Every asset in this project is built from "paper pieces": a flat shape with
// a darker offset copy underneath (the visible thickness of the cut card),
// a clean outline, a soft contact shadow and a shared paper-grain texture.
import {Resvg} from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';

// ---------- colour ----------
const clamp = (v, a = 0, b = 255) => Math.max(a, Math.min(b, v));
const hexToRgb = (h) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const rgbToHex = (r) => '#' + r.map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('');
/** k < 1 darkens, k > 1 mixes toward white. */
export const shade = (hex, k) => {
  const c = hexToRgb(hex);
  if (k <= 1) return rgbToHex(c.map((v) => v * k));
  const t = k - 1;
  return rgbToHex(c.map((v) => v + (255 - v) * t));
};
export const mix = (a, b, t) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.map((v, i) => v + (cb[i] - v) * t));
};

// ---------- deterministic random ----------
export const rng = (seed = 1) => {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
};

// ---------- geometry -> path data ----------
const f = (n) => Math.round(n * 100) / 100;
export const circ = (cx, cy, r) => ell(cx, cy, r, r);
export const ell = (cx, cy, rx, ry) =>
  `M${f(cx - rx)},${f(cy)}A${f(rx)},${f(ry)} 0 1,0 ${f(cx + rx)},${f(cy)}A${f(rx)},${f(ry)} 0 1,0 ${f(cx - rx)},${f(cy)}Z`;
export const rrect = (x, y, w, h, r = 0) => {
  r = Math.min(r, w / 2, h / 2);
  return `M${f(x + r)},${f(y)}H${f(x + w - r)}Q${f(x + w)},${f(y)} ${f(x + w)},${f(y + r)}V${f(y + h - r)}Q${f(x + w)},${f(y + h)} ${f(x + w - r)},${f(y + h)}H${f(x + r)}Q${f(x)},${f(y + h)} ${f(x)},${f(y + h - r)}V${f(y + r)}Q${f(x)},${f(y)} ${f(x + r)},${f(y)}Z`;
};
export const poly = (pts) => 'M' + pts.map((p) => `${f(p[0])},${f(p[1])}`).join('L') + 'Z';
export const line = (pts) => 'M' + pts.map((p) => `${f(p[0])},${f(p[1])}`).join('L');

/** Catmull-Rom spline through points, converted to cubic beziers. */
export const smooth = (pts, closed = true, tension = 0.5) => {
  const n = pts.length;
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const t = tension / 3 * 2;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t / 2, p1[1] + (p2[1] - p0[1]) * t / 2];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t / 2, p2[1] - (p3[1] - p1[1]) * t / 2];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
};

/** Organic rounded blob (clouds, foliage, blossom puffs). */
export const blob = (cx, cy, rx, ry, n = 9, jitter = 0.12, seed = 1) => {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 2 * jitter;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return smooth(pts, true);
};

/** Scalloped cloud/bush outline: bumps along an ellipse. */
export const scallop = (cx, cy, rx, ry, bumps = 10, depth = 0.18, seed = 3) => {
  const r = rng(seed);
  let d = '';
  const pts = [];
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  for (let i = 0; i < bumps; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % bumps];
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    const ox = mx - cx, oy = my - cy;
    const len = Math.hypot(ox, oy) || 1;
    const k = (depth + r() * depth * 0.6) * Math.min(rx, ry);
    const c = [mx + (ox / len) * k * 2.1, my + (oy / len) * k * 2.1];
    if (i === 0) d += `M${f(p[0])},${f(p[1])}`;
    d += `Q${f(c[0])},${f(c[1])} ${f(q[0])},${f(q[1])}`;
  }
  return d + 'Z';
};

/** Tapered capsule between two points (limbs, trunks, branches). */
export const capsule = (p0, p1, w0, w1 = w0) => {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const r0 = w0 / 2, r1 = w1 / 2;
  const a = [p0[0] + nx * r0, p0[1] + ny * r0];
  const b = [p1[0] + nx * r1, p1[1] + ny * r1];
  const c = [p1[0] - nx * r1, p1[1] - ny * r1];
  const e = [p0[0] - nx * r0, p0[1] - ny * r0];
  return `M${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}A${f(r1)},${f(r1)} 0 0,0 ${f(c[0])},${f(c[1])}L${f(e[0])},${f(e[1])}A${f(r0)},${f(r0)} 0 0,0 ${f(a[0])},${f(a[1])}Z`;
};

// ---------- paper pieces ----------
let uid = 0;
/**
 * One cut-paper piece.
 * edge: thickness of the visible card edge (px), shadow: soft contact shadow.
 */
export const piece = (d, fill, o = {}) => {
  const {
    edge = 3,
    stroke = shade(fill, 0.78),
    sw = 1.6,
    shadow = true,
    opacity = 1,
    transform = '',
  } = o;
  const tr = transform ? ` transform="${transform}"` : '';
  const flt = shadow === 'big' ? ' filter="url(#psBig)"' : shadow ? ' filter="url(#ps)"' : '';
  const edgeEl = edge
    ? `<path d="${d}" fill="${shade(fill, 0.7)}" transform="translate(${edge * 0.45},${edge})"/>`
    : '';
  const strokeAttr = stroke ? ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"` : '';
  return `<g${tr}${flt}${opacity < 1 ? ` opacity="${opacity}"` : ''}>${edgeEl}<path d="${d}" fill="${fill}"${strokeAttr}/></g>`;
};

/** Thin decorative stroke drawn on top of paper (seams, folds, facial lines). */
export const ink = (d, color, w = 2.5, o = {}) =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o.opacity ? ` opacity="${o.opacity}"` : ''}/>`;

export const g = (content, transform = '', extra = '') =>
  `<g${transform ? ` transform="${transform}"` : ''}${extra ? ' ' + extra : ''}>${content}</g>`;

export const clipped = (clipD, content) => {
  const id = `cp${uid++}`;
  return `<clipPath id="${id}"><path d="${clipD}"/></clipPath><g clip-path="url(#${id})">${content}</g>`;
};

// ---------- document ----------
const defs = (W, H, grain) => `
<defs>
  <filter id="ps" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="2" dy="3" stdDeviation="2.2" flood-color="#3a2a1e" flood-opacity="0.2"/>
  </filter>
  <filter id="diecut" x="-10%" y="-10%" width="120%" height="120%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="11" result="d2"/>
    <feFlood flood-color="#cfc6b6"/><feComposite in2="d2" operator="in" result="rim"/>
    <feOffset in="rim" dx="1.5" dy="4" result="rimOff"/>
    <feMorphology in="SourceAlpha" operator="dilate" radius="10" result="d1"/>
    <feFlood flood-color="#fffdf8"/><feComposite in2="d1" operator="in" result="white"/>
    <feMerge><feMergeNode in="rimOff"/><feMergeNode in="white"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="psBig" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="4" dy="6" stdDeviation="5" flood-color="#3a2a1e" flood-opacity="0.2"/>
  </filter>
  <filter id="grain" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
    <feTurbulence type="fractalNoise" baseFrequency="${grain.fine}" numOctaves="2" seed="11" result="n1"/>
    <feColorMatrix in="n1" type="matrix" values="0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.1  0.55 0 0 0 -0.2" result="fine"/>
    <feComposite in="fine" in2="SourceAlpha" operator="in" result="fineM"/>
    <feTurbulence type="fractalNoise" baseFrequency="${grain.coarse}" numOctaves="3" seed="4" result="n2"/>
    <feColorMatrix in="n2" type="matrix" values="0 0 0 0 1  0 0 0 0 0.98  0 0 0 0 0.94  0 0.28 0 0 -0.1" result="mottle"/>
    <feComposite in="mottle" in2="SourceAlpha" operator="in" result="mottleM"/>
    <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="mottleM"/><feMergeNode in="fineM"/></feMerge>
  </filter>
</defs>`;

export const doc = (W, H, content, o = {}) => {
  const grain = {fine: 0.85, coarse: 0.012, ...(o.grain || {})};
  const bg = o.background ? `<rect width="${W}" height="${H}" fill="${o.background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs(W, H, grain)}<g filter="url(#grain)">${bg}${content}</g></svg>`;
};

export const renderPng = (svg, outPath, o = {}) => {
  const resvg = new Resvg(svg, {
    fitTo: o.width ? {mode: 'width', value: o.width} : {mode: 'original'},
    font: {loadSystemFonts: false},
  });
  const png = resvg.render().asPng();
  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, png);
  return png.length;
};
