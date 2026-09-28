// Parametric paper-doll character.
// Every pose (walk_01..04, stop, surprised, happy, reference sheet) is drawn
// by the same code with different joint angles, so face / hair / outfit /
// proportions can never drift between images.
import {piece, ink, g, clipped, shade, capsule, smooth, ell, circ, rrect, rng} from './paper.mjs';

export const PALETTE = {
  skin: '#f8dcc8',
  hair: '#8e5b3b',
  hairDark: '#6f432b',
  hairLight: '#a8714c',
  eye: '#5a3824',
  blush: '#f3a0a4',
  dress: '#a6cfe8',
  dressDark: '#86b6d6',
  flowerA: '#fffaf1',
  flowerB: '#f7bccb',
  flowerC: '#f4d77e',
  cardigan: '#f4e8d0',
  sock: '#fcfbf7',
  loafer: '#7c4a2c',
  bag: '#a0673f',
  strap: '#7e4d30',
  clip: '#f59fb5',
  mouth: '#b8574f',
};
const P = PALETTE;

// Proportions (canvas px). Character is ~5.6 heads tall.
export const DIM = {
  W: 560,
  H: 900,
  ground: 862,
  hipX: 262,
  thigh: 168,
  shin: 196,
  shoulder: 196, // hip -> shoulder
  upperArm: 92,
  foreArm: 84,
};

const rad = (d) => (d * Math.PI) / 180;
const fk = (p, len, deg) => [p[0] + Math.sin(rad(deg)) * len, p[1] + Math.cos(rad(deg)) * len];
const rot = (p, deg, c = [0, 0]) => {
  const a = rad(deg);
  const x = p[0] - c[0], y = p[1] - c[1];
  return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
};

// Loafer, side view, ankle at origin, facing +x.
const SHOE_SIDE = [[-19, -6], [-21, 14], [-15, 23], [46, 23], [55, 17], [50, 6], [30, -2], [10, -9], [-8, -10]];
const SOLE = [[-15, 23], [46, 23]];

const legGeom = (hip, leg) => {
  const knee = fk(hip, DIM.thigh, leg.thigh);
  const ankle = fk(knee, DIM.shin, leg.shin);
  const soleY = Math.max(...SOLE.map((p) => rot(p, -(leg.foot || 0))[1] + ankle[1]));
  return {knee, ankle, soleY};
};

const drawLeg = (hip, leg, dim = 1, view = 'side') => {
  const {knee, ankle} = legGeom(hip, leg);
  const skin = shade(P.skin, dim);
  let s = '';
  s += piece(capsule(hip, knee, 40, 34), skin, {edge: 2});
  s += piece(capsule(knee, ankle, 34, 25), skin, {edge: 2});
  // ankle sock
  const sockTop = fk(ankle, -46, leg.shin);
  s += piece(capsule(sockTop, ankle, 31, 29), shade(P.sock, dim), {edge: 2});
  s += ink(`M${sockTop[0] - 13},${sockTop[1] + 6}L${sockTop[0] + 13},${sockTop[1] + 6}`, shade('#dcd8ce', dim), 2);
  if (view === 'front') {
    const d = smooth([[ankle[0] - 18, ankle[1] - 4], [ankle[0] + 18, ankle[1] - 4], [ankle[0] + 20, ankle[1] + 18], [ankle[0], ankle[1] + 25], [ankle[0] - 20, ankle[1] + 18]]);
    s += piece(d, shade(P.loafer, dim), {edge: 3});
    s += ink(`M${ankle[0] - 12},${ankle[1] + 6}Q${ankle[0]},${ankle[1] + 11} ${ankle[0] + 12},${ankle[1] + 6}`, shade(P.loafer, 0.7 * dim), 2.5);
  } else {
    const tr = `translate(${ankle[0]},${ankle[1]}) rotate(${-(leg.foot || 0)})`;
    s += piece(smooth(SHOE_SIDE), shade(P.loafer, dim), {edge: 3, transform: tr});
    s += g(
      ink('M8,-4Q20,2 32,1', shade(P.loafer, 0.68 * dim), 3) + ink('M-15,20L46,20', shade(P.loafer, 0.6 * dim), 2.5),
      tr,
    );
  }
  return s;
};

