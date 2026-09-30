// Animal police officers as layered paper-craft dolls, drawn with realistic
// proportions (~5 heads tall). Senior: a shiba dog. Junior: a wild-coloured
// rabbit. Each pose is one flat sprite; the animation comes from the sheet.
import {piece, ink, g, shade, smooth, capsule, ell, circ, rrect, poly, rng} from './paper.mjs';

export const ADIM = {W: 640, H: 1000, ground: 970, hipX: 300};

const C = {
  navy: '#2c3e68',
  navyShade: '#1f2d4f',
  navyLight: '#3d5286',
  shirt: '#cfdcea',
  tie: '#17213b',
  gold: '#d7b25a',
  goldDark: '#a5812f',
  silver: '#c9ced6',
  leather: '#1d1a1c',
  leatherLight: '#3a3538',
  torch: '#26272c',
  metal: '#9aa2ad',
  lens: '#fff3b8',
  // shiba
  shiba: '#d88f4c',
  shibaDark: '#b56b2f',
  shibaLight: '#e8a868',
  urajiro: '#f6ead8',
  urajiroShade: '#e3d2bb',
  // rabbit (agouti)
  bun: '#b8a189',
  bunDark: '#8f7a64',
  bunLight: '#cdb89f',
  bunBelly: '#eee3d2',
  bunEarIn: '#e7b1b4',
  eye: '#1c1412',
  eyeBrown: '#4a2e1d',
  nose: '#1b1718',
  noseBun: '#d68e96',
  mouth: '#6b2f2f',
  tear: '#a8dcf7',
};

const rad = (d) => (d * Math.PI) / 180;
const fk = (p, len, deg) => [p[0] + Math.sin(rad(deg)) * len, p[1] + Math.cos(rad(deg)) * len];
const add = (p, d) => [p[0] + d[0], p[1] + d[1]];

/** Short strokes that read as fur along a direction. */
const fur = (cx, cy, rx, ry, color, n, seed, ang = -60, len = 12) => {
  const R = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, r = Math.sqrt(R());
    const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
    const t = rad(ang + (R() - 0.5) * 30);
    s += `<path d="M${x.toFixed(1)},${y.toFixed(1)}l${(Math.cos(t) * len).toFixed(1)},${(Math.sin(t) * len).toFixed(1)}" stroke="${color}" stroke-width="1.6" stroke-linecap="round" opacity="0.55"/>`;
  }
  return s;
};

// ------------------------------------------------------------------ legs / shoes
const SHOE = [[-24, -10], [-26, 16], [-20, 28], [60, 28], [70, 20], [66, 8], [44, 0], [16, -10], [-6, -14]];
const legGeom = (hip, a, L) => {
  const knee = fk(hip, L.thigh, a.thigh);
  const ankle = fk(knee, L.shin, a.shin);
  return {knee, ankle, sole: ankle[1] + 28};
};
const STANCES = {
  stand: {far: {thigh: -3, shin: -3}, near: {thigh: 4, shin: 3}},
  wide: {far: {thigh: -12, shin: -8}, near: {thigh: 14, shin: 8}},
  crouch: {far: {thigh: 14, shin: -12}, near: {thigh: 24, shin: -6}}, // knees bent, scared
  run: {far: {thigh: -32, shin: -58}, near: {thigh: 38, shin: 18}},
};

const leg = (hip, a, L, dim) => {
  const {knee, ankle} = legGeom(hip, a, L);
  const cloth = shade(C.navy, dim);
  let s = '';
  s += piece(capsule(hip, knee, 60, 50), cloth, {edge: 3});
  s += piece(capsule(knee, ankle, 50, 42), cloth, {edge: 3});
  s += ink(`M${knee[0] + 10},${knee[1] - 30}Q${knee[0] + 16},${knee[1]} ${knee[0] + 8},${knee[1] + 26}`, shade(C.navyShade, dim), 2.5, {opacity: 0.6});
  const foot = -(a.shin > 20 ? 12 : a.shin < -30 ? -18 : 0);
  const tr = `translate(${ankle[0]},${ankle[1]}) rotate(${foot})`;
  s += g(
    piece(smooth(SHOE), shade(C.leather, dim === 1 ? 1 : 1.4), {edge: 3, stroke: '#0c0b0c'}) +
      piece(`M-20,24H62Q68,24 66,28H-20Z`, '#0e0d0e', {edge: 0, shadow: false, stroke: false}) +
      `<ellipse cx="34" cy="4" rx="16" ry="5" fill="#fff" opacity="0.28"/>` +
      ink('M8,-6Q20,-2 30,0', '#4a4448', 2),
    tr,
  );
  return s;
};

