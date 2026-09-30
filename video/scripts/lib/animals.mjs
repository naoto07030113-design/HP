// Chibi animal police officers as die-cut paper dolls (Paper-Mario style).
// Senior: a shiba dog (scared but dependable). Junior: a rabbit (jumpy).
// Every pose is one flat sprite; the animation comes from the sheet moving.
import {piece, ink, g, shade, smooth, capsule, ell, circ, rrect, poly} from './paper.mjs';

export const ADIM = {W: 560, H: 760, ground: 730, hipX: 250};
const HIP_Y = ADIM.ground - 104; // legs + shoes

const C = {
  navy: '#34497d',
  navyDark: '#22335c',
  navyLight: '#4a62a0',
  band: '#1c2238',
  visor: '#1a1d2b',
  gold: '#f2c85e',
  belt: '#3d2b20',
  shoe: '#23222a',
  torch: '#4b515e',
  metal: '#a3acb8',
  lens: '#fff3b0',
  shiba: '#e3a05c',
  shibaDark: '#c9803f',
  cream: '#fcefdc',
  bunny: '#f6f3ef',
  bunnyShade: '#e4ddd6',
  pinkIn: '#f5bccb',
  eye: '#2a1d1a',
  blush: '#f5a1a8',
  mouth: '#b04a48',
  nose: '#2a1d1a',
  noseBunny: '#f08aa0',
  tear: '#9fd3f5',
};

const rad = (d) => (d * Math.PI) / 180;
const fk = (p, len, deg) => [p[0] + Math.sin(rad(deg)) * len, p[1] + Math.cos(rad(deg)) * len];

// ---------------------------------------------------------------- pieces
const legs = (stance, dim = 1) => {
  // stance: 'stand' | 'run' | 'tiptoe' | 'wide'
  const spread = {stand: [-6, 6], run: [-26, 30], tiptoe: [-3, 3], wide: [-14, 16]}[stance] || [-6, 6];
  let s = '';
  spread.forEach((ang, i) => {
    const hip = [ADIM.hipX + (i ? 16 : -16), HIP_Y + 10];
    const foot = fk(hip, 82, ang);
    const d = i ? 1 : 0.9 * dim;
    s += piece(capsule(hip, foot, 42, 36), shade(C.navyDark, d), {edge: 2});
    const lift = stance === 'tiptoe' ? -6 : 0;
    s += piece(ell(foot[0] + 12, foot[1] + 12 + lift, 30, 15), shade(C.shoe, d === 1 ? 1 : 1.25), {edge: 2, stroke: '#101014'});
  });
  return s;
};

const torso = () => {
  const x = ADIM.hipX, y = HIP_Y;
  let s = '';
  const body = smooth([[x - 56, y + 16], [x - 64, y - 60], [x - 50, y - 128], [x, y - 146], [x + 52, y - 128], [x + 64, y - 60], [x + 58, y + 16], [x, y + 24]]);
  s += piece(body, C.navy, {edge: 4, stroke: C.navyDark, shadow: 'big'});
  // collar + tie
  s += piece(poly([[x - 26, y - 140], [x + 6, y - 110], [x + 30, y - 140], [x + 6, y - 150]]), '#dfe6f2', {edge: 1});
  s += piece(poly([[x + 2, y - 118], [x + 12, y - 118], [x + 16, y - 80], [x + 7, y - 70], [x - 2, y - 80]]), '#1f2a48', {edge: 1});
  // badge + buttons
  const star = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 7 : 16, a = -Math.PI / 2 + (k * Math.PI) / 5;
    star.push([x + 34 + Math.cos(a) * r, y - 92 + Math.sin(a) * r]);
  }
  s += piece(poly(star), C.gold, {edge: 2, stroke: '#c79a33'});
  for (const by of [-60, -30]) s += piece(circ(x + 8, y + by, 5), C.gold, {edge: 1, shadow: false});
  // belt
  s += piece(rrect(x - 62, y - 8, 124, 20, 8), C.belt, {edge: 2});
  s += piece(rrect(x - 2, y - 11, 26, 26, 5), C.gold, {edge: 1, stroke: '#c79a33'});
  s += piece(rrect(x + 3, y - 5, 16, 14, 3), C.belt, {edge: 0, shadow: false, stroke: false});
  return s;
};