const drawArm = (shoulder, arm, dim = 1) => {
  const elbow = fk(shoulder, DIM.upperArm, arm.upper);
  const wrist = fk(elbow, DIM.foreArm, arm.fore);
  const cuff = fk(wrist, -10, arm.fore);
  const hand = fk(wrist, 10, arm.fore);
  const c = shade(P.cardigan, dim);
  let s = '';
  s += piece(circ(hand[0], hand[1], 12.5), shade(P.skin, dim), {edge: 2});
  s += piece(capsule(elbow, cuff, 25, 24), c, {edge: 2});
  s += piece(capsule(shoulder, elbow, 29, 26), c, {edge: 2});
  s += ink(`M${cuff[0] - 12},${cuff[1]}L${cuff[0] + 12},${cuff[1]}`, shade(P.cardigan, 0.82 * dim), 2, {});
  return {svg: s, hand};
};

// Floral pattern (white/pink five-petal flowers) inside a clip path.
const florals = (clipD, box, seed = 5, scale = 1) => {
  const r = rng(seed);
  let s = `<rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" fill="${P.dress}"/>`;
  const step = 34 * scale;
  let row = 0;
  for (let y = box[1]; y < box[1] + box[3] + step; y += step * 0.8, row++) {
    for (let x = box[0] + (row % 2) * step * 0.5; x < box[0] + box[2] + step; x += step) {
      const cx = x + (r() - 0.5) * 8, cy = y + (r() - 0.5) * 8;
      const col = r() < 0.6 ? P.flowerA : P.flowerB;
      const pr = 4.2 * scale;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + row;
        s += `<circle cx="${cx + Math.cos(a) * pr}" cy="${cy + Math.sin(a) * pr}" r="${pr * 0.75}" fill="${col}"/>`;
      }
      s += `<circle cx="${cx}" cy="${cy}" r="${pr * 0.55}" fill="${P.flowerC}"/>`;
    }
  }
  return clipped(clipD, s);
};

// ---------- head ----------
const lerp = (a, b, t) => a + (b - a) * t;
const lerpPts = (A, B, t) => A.map((p, i) => [lerp(p[0], B[i][0], t), lerp(p[1], B[i][1], t)]);

const FACE_FRONT = [[-54, -8], [-44, -44], [0, -60], [44, -44], [54, -8], [48, 26], [28, 50], [0, 58], [-28, 50], [-48, 26]];
const FACE_34 = [[-50, -10], [-38, -46], [4, -60], [44, -42], [58, -6], [56, 26], [38, 50], [14, 58], [-18, 50], [-44, 24]];