// ------------------------------------------------------------------ torso
const torso = (hip, bx) => {
  const P = (x, y) => [hip[0] + x * bx, hip[1] + y];
  let s = '';
  const body = smooth([P(-66, 34), P(-60, -60), P(-78, -170), P(-74, -240), P(-48, -268), P(0, -276), P(46, -270), P(68, -246), P(76, -190), P(66, -120), P(60, -60), P(66, 30), P(0, 40)]);
  s += piece(body, C.navy, {edge: 5, stroke: C.navyShade, shadow: 'big'});
  // side in shadow (light comes from the upper left... and the flashlight)
  s += piece(smooth([P(-66, 34), P(-60, -60), P(-78, -170), P(-74, -240), P(-50, -266), P(-40, -250), P(-44, -150), P(-40, -40), P(-46, 34)]), C.navyShade, {edge: 0, shadow: false, stroke: false});
  // shirt + tie in the collar
  s += piece(poly([P(6, -276), P(44, -268), P(28, -214)]), C.shirt, {edge: 1});
  s += piece(poly([P(22, -266), P(32, -266), P(34, -206), P(27, -196), P(20, -206)]), C.tie, {edge: 1});
  // lapels
  s += piece(poly([P(-6, -278), P(24, -214), P(10, -206), P(-14, -262)]), C.navyLight, {edge: 2});
  s += piece(poly([P(44, -270), P(56, -254), P(34, -206), P(28, -214)]), C.navyLight, {edge: 2});
  // placket + buttons
  s += ink(`M${P(34, -206)[0]},${P(34, -206)[1]}L${P(40, 30)[0]},${P(40, 30)[1]}`, C.navyShade, 3);
  for (const y of [-180, -132, -84]) s += piece(circ(P(44, y)[0], P(44, y)[1], 5.5), C.gold, {edge: 1, stroke: C.goldDark});
  // epaulette
  s += piece(rrect(P(10, -270)[0], P(10, -270)[1], 52 * bx, 13, 5), C.navyShade, {edge: 2, transform: `rotate(8,${P(36, -264)[0]},${P(36, -264)[1]})`});
  // breast pocket + badge (a small crest, no text)
  s += piece(rrect(P(42, -206)[0], P(42, -206)[1], 30 * bx, 12, 3), C.navyShade, {edge: 2});
  const b = P(58, -226);
  s += piece(`M${b[0] - 11},${b[1] - 12}H${b[0] + 11}V${b[1] + 2}Q${b[0] + 11},${b[1] + 12} ${b[0]},${b[1] + 16}Q${b[0] - 11},${b[1] + 12} ${b[0] - 11},${b[1] + 2}Z`, C.gold, {edge: 2, stroke: C.goldDark});
  s += piece(circ(b[0], b[1] + 1, 4), C.goldDark, {edge: 0, shadow: false, stroke: false});
  // duty belt with pouches
  s += piece(smooth([P(-64, -52), P(0, -58), P(64, -56), P(66, -26), P(0, -26), P(-62, -22)]), C.leather, {edge: 3, stroke: '#000'});
  s += piece(rrect(P(-46, -54)[0], P(-46, -54)[1], 26, 36, 5), C.leatherLight, {edge: 2});
  s += piece(rrect(P(-12, -54)[0], P(-12, -54)[1], 22, 32, 5), C.leatherLight, {edge: 2});
  s += piece(rrect(P(24, -50)[0], P(24, -50)[1], 20, 22, 3), C.silver, {edge: 1, stroke: '#8a9099'});
  return s;
};