const SHOULDER_BACK = [ADIM.hipX - 34, HIP_Y - 118];
const SHOULDER_FRONT = [ADIM.hipX + 30, HIP_Y - 116];

const arm = (shoulder, a, fur, dim = 1) => {
  const elbow = fk(shoulder, 50, a.upper);
  const paw = fk(elbow, 48, a.fore);
  let s = '';
  s += piece(capsule(shoulder, elbow, 36, 32), shade(C.navy, dim), {edge: 2});
  s += piece(capsule(elbow, paw, 32, 30), shade(C.navy, dim), {edge: 2});
  s += piece(circ(paw[0], paw[1], 19), shade(fur, dim), {edge: 2});
  return {svg: s, paw};
};

/** Flashlight held in a paw. angle: 0 = pointing right, +down. Returns the lens (beam origin). */
const flashlight = (paw, angle) => {
  const tr = `translate(${paw[0]},${paw[1]}) rotate(${angle})`;
  let s = '';
  s += piece(rrect(-22, -11, 62, 22, 8), C.torch, {edge: 2, stroke: '#2e323b'});
  s += piece(poly([[36, -14], [60, -22], [60, 22], [36, 14]]), C.metal, {edge: 2, stroke: '#7d8794'});
  s += piece(ell(61, 0, 6, 21), C.lens, {edge: 0, shadow: false, stroke: '#e0cf7c'});
  s += piece(rrect(0, -13, 10, 26, 3), '#353a45', {edge: 1, shadow: false});
  const a = rad(angle);
  const lens = [paw[0] + Math.cos(a) * 64, paw[1] + Math.sin(a) * 64];
  return {svg: g(s, tr), lens};
};

// ---------------------------------------------------------------- caps
const cap = (cx, cy, w, tilt = 0) => {
  let s = '';
  s += piece(`M${cx - w * 0.5},${cy}Q${cx - w * 0.55},${cy - w * 0.42} ${cx - w * 0.05},${cy - w * 0.5}Q${cx + w * 0.55},${cy - w * 0.5} ${cx + w * 0.55},${cy - w * 0.08}L${cx + w * 0.5},${cy}Z`, C.navy, {edge: 3, stroke: C.navyDark});
  s += piece(rrect(cx - w * 0.52, cy - w * 0.12, w * 1.04, w * 0.16, 6), C.band, {edge: 2});
  s += piece(`M${cx + w * 0.1},${cy + w * 0.03}Q${cx + w * 0.6},${cy} ${cx + w * 0.72},${cy + w * 0.12}Q${cx + w * 0.4},${cy + w * 0.14} ${cx + w * 0.1},${cy + w * 0.08}Z`, C.visor, {edge: 2});
  s += piece(circ(cx + w * 0.16, cy - w * 0.2, w * 0.08), C.gold, {edge: 1, stroke: '#c79a33'});
  return g(s, `rotate(${tilt},${cx},${cy})`);
};