export const drawHead = (o = {}) => {
  const {turn = 0.8, face = 'neutral', hairLag = 0} = o;
  const t = turn;
  let s = '';
  // back hair (shoulder-length bob), swings slightly with hairLag
  const back = smooth([
    [lerp(-66, -60, t), -34], [lerp(-40, -30, t), -72], [lerp(0, 10, t), -76], [lerp(44, 50, t), -62],
    [lerp(66, 62, t), -24], [lerp(70, 44, t), 30], [lerp(72, 30, t), 76], [lerp(56, 10, t), 92],
    [lerp(0, -30, t) + hairLag * 0.6, 90], [lerp(-56, -68, t) + hairLag, 92], [lerp(-72, -80, t) + hairLag, 70], [lerp(-70, -74, t), 20],
  ]);
  s += piece(back, P.hair, {edge: 3, stroke: P.hairDark});
  // inner shadow of hair behind the neck
  s += piece(smooth([[lerp(-44, -52, t), 30], [lerp(-10, -22, t), 40], [lerp(40, 10, t), 34], [lerp(40, 4, t), 80], [lerp(-44, -56, t) + hairLag, 84]]), P.hairDark, {edge: 0, stroke: false, shadow: false});
  // face
  const fp = lerpPts(FACE_FRONT, FACE_34, t);
  s += piece(smooth(fp), P.skin, {edge: 2, stroke: shade(P.skin, 0.84)});
  // ear (only visible when turned)
  // blush
  const ex1 = lerp(-22, 2, t), ex2 = lerp(22, 40, t);
  s += `<ellipse cx="${ex1 - 8}" cy="30" rx="${lerp(12, 11, t)}" ry="7" fill="${P.blush}" opacity="${face === 'happy' ? 0.75 : 0.55}"/>`;
  s += `<ellipse cx="${ex2 + 6}" cy="30" rx="${lerp(12, 8, t)}" ry="6.5" fill="${P.blush}" opacity="${face === 'happy' ? 0.75 : 0.55}"/>`;
  // eyes
  const big = face === 'surprised' ? 1.25 : face === 'curious' ? 1.08 : 1;
  const lookY = face === 'curious' || face === 'surprised' ? -2 : 0;
  const eye = (x, narrow) => {
    const rx = 8.2 * big * narrow, ry = 11 * big;
    if (face === 'happy') {
      return ink(`M${x - rx - 1},${10}Q${x},${-4} ${x + rx + 1},${10}`, P.eye, 3.6);
    }
    let e = `<ellipse cx="${x}" cy="10" rx="${rx}" ry="${ry}" fill="${P.eye}"/>`;
    e += `<ellipse cx="${x}" cy="${14}" rx="${rx * 0.7}" ry="${ry * 0.45}" fill="${shade(P.eye, 1.35)}" opacity="0.7"/>`;
    e += `<circle cx="${x + 2.5 * narrow}" cy="${5 + lookY}" r="${3.4 * big}" fill="#fff"/>`;
    e += `<circle cx="${x - 3 * narrow}" cy="${15 + lookY}" r="${1.6 * big}" fill="#fff"/>`;
    e += ink(`M${x - rx - 2},${10 - ry + 2}Q${x},${10 - ry - 3} ${x + rx + 3},${10 - ry + 1}`, P.eye, 2.6);
    return e;
  };
  s += eye(ex1, lerp(1, 0.95, t));
  s += eye(ex2, lerp(1, 0.72, t));
  // brows
  const browY = face === 'surprised' ? -18 : face === 'curious' ? -15 : -11;
  s += ink(`M${ex1 - 8},${browY}Q${ex1},${browY - 4} ${ex1 + 8},${browY}`, P.hairDark, 2.4, {opacity: 0.8});
  s += ink(`M${ex2 - 6},${browY - (face === 'curious' ? 3 : 0)}Q${ex2},${browY - 4 - (face === 'curious' ? 3 : 0)} ${ex2 + 6},${browY - (face === 'curious' ? 2 : 0)}`, P.hairDark, 2.4, {opacity: 0.8});
  // nose
  const nx = lerp(0, 34, t);
  s += ink(`M${nx + 1},22Q${nx + 3},25 ${nx},26`, shade(P.skin, 0.72), 2);
  // mouth
  const mx = lerp(0, 24, t), my = 38;
  if (face === 'happy') {
    s += piece(`M${mx - 10},${my - 2}Q${mx},${my - 4} ${mx + 10},${my - 2}Q${mx + 8},${my + 12} ${mx},${my + 12}Q${mx - 8},${my + 12} ${mx - 10},${my - 2}Z`, P.mouth, {edge: 0, shadow: false, stroke: shade(P.mouth, 0.8)});
    s += `<ellipse cx="${mx}" cy="${my + 7}" rx="5" ry="3" fill="#f59a92"/>`;
  } else if (face === 'surprised') {
    s += piece(ell(mx, my + 3, 5.5, 7.5), P.mouth, {edge: 0, shadow: false, stroke: shade(P.mouth, 0.8)});
  } else if (face === 'curious') {
    s += piece(ell(mx, my + 1, 3.6, 4.2), P.mouth, {edge: 0, shadow: false, stroke: shade(P.mouth, 0.8)});
  } else {
    s += ink(`M${mx - 7},${my}Q${mx},${my + 6} ${mx + 7},${my - 1}`, P.mouth, 2.6);
  }
  // bangs (front hair) - a jagged paper-cut fringe
  const bx = lerp(0, 8, t);
  const bang = smooth([
    [bx - 62, 0], [bx - 60, -40], [bx - 30, -68], [bx + 10, -72], [bx + 46, -56], [bx + 62, -20],
    [bx + 56, -12], [bx + 40, -26], [bx + 30, -12], [bx + 18, -30], [bx + 4, -10], [bx - 8, -32], [bx - 24, -12], [bx - 34, -30], [bx - 46, -8], [bx - 50, 30],
  ]);
  s += piece(bang, P.hair, {edge: 3, stroke: P.hairDark});
  // side lock in front of the ear
  s += piece(smooth([[bx - 50, -6], [bx - 40, 16], [bx - 42, 50], [bx - 52, 70], [bx - 60, 40], [bx - 62, 0]]), P.hair, {edge: 2, stroke: P.hairDark});
  if (t < 0.5) s += piece(smooth([[bx + 50, -10], [bx + 60, 10], [bx + 60, 50], [bx + 52, 68], [bx + 44, 36], [bx + 44, 0]]), P.hair, {edge: 2, stroke: P.hairDark});
  // highlight strip
  s += ink(`M${bx - 34},-52Q${bx - 4},-66 ${bx + 26},-58`, P.hairLight, 5, {opacity: 0.8});
  // flower hair clip
  const cx = bx - 40, cy = -44;
  let petals = '';
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    petals += `<circle cx="${cx + Math.cos(a) * 7}" cy="${cy + Math.sin(a) * 7}" r="6" fill="${P.clip}" stroke="${shade(P.clip, 0.8)}" stroke-width="1"/>`;
  }
  s += g(petals + `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${P.flowerC}"/>`, '', 'filter="url(#ps)"');
  return s;
};