// ------------------------------------------------------------------ arms + flashlight
const arm = (shoulder, a, fur_, dim) => {
  const elbow = fk(shoulder, 104, a.upper);
  const wrist = fk(elbow, 92, a.fore);
  const paw = fk(wrist, 14, a.fore);
  const cloth = shade(C.navy, dim);
  let s = '';
  s += piece(capsule(shoulder, elbow, 46, 40), cloth, {edge: 3});
  s += piece(capsule(elbow, wrist, 40, 36), cloth, {edge: 3});
  const cuffA = fk(wrist, -12, a.fore);
  s += piece(capsule(cuffA, wrist, 38, 38), shade(C.navyShade, dim), {edge: 1});
  // furry paw with three finger pads
  s += piece(ell(paw[0], paw[1], 21, 19), shade(fur_, dim), {edge: 2});
  const dir = rad(90 - a.fore);
  for (let k = -1; k <= 1; k++) {
    const q = [paw[0] + Math.cos(dir + k * 0.5) * 16, paw[1] - Math.sin(dir + k * 0.5) * 16];
    s += ink(`M${paw[0]},${paw[1]}L${q[0].toFixed(1)},${q[1].toFixed(1)}`, shade(fur_, 0.72 * dim), 1.6, {opacity: 0.7});
  }
  return {svg: s, paw};
};

const flashlight = (paw, angle) => {
  const tr = `translate(${paw[0]},${paw[1]}) rotate(${angle})`;
  let s = '';
  s += piece(rrect(-30, -10, 78, 20, 6), C.torch, {edge: 2, stroke: '#0e0e10'});
  for (const x of [-18, -10, -2]) s += ink(`M${x},-9V9`, '#3c3d44', 2);
  s += piece(poly([[46, -13], [74, -19], [74, 19], [46, 13]]), '#34353c', {edge: 2, stroke: '#111'});
  s += piece(rrect(72, -21, 7, 42, 2), C.metal, {edge: 1});
  s += piece(ell(79, 0, 4, 18), C.lens, {edge: 0, shadow: false, stroke: '#e6d38a'});
  s += `<rect x="-26" y="-7" width="68" height="3" fill="#fff" opacity="0.18"/>`;
  const a = rad(angle);
  return {svg: g(s, tr), lens: [paw[0] + Math.cos(a) * 82, paw[1] + Math.sin(a) * 82]};
};

// ------------------------------------------------------------------ cap
const cap = (cx, cy, w, tilt) => {
  let s = '';
  s += piece(`M${cx - w * 0.46},${cy + 4}L${cx - w * 0.56},${cy - w * 0.26}Q${cx - w * 0.1},${cy - w * 0.44} ${cx + w * 0.58},${cy - w * 0.3}L${cx + w * 0.46},${cy + 4}Z`, C.navy, {edge: 3, stroke: C.navyShade});
  s += piece(`M${cx - w * 0.56},${cy - w * 0.26}Q${cx - w * 0.1},${cy - w * 0.44} ${cx + w * 0.58},${cy - w * 0.3}Q${cx},${cy - w * 0.2} ${cx - w * 0.56},${cy - w * 0.26}Z`, C.navyLight, {edge: 0, shadow: false, stroke: false});
  s += piece(rrect(cx - w * 0.47, cy - w * 0.1, w * 0.94, w * 0.14, 3), C.leather, {edge: 2});
  s += ink(`M${cx - w * 0.44},${cy - w * 0.03}H${cx + w * 0.44}`, C.gold, 2.5, {opacity: 0.9});
  s += piece(`M${cx + w * 0.12},${cy + w * 0.03}Q${cx + w * 0.62},${cy - w * 0.02} ${cx + w * 0.7},${cy + w * 0.1}Q${cx + w * 0.4},${cy + w * 0.14} ${cx + w * 0.12},${cy + w * 0.08}Z`, '#0f1014', {edge: 2});
  s += `<path d="M${cx + w * 0.3},${cy + w * 0.05}Q${cx + w * 0.5},${cy + w * 0.03} ${cx + w * 0.62},${cy + w * 0.08}" stroke="#fff" stroke-width="2" opacity="0.3" fill="none"/>`;
  const e = [cx + w * 0.1, cy - w * 0.2];
  s += piece(`M${e[0]},${e[1] - 12}L${e[0] + 9},${e[1]}L${e[0]},${e[1] + 12}L${e[0] - 9},${e[1]}Z`, C.gold, {edge: 1, stroke: C.goldDark});
  return g(s, `rotate(${tilt},${cx},${cy})`);
};

