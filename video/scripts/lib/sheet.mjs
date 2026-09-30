// Character reference sheet: front / 3/4 / side turnaround + expressions + palette.
import {doc, piece, g, rrect, circ, shade} from './paper.mjs';
import {drawBody, drawHead, POSES, PALETTE} from './character.mjs';
import {drawOfficer, OFFICER_POSES} from './animals.mjs';

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

// Police duo reference sheet: every pose of both officers on one page.
export const policeSheet = () => {
  const W = 1920, H = 1080;
  let s = piece(rrect(40, 40, W - 80, H - 80, 28), '#2f2b4c', {edge: 5, shadow: 'big'});
  const rows = [
    ['senior_walk', 'senior_alert', 'senior_brave', 'senior_flee'],
    ['junior_walk', 'junior_shock', 'junior_cling', 'junior_scared', 'junior_flee'],
  ];
  rows.forEach((row, r) =>
    row.forEach((k, i) => {
      s += g(drawOfficer(OFFICER_POSES[k]).svg, `translate(${70 + i * 360},${60 + r * 490}) scale(0.64)`);
    }),
  );
  return doc(W, H, s, {background: '#221f38'});
};