// ---------- body ----------
const TORSO = {
  side: {
    dress: [[-36, -76], [-42, -150], [-36, -190], [-10, -202], [20, -200], [40, -180], [48, -150], [40, -112], [34, -76]],
    cardBack: [[-40, -62], [-46, -150], [-40, -196], [-12, -208], [14, -206], [26, -190], [22, -150], [18, -110], [22, -62]],
    skirt: (sway) => [[-38, -80], [38, -80], [62 + sway * 0.6, 20], [80 + sway, 158], [32 + sway, 170], [-22 + sway, 168], [-84 + sway, 158], [-62 + sway * 0.6, 20]],
  },
  front: {
    dress: [[-34, -76], [-40, -160], [-36, -196], [0, -204], [36, -196], [40, -160], [34, -76]],
    cardL: [[-36, -64], [-44, -160], [-38, -198], [-14, -206], [-8, -170], [-16, -110], [-12, -64]],
    cardR: [[36, -64], [44, -160], [38, -198], [14, -206], [8, -170], [16, -110], [12, -64]],
    skirt: () => [[-36, -80], [36, -80], [62, 20], [92, 150], [30, 164], [-30, 164], [-92, 150], [-62, 20]],
  },
};

/**
 * Draw a full-body pose.
 * pose = {view, turn, face, lean, headTilt, hairLag, bagLag, skirtSway,
 *         legs:{far:{thigh,shin,foot}, near:{...}}, arms:{far:{upper,fore}, near:{...}}}
 */