// ------------------------------------------------------------------ heads
// Drawn around the skull centre, facing right (three-quarter view).
const shibaHead = (face) => {
  let s = '';
  const earBack = face === 'flee' ? 30 : 0; // ears pinned back when fleeing
  const earUp = face === 'shock' ? -10 : 0;
  // ears
  const ear = (base, tip, inner, rot) =>
    g(piece(smooth(base), C.shiba, {edge: 3, stroke: C.shibaDark}) + piece(smooth(inner), C.urajiro, {edge: 0, shadow: false, stroke: false}) + fur(tip[0], tip[1] + 30, 12, 20, C.urajiroShade, 6, tip[0] | 0, 90, 10), `rotate(${rot},${base[0][0]},${base[0][1]})`);
  s += ear([[-70, -40], [-66, -134 + earUp], [-20, -72]], [-60, -110], [[-62, -52], [-60, -114 + earUp], [-32, -72]], -earBack);
  s += ear([[8, -76], [44, -148 + earUp], [66, -52]], [42, -120], [[20, -72], [44, -128 + earUp], [56, -58]], -earBack);
  // skull
  s += piece(smooth([[-82, 4], [-74, -46], [-36, -80], [20, -84], [64, -58], [92, -14], [96, 30], [64, 62], [0, 70], [-58, 54]]), C.shiba, {edge: 4, stroke: C.shibaDark, shadow: 'big'});
  s += piece(smooth([[-82, 4], [-74, -46], [-40, -78], [-30, -40], [-50, 10], [-58, 54]]), C.shibaDark, {edge: 0, shadow: false, stroke: false, opacity: 0.55});
  s += fur(-10, -44, 50, 26, C.shibaDark, 22, 7, -120, 13);
  // muzzle (tan on top, urajiro below) - compressed a little: shiba snouts are short
  s += '<g transform="translate(40,0) scale(0.84,1) translate(-40,0)">';
  s += piece(smooth([[40, -18], [96, -12], [150, 2], [158, 18], [146, 32], [110, 46], [60, 52], [36, 30]]), C.shiba, {edge: 3, stroke: C.shibaDark});
  s += piece(smooth([[30, 18], [70, 20], [120, 26], [150, 26], [140, 40], [100, 56], [40, 70], [-10, 64], [-40, 44], [0, 30]]), C.urajiro, {edge: 2, stroke: C.urajiroShade});
  s += fur(10, 52, 44, 12, C.urajiroShade, 14, 9, 100, 10);
  // eyebrow dots
  s += piece(ell(26, -44, 11, 7), C.urajiro, {edge: 0, shadow: false, stroke: false});
  s += piece(ell(-16, -46, 9, 6), C.urajiro, {edge: 0, shadow: false, stroke: false});
  // nose + mouth
  s += piece(smooth([[140, 0], [158, -2], [166, 10], [156, 22], [140, 18]]), C.nose, {edge: 2, stroke: '#000'});
  s += `<ellipse cx="152" cy="4" rx="6" ry="3" fill="#fff" opacity="0.4"/>`;
  if (face === 'shock' || face === 'flee') {
    s += piece(smooth([[150, 30], [140, 58], [110, 64], [96, 50], [120, 38]]), C.mouth, {edge: 1, stroke: '#3b1717'});
    s += piece(ell(128, 54, 12, 5), '#d36d7a', {edge: 0, shadow: false, stroke: false});
  } else if (face === 'brave') {
    s += ink('M152,24Q146,36 120,40Q100,42 86,36', C.eye, 3.2);
  } else {
    s += ink('M152,24Q146,34 124,38Q108,40 96,34', C.eye, 3); // tight, nervous mouth
  }
  s += '</g>';
  // eyes: almond, dark with a rim; far eye is mostly hidden
  const eyeW = face === 'shock' || face === 'flee' ? 1.25 : 1;
  const E = (x, y, k) => {
    let e = '';
    if (eyeW > 1) e += piece(ell(x, y, 15 * k, 12 * eyeW), '#f4ede4', {edge: 0, shadow: false, stroke: '#2a1a12', sw: 2.5});
    e += `<ellipse cx="${x + 1}" cy="${y}" rx="${(eyeW > 1 ? 7 : 11) * k}" ry="${eyeW > 1 ? 8 : 9.5}" fill="${C.eyeBrown}"/>`;
    e += `<ellipse cx="${x + 1}" cy="${y}" rx="${(eyeW > 1 ? 4 : 6) * k}" ry="${eyeW > 1 ? 5 : 7}" fill="${C.eye}"/>`;
    e += `<circle cx="${x + 4 * k}" cy="${y - 3}" r="2.6" fill="#fff" opacity="0.9"/>`;
    if (eyeW === 1) e += ink(`M${x - 13 * k},${y + 1}Q${x},${y - 12} ${x + 14 * k},${y - 2}`, '#2a1a12', 3);
    if (face === 'brave') e += ink(`M${x - 14 * k},${y - 10}L${x + 12 * k},${y - 6}`, C.shibaDark, 4);
    return e;
  };
  s += E(38, -18, 1);
  s += E(-12, -20, 0.55);
  s += cap(-4, -60, 132, face === 'shock' ? -12 : face === 'flee' ? 10 : -4);
  return s;
};