// ---------------------------------------------------------------- eyes / mouths
const eyes = (pts, face, o = {}) => {
  let s = '';
  for (const [x, y, k] of pts) {
    if (face === 'shock') {
      s += piece(ell(x, y, 15 * k, 18), '#ffffff', {edge: 0, shadow: false, stroke: C.eye, sw: 3});
      s += `<circle cx="${x + 2}" cy="${y}" r="${4.5 * k}" fill="${C.eye}"/>`;
    } else if (face === 'squeeze') {
      s += ink(`M${x - 11 * k},${y - 8}L${x + 9 * k},${y}L${x - 11 * k},${y + 8}`, C.eye, 4.5);
    } else if (face === 'teary') {
      s += `<ellipse cx="${x}" cy="${y}" rx="${12 * k}" ry="15" fill="${C.eye}"/>`;
      s += `<ellipse cx="${x}" cy="${y + 7}" rx="${10 * k}" ry="6" fill="${C.tear}" opacity="0.85"/>`;
      s += `<circle cx="${x + 3}" cy="${y - 6}" r="${4.5}" fill="#fff"/><circle cx="${x - 4}" cy="${y + 4}" r="2.2" fill="#fff"/>`;
    } else if (face === 'brave') {
      s += `<ellipse cx="${x}" cy="${y + 2}" rx="${9 * k}" ry="10" fill="${C.eye}"/>`;
      s += `<circle cx="${x + 2.5}" cy="${y - 1}" r="3" fill="#fff"/>`;
      s += ink(`M${x - 13 * k},${y - 10}L${x + 12 * k},${y - 5}`, C.eye, 4); // determined lid
    } else {
      s += `<ellipse cx="${x}" cy="${y}" rx="${o.big ? 11 * k : 9 * k}" ry="${o.big ? 14 : 12}" fill="${C.eye}"/>`;
      s += `<circle cx="${x + 3}" cy="${y - 5}" r="${o.big ? 4.2 : 3.4}" fill="#fff"/><circle cx="${x - 3}" cy="${y + 5}" r="1.8" fill="#fff"/>`;
    }
  }
  return s;
};

// ---------------------------------------------------------------- heads
// Both heads are drawn around (0,0) and facing right (3/4 view).
const shibaHead = (face) => {
  let s = '';
  const earUp = face === 'shock' ? -14 : 0;
  // ears (behind)
  // triangular shiba ears sticking out on both sides of the cap
  s += piece(smooth([[-96, -18], [-136, -96 + earUp], [-60, -66]]), C.shiba, {edge: 3, stroke: C.shibaDark});
  s += piece(smooth([[-94, -34], [-122, -84 + earUp], [-74, -64]]), C.cream, {edge: 0, shadow: false, stroke: false});
  s += piece(smooth([[70, -70], [132, -106 + earUp], [106, -22]]), C.shiba, {edge: 3, stroke: C.shibaDark});
  s += piece(smooth([[82, -64], [120, -92 + earUp], [102, -40]]), C.cream, {edge: 0, shadow: false, stroke: false});
  // head
  s += piece(smooth([[-104, 0], [-90, -62], [-30, -96], [40, -92], [96, -56], [112, 4], [96, 58], [40, 86], [-30, 84], [-90, 52]]), C.shiba, {edge: 4, stroke: C.shibaDark, shadow: 'big'});
  // cream mask + muzzle
  s += piece(smooth([[-70, 30], [-30, 8], [20, 14], [70, 0], [128, 14], [132, 48], [90, 80], [20, 84], [-40, 74]]), C.cream, {edge: 1, shadow: false, stroke: false});
  s += piece(ell(98, 30, 44, 32), C.cream, {edge: 2, stroke: shade(C.cream, 0.9)});
  s += piece(ell(132, 16, 15, 11), C.nose, {edge: 1});
  s += `<ellipse cx="128" cy="12" rx="5" ry="3" fill="#fff" opacity="0.7"/>`;
  // shiba eyebrow dots
  s += piece(ell(-8, -36, 10, 7), C.cream, {edge: 0, shadow: false, stroke: false});
  s += piece(ell(58, -40, 9, 6), C.cream, {edge: 0, shadow: false, stroke: false});
  s += eyes([[-6, -8, 1], [58, -12, 0.85]], face === 'brave' ? 'brave' : face === 'shock' ? 'shock' : 'normal');
  // blush
  s += `<ellipse cx="-38" cy="30" rx="16" ry="9" fill="${C.blush}" opacity="0.5"/>`;
  // mouth
  if (face === 'shock') s += piece(ell(100, 60, 13, 16), C.mouth, {edge: 0, shadow: false, stroke: '#7d2e2e'});
  else if (face === 'brave') s += ink('M84,52Q100,64 116,50', C.eye, 3.5);
  else s += ink('M88,50Q98,58 106,50Q114,58 122,48', C.eye, 3); // wobbly nervous mouth
  s += cap(0, -64, 190, face === 'shock' ? -10 : -4);
  return s;
};