export const drawBody = (pose) => {
  const view = pose.view || 'side';
  const D = DIM;
  const hipX = D.hipX + (pose.dx || 0);
  const legOff = view === 'front' ? 17 : 5;
  // solve hip height so the lowest sole touches the ground
  const probe = (leg, off) => legGeom([hipX + off, 0], leg).soleY;
  const lowest = Math.max(probe(pose.legs.far, -legOff), probe(pose.legs.near, legOff));
  const hipY = D.ground - lowest - (pose.lift || 0);
  const hip = [hipX, hipY];
  const lean = pose.lean || 0;
  const T = view === 'front' ? TORSO.front : TORSO.side;
  const ptsAt = (pts) => pts.map((p) => [hip[0] + p[0], hip[1] + p[1]]);
  const R = (p) => rot(p, lean, hip);
  const shoulderL = R([hip[0] + (view === 'front' ? -42 : -4), hip[1] - D.shoulder + 22]);
  const shoulderR = R([hip[0] + (view === 'front' ? 42 : 8), hip[1] - D.shoulder + 22]);

  let s = '';
  // 1. far arm (behind body)
  const farArm = drawArm(view === 'front' ? shoulderL : shoulderL, pose.arms.far, view === 'front' ? 1 : 0.93);
  s += farArm.svg;
  // 2. back hair lives in the head group; draw head's back hair later with the head
  // 3. far leg + near leg
  s += drawLeg([hipX - legOff, hipY], pose.legs.far, view === 'front' ? 1 : 0.93, view);
  s += drawLeg([hipX + legOff, hipY], pose.legs.near, 1, view);

  // upper body group (rotated by lean around the hip)
  let ub = '';
  const skirtD = smooth(ptsAt(T.skirt(pose.skirtSway || 0)));
  ub += piece(skirtD, P.dress, {edge: 4, stroke: P.dressDark, shadow: 'big'});
  ub += florals(skirtD, [hip[0] - 120, hip[1] - 90, 240, 270], 7);
  // skirt folds
  const sw = pose.skirtSway || 0;
  ub += ink(`M${hip[0] - 8},${hip[1] - 20}Q${hip[0] - 16 + sw * 0.5},${hip[1] + 60} ${hip[0] - 22 + sw},${hip[1] + 150}`, P.dressDark, 2.5, {opacity: 0.7});
  ub += ink(`M${hip[0] + 18},${hip[1] - 20}Q${hip[0] + 26 + sw * 0.5},${hip[1] + 60} ${hip[0] + 32 + sw},${hip[1] + 150}`, P.dressDark, 2.5, {opacity: 0.7});
  // neck
  const neckBase = [hip[0] + (view === 'front' ? 0 : 6), hip[1] - D.shoulder - 2];
  const neckTop = [neckBase[0] + (view === 'front' ? 0 : 4), neckBase[1] - 26];
  ub += piece(capsule(neckBase, neckTop, 24, 22), shade(P.skin, 0.93), {edge: 1});
  // bodice
  const dressD = smooth(ptsAt(T.dress));
  ub += piece(dressD, P.dress, {edge: 3, stroke: P.dressDark});
  ub += florals(dressD, [hip[0] - 60, hip[1] - 215, 120, 150], 9, 0.85);
  // cardigan
  if (view === 'front') {
    ub += piece(smooth(ptsAt(T.cardL)), P.cardigan, {edge: 3});
    ub += piece(smooth(ptsAt(T.cardR)), P.cardigan, {edge: 3});
    for (let i = 0; i < 3; i++) ub += piece(circ(hip[0] - 12, hip[1] - 150 + i * 30, 4), '#e6cfa4', {edge: 1, shadow: false});
  } else {
    ub += piece(smooth(ptsAt(T.cardBack)), P.cardigan, {edge: 3});
    for (let i = 0; i < 3; i++) ub += piece(circ(hip[0] + 16, hip[1] - 160 + i * 30, 4), '#e6cfa4', {edge: 1, shadow: false});
    ub += ink(`M${hip[0] - 30},${hip[1] - 66}L${hip[0] + 18},${hip[1] - 66}`, shade(P.cardigan, 0.82), 3);
  }
  // waist ribbon
  ub += piece(rrect(hip[0] - (view === 'front' ? 35 : 32), hip[1] - 84, view === 'front' ? 70 : 64, 11, 4), P.dressDark, {edge: 1, shadow: false});
  // cross-body bag strap + bag
  const bagLag = pose.bagLag || 0;
  const bagPos = view === 'front' ? [hip[0] + 58, hip[1] - 20] : [hip[0] - 44 + bagLag, hip[1] - 22];
  const strapFrom = view === 'front' ? [hip[0] - 30, hip[1] - 200] : [hip[0] + 12, hip[1] - 200];
  ub += piece(capsule(strapFrom, [bagPos[0] + 6, bagPos[1] - 18], 7, 7), P.strap, {edge: 1});
  const bagTr = `rotate(${bagLag * 0.6},${bagPos[0]},${bagPos[1] - 20})`;
  ub += g(
    piece(rrect(bagPos[0] - 30, bagPos[1] - 20, 60, 46, 12), P.bag, {edge: 3}) +
      piece(`M${bagPos[0] - 30},${bagPos[1] - 8}Q${bagPos[0] - 30},${bagPos[1] - 20} ${bagPos[0] - 18},${bagPos[1] - 20}H${bagPos[0] + 18}Q${bagPos[0] + 30},${bagPos[1] - 20} ${bagPos[0] + 30},${bagPos[1] - 8}V${bagPos[1] + 6}Q${bagPos[0]},${bagPos[1] + 14} ${bagPos[0] - 30},${bagPos[1] + 6}Z`, shade(P.bag, 0.88), {edge: 1}) +
      piece(circ(bagPos[0], bagPos[1] + 8, 4.5), '#e8c46a', {edge: 1}),
    bagTr,
  );
  // head
  const tilt = pose.headTilt || 0;
  const headC = [neckTop[0] + (view === 'front' ? 0 : 6), neckTop[1] - 50];
  ub += g(drawHead({turn: pose.turn ?? 0.8, face: pose.face || 'neutral', hairLag: pose.hairLag || 0}), `translate(${headC[0]},${headC[1]}) rotate(${tilt},0,52)`);
  s += g(ub, `rotate(${lean},${hip[0]},${hip[1]})`);

  // 4. near arm (in front of everything)
  s += drawArm(shoulderR, pose.arms.near, 1).svg;
  return s;
};