const rabbitHead = (face) => {
  let s = '';
  // long ears (drawn before the cap)
  const earAng = {shock: [-4, 4], squeeze: [-58, -48], teary: [-26, -18], flee: [-70, -64], normal: [-16, -8]}[face] || [-16, -8];
  const longEar = (root, ang, k) => {
    const shape = [[-16, 0], [-22, -90], [-14, -170], [0, -196], [14, -172], [20, -92], [14, 0]];
    const inner = [[-8, -10], [-12, -90], [-6, -160], [2, -176], [8, -158], [10, -90], [6, -10]];
    return g(
      piece(smooth(shape), shade(C.bun, k), {edge: 3, stroke: C.bunDark}) +
        piece(smooth(inner), shade(C.bunEarIn, k), {edge: 0, shadow: false, stroke: false}) +
        ink('M0,-20Q-4,-90 0,-160', shade('#c98f95', k), 1.6, {opacity: 0.6}) +
        `<path d="M-16,-150Q0,-210 16,-150" fill="none" stroke="${C.bunDark}" stroke-width="3" opacity="0.6"/>`,
      `translate(${root[0]},${root[1]}) rotate(${ang})`,
    );
  };
  s += longEar([-30, -60], earAng[0], 0.88);
  s += longEar([4, -66], earAng[1], 1);
  // head: egg shape, the nose end to the right
  s += piece(smooth([[-76, 14], [-66, -38], [-22, -66], [30, -62], [74, -34], [110, 2], [116, 26], [96, 46], [40, 62], [-30, 60]]), C.bun, {edge: 4, stroke: C.bunDark, shadow: 'big'});
  s += piece(smooth([[-76, 14], [-66, -38], [-36, -60], [-30, -20], [-44, 30], [-30, 60]]), C.bunDark, {edge: 0, shadow: false, stroke: false, opacity: 0.45});
  s += fur(0, -30, 60, 26, C.bunDark, 26, 3, -150, 12);
  // cheek + muzzle fluff
  s += piece(smooth([[30, 30], [70, 18], [112, 22], [104, 44], [60, 62], [10, 60], [0, 44]]), C.bunBelly, {edge: 2, stroke: '#d8cbb6'});
  s += fur(50, 44, 40, 12, '#cdbfa8', 14, 5, 170, 10);
  // nose (Y), split lip, whiskers
  s += piece(smooth([[106, 12], [118, 10], [116, 20]]), C.noseBun, {edge: 1, stroke: '#b56d76'});
  s += ink('M114,20L112,30M112,30Q104,36 98,32M112,30Q116,38 120,36', '#7a5a5a', 2);
  for (const [dy, dx2] of [[-4, 70], [4, 76], [12, 68]]) s += ink(`M104,${24 + dy / 2}Q${140},${20 + dy} ${104 + dx2},${24 + dy * 2}`, '#f5f0e6', 1.3, {opacity: 0.85});
  if (face === 'shock' || face === 'flee') s += piece(ell(104, 42, 8, 9), C.mouth, {edge: 0, shadow: false, stroke: '#3b1717'}) + piece(rrect(99, 34, 10, 7, 2), '#fbfaf5', {edge: 0, shadow: false, stroke: false});
  // big glossy eye on the side of the head
  const ex = 38, ey = -12;
  if (face === 'squeeze') {
    s += ink(`M${ex - 16},${ey + 2}Q${ex},${ey + 10} ${ex + 16},${ey}`, C.eye, 4);
    s += ink(`M${ex - 12},${ey - 6}L${ex - 20},${ey - 12}M${ex},${ey - 4}L${ex},${ey - 12}`, C.eye, 2, {opacity: 0.6});
  } else {
    const wide = face === 'shock' || face === 'flee';
    if (wide) s += piece(ell(ex, ey, 21, 23), '#f3ede4', {edge: 0, shadow: false, stroke: '#2a1a12', sw: 2.5});
    s += piece(ell(ex, ey, wide ? 12 : 16, wide ? 14 : 18), '#2a1c16', {edge: 0, shadow: false, stroke: '#140c0a', sw: 2});
    s += `<ellipse cx="${ex}" cy="${ey + 4}" rx="${wide ? 9 : 12}" ry="${wide ? 8 : 10}" fill="#5a3a26" opacity="0.6"/>`;
    s += `<circle cx="${ex + 5}" cy="${ey - 6}" r="${wide ? 3.5 : 5}" fill="#fff"/><circle cx="${ex - 5}" cy="${ey + 7}" r="2" fill="#fff" opacity="0.7"/>`;
    if (face === 'teary') s += `<path d="M${ex - 14},${ey + 14}Q${ex},${ey + 22} ${ex + 14},${ey + 14}" stroke="${C.tear}" stroke-width="4" fill="none" opacity="0.9"/><path d="M${ex + 6},${ey + 20}q4,10 0,16q-4,-6 0,-16Z" fill="${C.tear}" opacity="0.9"/>`;
  }
  s += cap(-14, -52, 122, face === 'shock' ? -14 : face === 'squeeze' ? 10 : face === 'flee' ? 14 : 2);
  return s;
};

