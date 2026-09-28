// Character reference sheet: front / 3/4 / side turnaround + expressions + palette.
import {doc, piece, g, rrect, circ, shade} from './paper.mjs';
import {drawBody, drawHead, POSES, PALETTE} from './character.mjs';

export const characterSheet = () => {
  const W = 1920, H = 1080;
  let s = piece(rrect(40, 40, W - 80, H - 80, 28), '#fbf6ec', {edge: 5, shadow: 'big'});
  const bodies = [['ref_front', 90], ['ref_34', 470], ['ref_side', 830]];
  for (const [k, x] of bodies) s += g(drawBody(POSES[k]), `translate(${x},110) scale(1.0)`);
  // expressions
  const faces = ['neutral', 'happy', 'curious', 'surprised'];
  faces.forEach((f, i) => {
    const x = 1500 + (i % 2) * 250, y = 250 + Math.floor(i / 2) * 290;
    s += piece(circ(x, y, 120), '#f3ece0', {edge: 3});
    s += g(drawHead({turn: 0.55, face: f}), `translate(${x},${y + 4}) scale(1.35)`);
  });
  // palette chips
  const chips = [PALETTE.hair, PALETTE.skin, PALETTE.dress, PALETTE.flowerB, PALETTE.cardigan, PALETTE.sock, PALETTE.loafer, PALETTE.bag];
  chips.forEach((c, i) => (s += piece(rrect(1420 + i * 56, 890, 44, 44, 10), c, {edge: 3, stroke: shade(c, 0.8)})));
  return doc(W, H, s, {background: '#efe6d6'});
};