const bunnyHead = (face) => {
  let s = '';
  const straight = face === 'shock';
  const droop = face === 'squeeze' || face === 'teary';
  // long ears (behind the cap)
  const earL = straight ? [[-44, -60], [-54, -250], [-10, -250], [-12, -70]] : droop ? [[-50, -60], [-150, -170], [-122, -196], [-20, -76]] : [[-46, -60], [-80, -236], [-40, -246], [-14, -72]];
  const earR = straight ? [[18, -70], [22, -262], [62, -252], [50, -66]] : droop ? [[20, -74], [-60, -200], [-28, -214], [48, -70]] : [[18, -70], [48, -250], [86, -232], [50, -64]];
  for (const e of [earL, earR]) {
    s += piece(smooth(e), C.bunny, {edge: 3, stroke: C.bunnyShade});
    const c = e.map((p, i) => [p[0] + (i === 0 || i === 3 ? (i === 0 ? 10 : -10) : 0), p[1] + (i === 1 || i === 2 ? 22 : 0)]);
    s += piece(smooth([[(c[0][0] * 3 + c[3][0]) / 4, c[0][1] - 10], [(c[1][0] * 3 + c[2][0]) / 4, c[1][1]], [(c[1][0] + c[2][0] * 3) / 4, c[2][1]], [(c[0][0] + c[3][0] * 3) / 4, c[3][1] - 10]]), C.pinkIn, {edge: 0, shadow: false, stroke: false});
  }
  // head
  s += piece(smooth([[-98, 4], [-84, -56], [-26, -88], [38, -86], [92, -50], [106, 8], [90, 58], [36, 84], [-30, 82], [-86, 52]]), C.bunny, {edge: 4, stroke: C.bunnyShade, shadow: 'big'});
  // cheeks
  s += piece(ell(84, 34, 36, 26), '#fffdfb', {edge: 1, stroke: C.bunnyShade});
  s += piece(poly([[112, 18], [124, 14], [118, 26]]), C.noseBunny, {edge: 1});
  s += `<ellipse cx="-30" cy="32" rx="18" ry="10" fill="${C.blush}" opacity="0.65"/><ellipse cx="54" cy="32" rx="12" ry="8" fill="${C.blush}" opacity="0.55"/>`;
  const eyeFace = face === 'shock' ? 'shock' : face === 'squeeze' ? 'squeeze' : face === 'teary' ? 'teary' : 'normal';
  s += eyes([[-10, -8, 1], [52, -12, 0.85]], eyeFace, {big: true});
  // worried brows
  if (face !== 'shock') s += ink('M-26,-38L4,-30M40,-36L64,-42', C.eye, 3, {opacity: 0.6});
  // mouth
  if (face === 'shock') {
    s += piece(ell(98, 58, 14, 17), C.mouth, {edge: 0, shadow: false, stroke: '#7d2e2e'});
    s += piece(rrect(90, 42, 16, 11, 2), '#ffffff', {edge: 0, shadow: false, stroke: '#ccc'});
  } else s += ink('M88,52Q96,46 104,54Q112,46 120,52', C.eye, 3); // trembling mouth
  s += cap(-4, -62, 176, straight ? -12 : droop ? 8 : -2);
  return s;
};

// ---------------------------------------------------------------- tails
const tail = (kind) => {
  const x = ADIM.hipX - 60, y = HIP_Y - 30;
  if (kind === 'shiba') {
    return piece(`M${x + 4},${y + 14}C${x - 50},${y + 10} ${x - 58},${y - 50} ${x - 20},${y - 56}C${x + 6},${y - 58} ${x + 6},${y - 30} ${x - 12},${y - 28}C${x - 26},${y - 26} ${x - 22},${y - 6} ${x + 8},${y - 6}Z`, C.shiba, {edge: 3, stroke: C.shibaDark}) +
      piece(circ(x - 20, y - 40, 11), C.cream, {edge: 0, shadow: false, stroke: false});
  }
  return piece(`M${x - 18},${y + 10}` + smooth([[x - 12, y - 10], [x - 34, y - 26], [x - 50, y - 6], [x - 44, y + 18], [x - 20, y + 20]]).slice(1), C.bunny, {edge: 2, stroke: C.bunnyShade});
};