// ------------------------------------------------------------------ tails
const tail = (species, hip) => {
  const [x, y] = [hip[0] - 62, hip[1] - 40];
  if (species === 'shiba') {
    return piece(`M${x + 10},${y + 30}C${x - 60},${y + 24} ${x - 76},${y - 60} ${x - 26},${y - 74}C${x + 10},${y - 80} ${x + 14},${y - 40} ${x - 12},${y - 34}C${x - 32},${y - 30} ${x - 28},${y - 2} ${x + 12},${y + 2}Z`, C.shiba, {edge: 3, stroke: C.shibaDark}) +
      piece(`M${x - 30},${y - 60}C${x - 6},${y - 66} ${x},${y - 44} ${x - 16},${y - 40}C${x - 30},${y - 38} ${x - 36},${y - 52} ${x - 30},${y - 60}Z`, C.urajiro, {edge: 0, shadow: false, stroke: false});
  }
  return piece(smooth([[x + 6, y + 30], [x - 24, y + 36], [x - 38, y + 10], [x - 22, y - 12], [x + 4, y - 6]]), C.bunBelly, {edge: 2, stroke: '#d8cbb6'}) + fur(x - 16, y + 12, 16, 14, '#d0c3ad', 8, 11, 180, 8);
};

// ------------------------------------------------------------------ full officer
/**
 * pose = {species, face, stance, back:{upper,fore}, front:{upper,fore}, light (deg|null), headTilt, headDy, lean}
 * Returns {svg, beam: {x, y, angle} | null}
 */
