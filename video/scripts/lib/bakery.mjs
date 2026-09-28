// Bakery area: the shop itself is split into building / bread display /
// window glass / door / bell so each can sit on its own depth plane.
import {piece, ink, g, shade, mix, rng, circ, ell, rrect, poly, smooth, scallop, capsule} from './paper.mjs';
import {C, TILE, blossomPuff, flower5, cherryTree} from './street.mjs';

const B = {
  wood: '#c48a5a',
  woodDark: '#9a6743',
  woodLight: '#dcaa78',
  plaster: '#fbf1dd',
  roof: '#c97b72',
  awning: '#e7919c',
  interior: '#f6cf86',
  interiorDeep: '#e7ae62',
  crust: '#d9954f',
  crustDark: '#b8753a',
  crumb: '#f3cf8e',
  brass: '#e2b75c',
};

// ---------- bread ----------
export const croissant = (x, y, s = 1) => {
  let d = '';
  const segs = [[-34, 6, 12, 10], [-20, -2, 15, 14], [0, -6, 18, 17], [20, -2, 15, 14], [34, 6, 12, 10]];
  for (const [dx, dy, rx, ry] of segs) d += piece(ell(x + dx * s, y + dy * s, rx * s, ry * s), B.crust, {edge: 2, stroke: B.crustDark});
  d += ink(`M${x - 8 * s},${y - 18 * s}Q${x - 12 * s},${y} ${x - 6 * s},${y + 8 * s}M${x + 8 * s},${y - 18 * s}Q${x + 12 * s},${y} ${x + 6 * s},${y + 8 * s}`, B.crustDark, 2 * s, {opacity: 0.7});
  return d;
};
export const baguette = (x, y, len, ang = 0, s = 1) => {
  const a = (ang * Math.PI) / 180;
  const p0 = [x - Math.cos(a) * len / 2, y - Math.sin(a) * len / 2];
  const p1 = [x + Math.cos(a) * len / 2, y + Math.sin(a) * len / 2];
  let d = piece(capsule(p0, p1, 26 * s, 24 * s), B.crust, {edge: 3, stroke: B.crustDark});
  for (let k = -2; k <= 2; k++) {
    const cx = x + Math.cos(a) * k * len * 0.18, cy = y + Math.sin(a) * k * len * 0.18;
    d += ink(`M${cx - 8 * s},${cy + 5 * s}L${cx + 8 * s},${cy - 5 * s}`, B.crumb, 4 * s);
  }
  return d;
};
export const roundBread = (x, y, r) =>
  piece(circ(x, y, r), B.crust, {edge: 3, stroke: B.crustDark}) +
  `<ellipse cx="${x - r * 0.3}" cy="${y - r * 0.35}" rx="${r * 0.35}" ry="${r * 0.2}" fill="#f2c27d" opacity="0.7"/>` +
  ink(`M${x - r * 0.5},${y}L${x + r * 0.5},${y}M${x},${y - r * 0.5}L${x},${y + r * 0.5}`, B.crumb, 3.5);
export const loaf = (x, y, w) =>
  piece(`M${x - w / 2},${y + 18}Q${x - w / 2},${y - 26} ${x},${y - 28}Q${x + w / 2},${y - 26} ${x + w / 2},${y + 18}Z`, '#e0a560', {edge: 3, stroke: B.crustDark}) +
  ink(`M${x - w * 0.3},${y - 10}Q${x},${y - 20} ${x + w * 0.3},${y - 10}`, B.crumb, 3);