// ---------- poses ----------
const WALK_ARM_F = {upper: 22, fore: 42};
const WALK_ARM_B = {upper: -20, fore: -10};
const base = {view: 'side', turn: 0.8, face: 'neutral', lean: 2};

export const POSES = {
  walk_01: {
    ...base, skirtSway: -8, hairLag: 4, bagLag: 3,
    legs: {near: {thigh: 17, shin: 15, foot: 10}, far: {thigh: -15, shin: -26, foot: -18}},
    arms: {near: WALK_ARM_B, far: WALK_ARM_F},
  },
  walk_02: {
    ...base, skirtSway: -4, hairLag: 7, bagLag: 5,
    legs: {near: {thigh: 0, shin: 0, foot: 0}, far: {thigh: 12, shin: -28, foot: -12}},
    arms: {near: {upper: -4, fore: 6}, far: {upper: 4, fore: 12}},
  },
  walk_03: {
    ...base, skirtSway: -8, hairLag: 4, bagLag: 3,
    legs: {far: {thigh: 17, shin: 15, foot: 10}, near: {thigh: -15, shin: -26, foot: -18}},
    arms: {far: WALK_ARM_B, near: WALK_ARM_F},
  },
  walk_04: {
    ...base, skirtSway: -4, hairLag: 9, bagLag: 7, lift: -3,
    legs: {far: {thigh: 0, shin: 0, foot: 0}, near: {thigh: 12, shin: -28, foot: -12}},
    arms: {far: {upper: -4, fore: 6}, near: {upper: 4, fore: 12}},
  },
  stop: {
    ...base, face: 'curious', lean: 5, turn: 0.82, headTilt: -3,
    legs: {far: {thigh: -2, shin: -2, foot: 0}, near: {thigh: 3, shin: 3, foot: 0}},
    // near hand lightly holding the bag strap at the chest
    arms: {far: {upper: -6, fore: 2}, near: {upper: 12, fore: 132}},
  },
  surprised: {
    ...base, face: 'surprised', lean: -2, turn: 0.78, headTilt: -10, hairLag: -3,
    legs: {far: {thigh: -2, shin: -2, foot: 0}, near: {thigh: 3, shin: 3, foot: 0}},
    arms: {far: {upper: -10, fore: -4}, near: {upper: 10, fore: 140}},
  },
  happy: {
    ...base, face: 'happy', lean: 7, turn: 0.8, headTilt: -5,
    legs: {far: {thigh: -3, shin: -3, foot: 0}, near: {thigh: 4, shin: 3, foot: 0}},
    arms: {far: {upper: 22, fore: 150}, near: {upper: 20, fore: 142}},
  },
  // reference-sheet stances
  ref_front: {
    view: 'front', turn: 0, face: 'neutral', lean: 0,
    legs: {far: {thigh: 0, shin: 0}, near: {thigh: 0, shin: 0}},
    arms: {far: {upper: -8, fore: -6}, near: {upper: 8, fore: 6}},
  },
  ref_34: {
    view: 'side', turn: 0.45, face: 'neutral', lean: 0,
    legs: {far: {thigh: -4, shin: -4, foot: 0}, near: {thigh: 5, shin: 5, foot: 0}},
    arms: {far: {upper: -6, fore: -2}, near: {upper: 6, fore: 10}},
  },
  ref_side: {
    view: 'side', turn: 0.85, face: 'neutral', lean: 0,
    legs: {far: {thigh: -2, shin: -2, foot: 0}, near: {thigh: 2, shin: 2, foot: 0}},
    arms: {far: {upper: -4, fore: 0}, near: {upper: 4, fore: 6}},
  },
};

/** Horizontal stride of one step (canvas px): distance between feet at contact. */
export const stepLength = () => {
  const p = POSES.walk_01.legs;
  const a = legGeom([0, 0], p.near).ankle[0];
  const b = legGeom([0, 0], p.far).ankle[0];
  return a - b;
};