export const drawOfficer = (pose) => {
  const shibaSp = pose.species === 'shiba';
  const furC = shibaSp ? C.shiba : C.bun;
  const L = shibaSp ? {thigh: 152, shin: 144} : {thigh: 134, shin: 126};
  const bx = shibaSp ? 1 : 0.88;
  const st = STANCES[pose.stance || 'stand'];
  const hipX = ADIM.hipX;
  // stand the doll on the ground: lowest sole touches the ground line
  const lowest = Math.max(legGeom([hipX - 10, 0], st.far, L).sole, legGeom([hipX + 10, 0], st.near, L).sole);
  const hip = [hipX, ADIM.ground - lowest];
  const lean = pose.lean || 0;
  const Rp = (p) => {
    const a = rad(lean), x = p[0] - hip[0], y = p[1] - hip[1];
    return [hip[0] + x * Math.cos(a) - y * Math.sin(a), hip[1] + x * Math.sin(a) + y * Math.cos(a)];
  };
  const shBack = Rp([hip[0] - 50 * bx, hip[1] - 244]);
  const shFront = Rp([hip[0] + 44 * bx, hip[1] - 246]);

  let s = '';
  let beam = null;
  const back = arm(shBack, pose.back, furC, 0.86);
  s += back.svg;
  s += tail(pose.species, hip);
  s += leg([hipX - 10, hip[1] + 6], st.far, L, 0.86);
  s += leg([hipX + 10, hip[1] + 6], st.near, L, 1);
  // upper body leans around the hip
  let ub = torso(hip, bx);
  // neck fur ruff
  const neck = [hip[0] + 18, hip[1] - 272];
  ub += piece(ell(neck[0], neck[1], 34, 20), shibaSp ? C.urajiro : C.bunBelly, {edge: 2, stroke: shibaSp ? C.urajiroShade : '#d8cbb6'});
  const headC = [hip[0] + 30, hip[1] - 352 + (pose.headDy || 0)];
  ub += g(shibaSp ? shibaHead(pose.face) : rabbitHead(pose.face), `translate(${headC[0]},${headC[1]}) rotate(${pose.headTilt || 0},0,60) scale(1.12)`);
  s += g(ub, `rotate(${lean},${hip[0]},${hip[1]})`);
  const front = arm(shFront, pose.front, furC, 1);
  if (pose.light != null) {
    const f = flashlight(front.paw, pose.light);
    s += f.svg;
    beam = {x: f.lens[0], y: f.lens[1], angle: pose.light};
  }
  s += front.svg;
  return {svg: s, beam};
};

export const OFFICER_POSES = {
  // --- senior: shiba (scared, but steps up) ---
  senior_walk: {species: 'shiba', face: 'normal', stance: 'stand', lean: 3, back: {upper: -8, fore: 8}, front: {upper: 30, fore: 78}, light: 6},
  senior_alert: {species: 'shiba', face: 'shock', stance: 'wide', lean: -6, back: {upper: -60, fore: -120}, front: {upper: 70, fore: 120}, light: -40, headDy: -4},
  senior_brave: {species: 'shiba', face: 'brave', stance: 'wide', lean: 4, back: {upper: -58, fore: -84}, front: {upper: 62, fore: 88}, light: 14},
  senior_flee: {species: 'shiba', face: 'flee', stance: 'run', lean: 12, back: {upper: -40, fore: -90}, front: {upper: 50, fore: 110}, light: -18},
  // --- junior: rabbit (jumpy) ---
  junior_walk: {species: 'bunny', face: 'teary', stance: 'crouch', lean: 6, back: {upper: 18, fore: 96}, front: {upper: 26, fore: 92}, light: 16},
  junior_shock: {species: 'bunny', face: 'shock', stance: 'wide', lean: -8, back: {upper: -70, fore: -140}, front: {upper: 80, fore: 140}, light: -60, headDy: -6},
  junior_cling: {species: 'bunny', face: 'squeeze', stance: 'crouch', lean: 14, back: {upper: 62, fore: 100}, front: {upper: 70, fore: 104}, light: null, headTilt: 8},
  junior_scared: {species: 'bunny', face: 'teary', stance: 'crouch', lean: 4, back: {upper: 24, fore: 126}, front: {upper: 30, fore: 132}, light: 32, headTilt: 4},
  junior_flee: {species: 'bunny', face: 'flee', stance: 'run', lean: 14, back: {upper: -50, fore: -100}, front: {upper: 60, fore: 120}, light: -24},
};