// ---------------------------------------------------------------- full doll
/**
 * pose = {species, face, stance, back:{upper,fore}, front:{upper,fore}, light (deg|null), lightHand:'front'|'back', headTilt, headDy}
 * Returns {svg, beam: {x, y, angle} | null}
 */
export const drawOfficer = (pose) => {
  const fur = pose.species === 'shiba' ? C.shiba : C.bunny;
  let s = '';
  let beam = null;
  const back = arm(SHOULDER_BACK, pose.back, fur, 0.9);
  // flashlight in the back paw goes behind the body
  if (pose.light != null && pose.lightHand === 'back') {
    const f = flashlight(back.paw, pose.light);
    s += f.svg;
    beam = {x: f.lens[0], y: f.lens[1], angle: pose.light};
  }
  s += back.svg;
  s += tail(pose.species);
  s += legs(pose.stance || 'stand');
  s += torso();
  const headC = [ADIM.hipX + 12, HIP_Y - 150 - 78 + (pose.headDy || 0)];
  const head = pose.species === 'shiba' ? shibaHead(pose.face) : bunnyHead(pose.face);
  s += g(head, `translate(${headC[0]},${headC[1] - 12}) rotate(${pose.headTilt || 0},0,60) scale(1.15)`);
  const front = arm(SHOULDER_FRONT, pose.front, fur, 1);
  if (pose.light != null && pose.lightHand !== 'back') {
    const f = flashlight(front.paw, pose.light);
    s += f.svg;
    beam = {x: f.lens[0], y: f.lens[1], angle: pose.light};
  }
  s += front.svg;
  return {svg: `<g filter="url(#diecut)">${s}</g>`, beam};
};

export const OFFICER_POSES = {
  // --- senior: shiba ---
  senior_walk: {species: 'shiba', face: 'normal', stance: 'stand', back: {upper: -10, fore: 10}, front: {upper: 40, fore: 80}, light: 4},
  senior_alert: {species: 'shiba', face: 'shock', stance: 'wide', back: {upper: -130, fore: -160}, front: {upper: 105, fore: 150}, light: -50, headDy: -8},
  senior_brave: {species: 'shiba', face: 'brave', stance: 'wide', back: {upper: -70, fore: -95}, front: {upper: 60, fore: 90}, light: 16},
  senior_flee: {species: 'shiba', face: 'shock', stance: 'run', back: {upper: -120, fore: -150}, front: {upper: 100, fore: 140}, light: -30, headDy: -6},
  // --- junior: rabbit ---
  junior_walk: {species: 'bunny', face: 'teary', stance: 'tiptoe', back: {upper: 20, fore: 100}, front: {upper: 30, fore: 110}, light: 12},
  junior_shock: {species: 'bunny', face: 'shock', stance: 'wide', back: {upper: -135, fore: -165}, front: {upper: 105, fore: 155}, light: -70, headDy: -10},
  junior_cling: {species: 'bunny', face: 'squeeze', stance: 'tiptoe', back: {upper: 70, fore: 100}, front: {upper: 80, fore: 110}, light: null, headTilt: 8},
  junior_scared: {species: 'bunny', face: 'teary', stance: 'tiptoe', back: {upper: 30, fore: 130}, front: {upper: 40, fore: 140}, light: 30, headTilt: 5},
  junior_flee: {species: 'bunny', face: 'shock', stance: 'run', back: {upper: -140, fore: -160}, front: {upper: 100, fore: 145}, light: -40, headDy: -8},
};