// ---------- layers ----------
export const buildBakery = () => {
  const L = {};

  // sky: warm late-morning sky
  {
    const W = 1920, H = 1080;
    let s = `<rect width="${W}" height="${H}" fill="#d7ebf3"/>`;
    for (let i = 0; i < 7; i++) {
      const y = (i / 7) * H * 0.8;
      const R = rng(i + 40);
      const pts = [[-20, -20], [W + 20, -20]];
      for (let x = W + 20; x >= -20; x -= 180) pts.push([x, y + 100 + (R() - 0.5) * 30]);
      s += piece(poly(pts), mix('#a9d3ec', '#dcecf2', i / 7), {edge: 0, stroke: false});
    }
    s += `<circle cx="380" cy="160" r="150" fill="#fff6d8" opacity="0.5"/>`;
    s += piece(circ(380, 160, 76), '#fff1c2', {edge: 3, stroke: '#f3dc9c'});
    L.bakery_sky = [W, H, s];
  }

  // far background: hills + distant roofs + trees (tileable)
  {
    const H = 520;
    let s = '';
    const R = rng(301);
    const hill = (col, y0, amp, n, seed) => {
      const r = rng(seed);
      const pts = [];
      for (let k = 0; k <= n; k++) pts.push([(k * TILE) / n, y0 - (k % n === 0 ? amp * 0.5 : amp * (0.3 + r() * 0.7))]);
      return piece(smooth(pts, false) + `L${TILE},${H + 10}L0,${H + 10}Z`, col, {edge: 5, shadow: 'big', stroke: shade(col, 0.9)});
    };
    s += hill('#d6e6e2', 300, 170, 6, 3);
    s += hill('#bcdcc3', 380, 110, 8, 4);
    for (let x = 40; x < TILE - 60; x += 90 + R() * 80) {
      if (R() < 0.35) s += cherryTree(x, H - 20, 170, Math.round(x), 0.45);
      else {
        const w = 60 + R() * 60, h = 70 + R() * 60, col = mix(C.walls[Math.floor(R() * 6)], '#e2ecee', 0.25);
        s += piece(rrect(x, H - 20 - h, w, h, 3), col, {edge: 2});
        s += piece(poly([[x - 8, H - 16 - h], [x + w / 2, H - 20 - h - w * 0.5], [x + w + 8, H - 16 - h]]), mix(C.roofs[Math.floor(R() * 5)], '#e2ecee', 0.25), {edge: 2});
        s += piece(rrect(x + w / 2 - 8, H - h + 2, 16, 18, 3), '#fff3d0', {edge: 0, shadow: false, stroke: false});
      }
    }
    s += piece(`M0,${H - 24}H${TILE}V${H + 10}H0Z`, '#c4dcbc', {edge: 0});
    L.bakery_far_bg = [TILE, H, s];
  }

  // plaza ground in front of the shop (tileable cobblestones, no car lane)
  {
    const H = 320;
    let s = piece(`M0,0H${TILE}V${H}H0Z`, C.stone, {edge: 0, stroke: false, shadow: false});
    const R = rng(505);
    let row = 0;
    for (let y = 4; y < H; y += 30 + row * 1.5, row++) {
      const sw = TILE / Math.round(TILE / (52 + row * 8));
      for (let x = (row % 2) * sw * 0.5 - sw; x < TILE + sw; x += sw) {
        const col = mix(C.stone, R() < 0.2 ? '#f3c9c9' : C.stoneDark, 0.25 + R() * 0.4);
        s += piece(rrect(x + 3, y + 3, sw - 6, 24 + row * 1.5, 9), col, {edge: 2, shadow: false, stroke: shade(col, 0.9)});
      }
    }
    L.bakery_ground = [TILE, H, s];
  }

  // building: two-storey wooden cottage storefront (window / door areas are warm interior)
  {
    const W = 1300, H = 960, base = 940;
    let s = '';
    // chimney + roof
    s += piece(rrect(930, 30, 80, 180, 6), '#b9776c', {edge: 4});
    s += piece(rrect(918, 20, 104, 30, 6), '#a9675e', {edge: 3});
    s += piece(`M70,250L230,70H1070L1230,250Z`, B.roof, {edge: 6, shadow: 'big'});
    for (let k = 0; k < 4; k++) {
      const y = 100 + k * 40;
      const inset = 230 - ((y - 70) / 180) * 160;
      let d = `M${inset},${y}`;
      for (let x = inset; x < W - inset - 40; x += 44) d += `Q${x + 22},${y + 22} ${x + 44},${y}`;
      s += ink(d, shade(B.roof, 0.82), 3, {opacity: 0.8});
    }
    // upper floor (plaster + timber)
    s += piece(rrect(140, 240, 1020, 250, 6), B.plaster, {edge: 5, shadow: 'big'});
    for (const x of [140, 480, 820, 1150]) s += piece(rrect(x, 240, 12, 250, 3), B.woodDark, {edge: 2, shadow: false});
    s += piece(rrect(140, 240, 1020, 14, 3), B.woodDark, {edge: 2});
    for (const x of [250, 920]) {
      s += piece(rrect(x - 8, 300, 146, 126, 60), '#fffaf0', {edge: 3});
      s += piece(rrect(x, 308, 130, 110, 55), '#fde9b8', {edge: 0, shadow: false, stroke: '#e8cf98'});
      s += ink(`M${x + 65},308V418M${x},370H${x + 130}`, '#fffaf0', 6);
      s += piece(rrect(x - 16, 426, 162, 26, 6), B.wood, {edge: 3});
      for (let k = 0; k < 7; k++) s += flower5(x - 6 + k * 24, 420 - (k % 2) * 8, 9, k % 2 ? '#f6a6b8' : '#fff6ee');
    }
    // round hanging sign with a bread icon (no text)
    s += piece(capsule([640, 290], [640, 350], 8, 8), B.woodDark, {edge: 1});
    s += piece(circ(640, 380, 58), B.woodLight, {edge: 5, shadow: 'big'});
    s += piece(circ(640, 380, 46), '#fff6e6', {edge: 0, shadow: false});
    s += croissant(640, 386, 1.05);
    // lower storefront (wood)
    s += piece(rrect(100, 490, 1100, base - 490, 8), B.wood, {edge: 6, shadow: 'big'});
    for (let x = 120; x < 1190; x += 40) s += ink(`M${x},560V${base - 10}`, B.woodDark, 2, {opacity: 0.35});
    // display window opening (interior)
    s += piece(rrect(170, 620, 532, 292, 10), B.interior, {edge: 0, shadow: false, stroke: B.woodDark, sw: 4});
    s += `<rect x="170" y="620" width="532" height="90" rx="10" fill="${B.interiorDeep}" opacity="0.45"/>`;
    // pendant lamps inside
    for (const x of [300, 580]) {
      s += ink(`M${x},620V650`, '#6d4a33', 3);
      s += piece(`M${x - 24},664Q${x},636 ${x + 24},664Z`, '#6d4a33', {edge: 1, shadow: false});
      s += `<circle cx="${x}" cy="674" r="34" fill="#fff4c4" opacity="0.55"/>`;
    }
    // door opening
    s += piece(rrect(800, 610, 190, base - 606, 90), '#b87844', {edge: 0, shadow: false, stroke: B.woodDark, sw: 4});
    // step
    s += piece(rrect(770, base - 16, 250, 20, 6), '#e3d4bb', {edge: 3});
    // lanterns either side of the door
    for (const x of [760, 1030]) {
      s += piece(rrect(x - 3, 600, 6, 40, 3), '#5b4a3c', {edge: 1});
      s += piece(rrect(x - 18, 636, 36, 50, 8), '#fff0b8', {edge: 3, stroke: '#5b4a3c', sw: 4});
      s += `<circle cx="${x}" cy="660" r="46" fill="#fff0b8" opacity="0.35"/>`;
    }
    // awning with scallops
    s += piece(`M80,490H1220L1250,560H50Z`, '#fff7ee', {edge: 4, shadow: 'big'});
    for (let k = 0; k < 22; k += 2) {
      const a = 80 + (k * 1140) / 22, b = 80 + ((k + 1) * 1140) / 22;
      const a2 = 50 + (k * 1200) / 22, b2 = 50 + ((k + 1) * 1200) / 22;
      s += `<path d="M${a},490H${b}L${b2},560H${a2}Z" fill="${B.awning}"/>`;
    }
    let d = 'M50,558';
    for (let k = 0; k < 20; k++) d += `Q${50 + (k + 0.5) * 60},592 ${50 + (k + 1) * 60},558`;
    s += piece(d + 'Z', B.awning, {edge: 3});
    // side pots
    for (const x of [120, 1150]) {
      s += piece(scallop(x + 20, base - 90, 55, 60, 8, 0.2, x), C.leafDark, {edge: 3});
      for (let k = 0; k < 4; k++) s += flower5(x - 10 + k * 20, base - 120 + (k % 2) * 20, 8, '#fff');
      s += piece(`M${x - 20},${base - 60}H${x + 60}L${x + 52},${base}H${x - 12}Z`, '#d98f6f', {edge: 3});
    }
    L.bakery_building = [W, H, s];
  }

  // bread display: shelves of bread seen through the window
  {
    const W = 520, H = 290;
    let s = '';
    for (const y of [120, 250]) s += piece(rrect(0, y, W, 16, 4), B.woodDark, {edge: 3});
    s += piece(`M30,120L60,70H200L230,120Z`, '#f3e3c3', {edge: 2});
    for (let k = 0; k < 5; k++) s += croissant(70 + k * 34, 95 - (k % 2) * 8, 0.62);
    s += piece(rrect(270, 40, 220, 80, 12), '#d9b98e', {edge: 3});
    for (let k = 0; k < 4; k++) s += baguette(330 + k * 40, 70, 150, -70, 0.8);
    for (let k = 0; k < 4; k++) s += roundBread(60 + k * 62, 214, 26);
    s += loaf(340, 222, 90);
    s += loaf(450, 222, 80);
    L.bread_display = [W, H, s];
  }

  // window frame + glass sheen (goes over the bread display)
  {
    const W = 580, H = 344;
    let s = '';
    const fr = '#fffaf0';
    s += `<path d="M0,0H580V340H0Z M24,24V316H556V24Z" fill-rule="evenodd" fill="${fr}" filter="url(#psBig)" stroke="${shade(fr, 0.8)}" stroke-width="2"/>`;
    s += piece(rrect(283, 20, 14, 300, 4), fr, {edge: 3});
    s += piece(rrect(20, 164, 540, 12, 4), fr, {edge: 3});
    // glass sheen
    s += `<path d="M90,44L170,44L80,296L0,296Z" fill="#ffffff" opacity="0.28" transform="translate(44,0)"/>`;
    s += `<path d="M330,44L360,44L270,296L240,296Z" fill="#ffffff" opacity="0.22" transform="translate(44,0)"/>`;
    // sill with flowers
    s += piece(rrect(-4, 318, W + 8, 20, 6), B.woodLight, {edge: 3});
    L.bakery_window = [W, H, s];
  }

  // door
  {
    const W = 200, H = 340;
    let s = '';
    s += piece(rrect(8, 8, 184, 324, 90), '#a86a3c', {edge: 5, shadow: 'big', stroke: B.woodDark});
    s += piece(rrect(40, 40, 120, 110, 60), '#ffe9a8', {edge: 0, shadow: false, stroke: '#7a4f31', sw: 6});
    s += ink('M100,40V150M40,100H160', '#7a4f31', 5);
    s += piece(rrect(36, 180, 128, 120, 12), shade('#a86a3c', 0.92), {edge: 2, shadow: false});
    s += piece(circ(160, 200, 9), B.brass, {edge: 2});
    L.bakery_door = [W, H, s];
  }

  // door bell (swings when the girl arrives)
  {
    const W = 120, H = 150;
    let s = '';
    s += piece(rrect(20, 6, 80, 14, 6), '#5b4a3c', {edge: 2});
    s += ink('M60,20V40', '#5b4a3c', 4);
    s += piece(`M30,112Q28,44 60,40Q92,44 90,112Z`, B.brass, {edge: 3, stroke: '#b98a33'});
    s += piece(rrect(22, 106, 76, 12, 6), '#d9a847', {edge: 2});
    s += piece(circ(60, 126, 10), '#b98a33', {edge: 2});
    s += `<ellipse cx="48" cy="72" rx="7" ry="18" fill="#fff4cf" opacity="0.6"/>`;
    L.bakery_bell = [W, H, s];
  }

  // planters in front of the shop (they hide the girl's feet)
  {
    const W = 1500, H = 330;
    let s = '';
    for (const [x0, w] of [[20, 640], [820, 660]]) {
      const R = rng(x0 + 1);
      for (let k = 0; k < 9; k++) s += piece(scallop(x0 + 40 + k * (w - 80) / 8, 150 + R() * 30, 60, 55, 8, 0.2, k + x0), k % 2 ? C.leaf : C.leafDark, {edge: 3});
      for (let k = 0; k < 16; k++) s += g(flower5(x0 + 30 + k * (w - 60) / 15, 110 + R() * 70, 11 + R() * 5, ['#f6a6b8', '#fff7ef', '#ffd27a', '#c9b4e8'][k % 4]), '', 'filter="url(#ps)"');
      s += piece(rrect(x0, 200, w, 130, 12), B.woodLight, {edge: 6, shadow: 'big', stroke: B.woodDark});
      for (let x = x0 + 20; x < x0 + w - 20; x += 58) s += ink(`M${x},214V316`, B.woodDark, 2, {opacity: 0.35});
      s += piece(rrect(x0 - 10, 196, w + 20, 22, 6), B.wood, {edge: 3});
    }
    L.bakery_planters = [W, H, s];
  }

  // cafe table with two chairs, a cup and a croissant
  {
    const W = 640, H = 440;
    let s = '';
    const chair = (x, flip) => {
      const f = flip ? -1 : 1;
      let c = piece(rrect(x - 8, 140, 16, 300, 6), '#6f8f8a', {edge: 3});
      c += piece(rrect(x + (flip ? -110 : 0), 280, 110, 22, 8), '#7fa09a', {edge: 3});
      c += piece(rrect(x + (flip ? -100 : 90), 290, 12, 150, 5), '#6f8f8a', {edge: 2});
      c += piece(rrect(x - 30, 120, 60, 60, 26), '#7fa09a', {edge: 3});
      return c;
    };
    s += chair(70, false);
    s += chair(570, true);
    s += piece(rrect(310, 260, 20, 180, 6), '#5f7d78', {edge: 3});
    s += piece(ell(320, 432, 90, 12), '#5f7d78', {edge: 2});
    s += piece(ell(320, 256, 180, 26), '#fffaf2', {edge: 6, shadow: 'big'});
    s += piece(ell(260, 236, 50, 12), '#f2f2ee', {edge: 2});
    s += croissant(260, 224, 0.8);
    s += piece(`M360,200H410L404,244H366Z`, '#f7a9b5', {edge: 2});
    s += ink('M410,212Q428,214 424,228Q420,238 406,236', '#f7a9b5', 5);
    s += ink('M378,190Q372,176 382,166M394,190Q388,176 398,166', '#ffffff', 3, {opacity: 0.8});
    L.bakery_table = [W, H, s];
  }

  // A-frame sign board with bread pictograms (no text)
  {
    const W = 400, H = 560;
    let s = '';
    s += piece(`M60,540L140,40H260L340,540Z`, B.woodDark, {edge: 5, shadow: 'big'});
    s += piece(`M110,500L170,90H230L290,500Z`, '#5f6f68', {edge: 0, shadow: false, stroke: '#4c5a54'});
    s += ink('M150,160Q200,140 250,160', '#fffaf0', 4, {opacity: 0.85});
    s += baguette(200, 240, 120, -20, 0.8);
    s += croissant(200, 320, 0.95);
    s += roundBread(170, 410, 24);
    s += roundBread(232, 410, 24);
    s += ink('M140,460Q200,476 260,460', '#fffaf0', 4, {opacity: 0.85});
    s += piece(rrect(186, 20, 28, 30, 8), B.brass, {edge: 2});
    L.bakery_sign = [W, H, s];
  }

  // front-most flowers (daisies + tulips right at the lens)
  {
    const W = 1100, H = 640;
    let s = '';
    const R = rng(411);
    for (let i = 0; i < 10; i++) {
      const x = 60 + i * 105 + (R() - 0.5) * 30, top = 140 + R() * 220;
      s += piece(capsule([x, H + 20], [x + 6, top + 30], 16, 12), '#6ea56c', {edge: 2});
      s += piece(`M${x + 50},${H}Q${x + 100},${top + 150} ${x + 30},${top + 130}Q${x + 22},${top + 220} ${x + 6},${H}Z`, '#86b983', {edge: 3});
      if (i % 2) {
        let d = '';
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          d += piece(ell(x + Math.cos(a) * 34, top + Math.sin(a) * 34, 26, 11), '#fffaf2', {edge: 2, shadow: false, transform: `rotate(${(a * 180) / Math.PI},${x + Math.cos(a) * 34},${top + Math.sin(a) * 34})`});
        }
        s += g(d + piece(circ(x, top, 22), '#f4c95c', {edge: 3}), '', 'filter="url(#psBig)"');
      } else {
        const col = ['#f6a6b8', '#f38fa2', '#ffd27a'][i % 3];
        s += piece(`M${x - 44},${top + 40}Q${x - 50},${top - 30} ${x - 18},${top - 6}L${x + 10},${top - 44}L${x + 38},${top - 6}Q${x + 70},${top - 30} ${x + 64},${top + 40}Q${x + 10},${top + 96} ${x - 44},${top + 40}Z`, col, {edge: 5, shadow: 'big'});
      }
    }
    L.bakery_front_flowers = [W, H, s];
  }

  // front-most blossom branch hanging in from the top right
  {
    const W = 1700, H = 640;
    let s = '';
    s += piece(`M1720,30C1400,70 1050,150 700,260C480,330 260,380 40,470L60,500C280,420 500,370 720,300C1060,200 1400,110 1720,90Z`, '#86604a', {edge: 6, shadow: 'big', stroke: '#6a4a38'});
    s += piece(capsule([1000, 190], [900, 20], 22, 10), '#86604a', {edge: 3});
    const puffs = [[1600, 70, 110], [1350, 120, 120], [1100, 180, 110], [900, 40, 100], [880, 280, 105], [640, 300, 110], [420, 380, 95], [180, 440, 100]];
    puffs.forEach(([x, y, r], i) => (s += blossomPuff(x, y, r, i + 90)));
    L.bakery_front_branch = [W, H, s];
  }
  return L;
};
