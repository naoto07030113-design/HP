// Spring-town street: one PNG per depth layer.
// Layers that scroll continuously are generated seamlessly tileable (width TILE).
import {piece, ink, g, shade, mix, rng, circ, ell, rrect, poly, smooth, scallop, blob, capsule, clipped} from './paper.mjs';

export const TILE = 3840;
export const C = {
  sky: '#cfe6f3',
  skyTop: '#a9d3ec',
  cloud: '#fffdf8',
  hillFar: '#c5dccf',
  hillMid: '#a9cfb0',
  hillNear: '#94c29d',
  walls: ['#f7eedb', '#f6d9d2', '#d9ebdc', '#f8e8b8', '#d8e7f1', '#efdcc8'],
  roofs: ['#d7907b', '#8faac2', '#9fc09f', '#b88d6d', '#e0a3a8'],
  window: '#fff3cf',
  frame: '#fffaf0',
  wood: '#b98a62',
  woodDark: '#8d6446',
  blossom: '#f7c6d2',
  blossomDeep: '#f0a9bb',
  blossomLight: '#fde3ea',
  leaf: '#9cc79a',
  leafDark: '#7fb07f',
  stone: '#e8dcc6',
  stoneDark: '#d6c6aa',
  lane: '#dcd6d3',
  lamp: '#5f7d78',
};

/** Draw fn(x) at x, x-W, x+W so the strip tiles seamlessly. */
const wrap = (W, fn) => (x, ...a) => fn(x - W, ...a) + fn(x, ...a) + fn(x + W, ...a);

// ---------- reusable pieces ----------
export const blossomPuff = (cx, cy, r, seed = 1, o = {}) => {
  const R = rng(seed);
  let s = piece(scallop(cx, cy, r, r * 0.82, 9, 0.16, seed), o.base || C.blossom, {edge: 4, stroke: shade(o.base || C.blossom, 0.86)});
  s += piece(scallop(cx - r * 0.15, cy - r * 0.2, r * 0.62, r * 0.5, 7, 0.16, seed + 1), o.light || C.blossomLight, {edge: 2, shadow: false, stroke: false});
  for (let i = 0; i < Math.round(r / 9); i++) {
    const a = R() * Math.PI * 2, d = R() * r * 0.75;
    s += flower5(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, 3 + R() * 3, R() < 0.5 ? '#fff6f8' : C.blossomDeep);
  }
  return s;
};

export const flower5 = (x, y, r, col, center = '#f4cf6e') => {
  let s = '';
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    s += `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${(r * 0.72).toFixed(1)}" fill="${col}"/>`;
  }
  return s + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.45).toFixed(1)}" fill="${center}"/>`;
};

export const cherryTree = (x, base, h, seed = 1, scale = 1) => {
  const R = rng(seed);
  let s = '';
  const top = [x + (R() - 0.5) * 20, base - h * 0.62];
  s += piece(capsule([x, base], top, 34 * scale, 20 * scale), C.woodDark, {edge: 3});
  s += piece(capsule(top, [top[0] - 60 * scale, top[1] - 60 * scale], 16 * scale, 9 * scale), C.woodDark, {edge: 2});
  s += piece(capsule(top, [top[0] + 70 * scale, top[1] - 50 * scale], 16 * scale, 9 * scale), C.woodDark, {edge: 2});
  const puffs = [[-80, -40, 90], [70, -50, 95], [0, -110, 105], [-40, 10, 70], [60, 20, 70]];
  for (const [dx, dy, r] of puffs) s += blossomPuff(top[0] + dx * scale, top[1] + dy * scale, r * scale, seed * 7 + dx);
  return s;
};

const bushy = (cx, base, w, h, col, seed) =>
  piece(scallop(cx, base - h / 2, w / 2, h / 2, 8, 0.2, seed), col, {edge: 3, stroke: shade(col, 0.85)});

const windowEl = (x, y, w, h, o = {}) => {
  let s = piece(rrect(x - 6, y - 6, w + 12, h + 12, o.arch ? w / 2 : 5), C.frame, {edge: 2});
  s += piece(rrect(x, y, w, h, o.arch ? w / 2 - 4 : 3), o.lit || C.window, {edge: 0, shadow: false, stroke: shade(C.window, 0.8)});
  s += ink(`M${x + w / 2},${y + (o.arch ? w / 3 : 0)}V${y + h}M${x},${y + h / 2}H${x + w}`, C.frame, 4);
  if (o.box) {
    s += piece(rrect(x - 8, y + h + 4, w + 16, 16, 4), C.wood, {edge: 2});
    for (let i = 0; i < 5; i++) s += flower5(x - 2 + (i * (w + 4)) / 4, y + h + 2, 5, i % 2 ? '#f6a6b8' : '#fff4f0');
  }
  if (o.shutter) {
    s += piece(rrect(x - 22, y - 4, 14, h + 8, 3), o.shutter, {edge: 2});
    s += piece(rrect(x + w + 8, y - 4, 14, h + 8, 3), o.shutter, {edge: 2});
  }
  return s;
};

export const house = (x, base, w, h, i, seed = 1) => {
  const R = rng(seed);
  const wall = C.walls[i % C.walls.length], roof = C.roofs[i % C.roofs.length];
  let s = '';
  const roofH = h * 0.42;
  // chimney
  if (R() < 0.6) s += piece(rrect(x + w * 0.62, base - h - roofH * 0.8, 26, roofH * 0.7, 3), shade(roof, 0.85), {edge: 2});
  s += piece(rrect(x, base - h, w, h, 6), wall, {edge: 4, shadow: 'big'});
  // roof
  const style = i % 3;
  if (style === 0) s += piece(poly([[x - 18, base - h + 8], [x + w / 2, base - h - roofH], [x + w + 18, base - h + 8]]), roof, {edge: 4});
  else if (style === 1) s += piece(`M${x - 16},${base - h + 8}L${x + 14},${base - h - roofH * 0.7}H${x + w - 14}L${x + w + 16},${base - h + 8}Z`, roof, {edge: 4});
  else s += piece(`M${x - 16},${base - h + 10}Q${x + w / 2},${base - h - roofH * 1.25} ${x + w + 16},${base - h + 10}Z`, roof, {edge: 4});
  // roof tile lines
  for (let k = 1; k < 3; k++) s += ink(`M${x + 6},${base - h - (roofH * k) / 4}H${x + w - 6}`, shade(roof, 0.85), 2, {opacity: 0.6});
  // windows
  const cols = Math.max(1, Math.round(w / 110));
  for (let c = 0; c < cols; c++) {
    const wx = x + ((c + 0.5) * w) / cols - 22;
    s += windowEl(wx, base - h + h * 0.18, 44, 54, {box: R() < 0.6, shutter: R() < 0.4 ? shade(roof, 1.25) : null, arch: style === 2});
  }
  // door
  const dx = x + w * (R() < 0.5 ? 0.22 : 0.62);
  s += piece(rrect(dx, base - 92, 50, 92, 22), shade(roof, 0.95), {edge: 3});
  s += piece(circ(dx + 40, base - 46, 4), '#f1d27a', {edge: 1, shadow: false});
  s += piece(rrect(dx - 8, base - 8, 66, 10, 3), C.stoneDark, {edge: 2});
  return s;
};

const awning = (x, y, w, col) => {
  let s = piece(`M${x - 10},${y}H${x + w + 10}L${x + w + 22},${y + 44}H${x - 22}Z`, '#fffaf2', {edge: 3});
  const n = Math.round(w / 34);
  for (let k = 0; k < n; k += 2) {
    const a = x - 10 + (k * (w + 20)) / n, b = x - 10 + ((k + 1) * (w + 20)) / n;
    const a2 = x - 22 + (k * (w + 44)) / n, b2 = x - 22 + ((k + 1) * (w + 44)) / n;
    s += `<path d="M${a},${y}H${b}L${b2},${y + 44}H${a2}Z" fill="${col}"/>`;
  }
  // scalloped valance
  let d = `M${x - 22},${y + 42}`;
  const sc = Math.round((w + 44) / 30);
  for (let k = 0; k < sc; k++) {
    const x0 = x - 22 + (k * (w + 44)) / sc, x1 = x - 22 + ((k + 1) * (w + 44)) / sc;
    d += `Q${(x0 + x1) / 2},${y + 64} ${x1},${y + 42}`;
  }
  s += piece(d + 'Z', col, {edge: 2});
  return s;
};

export const shop = (x, base, w, h, i, seed = 1) => {
  const R = rng(seed);
  const wall = C.walls[(i + 2) % C.walls.length];
  const accent = ['#e89aa6', '#8fbcd9', '#9fcf9c', '#f0c46e'][i % 4];
  let s = '';
  s += piece(rrect(x, base - h, w, h, 6), wall, {edge: 4, shadow: 'big'});
  s += piece(rrect(x - 12, base - h - 26, w + 24, 34, 6), shade(wall, 0.9), {edge: 3});
  // upper windows
  s += windowEl(x + w * 0.2, base - h + 40, 40, 48, {box: true});
  s += windowEl(x + w * 0.68 - 20, base - h + 40, 40, 48, {box: R() < 0.7});
  // blank sign board with an icon (no text)
  const sy = base - h * 0.5 - 30;
  s += piece(rrect(x + w / 2 - 70, sy - 20, 140, 40, 18), '#fffaf2', {edge: 3});
  const icon = i % 3;
  if (icon === 0) s += piece(`M${x + w / 2 - 12},${sy - 10}H${x + w / 2 + 12}L${x + w / 2 + 9},${sy + 10}H${x + w / 2 - 9}Z`, accent, {edge: 1, shadow: false}); // cup
  else if (icon === 1) s += flower5(x + w / 2, sy, 8, accent);
  else s += piece(circ(x + w / 2, sy, 10), accent, {edge: 1, shadow: false});
  s += awning(x + 10, base - h * 0.5, w - 20, accent);
  // shop window + door
  s += piece(rrect(x + 18, base - h * 0.5 + 72, w * 0.55, h * 0.5 - 90, 6), '#fff0cc', {edge: 2, stroke: C.frame, sw: 6});
  s += ink(`M${x + 18 + w * 0.275},${base - h * 0.5 + 72}V${base - 18}`, C.frame, 5);
  s += piece(rrect(x + w * 0.66, base - 110, 54, 110, 24), shade(accent, 0.9), {edge: 3});
  // pots
  s += piece(rrect(x + 8, base - 34, 30, 34, 6), '#d98f6f', {edge: 2});
  s += bushy(x + 23, base - 30, 50, 50, C.leaf, seed + 3);
  return s;
};

// ---------- layers ----------
export const buildStreet = () => {
  const L = {};

  // sky (static): soft gradient built from overlapping torn paper bands
  {
    const W = 1920, H = 1080;
    let s = `<rect width="${W}" height="${H}" fill="${C.sky}"/>`;
    const bands = 7;
    for (let i = 0; i < bands; i++) {
      const y = (i / bands) * H * 0.75;
      const col = mix(C.skyTop, C.sky, i / bands);
      const R = rng(i + 3);
      const pts = [[-20, -20], [W + 20, -20]];
      for (let x = W + 20; x >= -20; x -= 160) pts.push([x, y + 90 + (R() - 0.5) * 26]);
      s += piece(poly(pts), col, {edge: 0, stroke: false, shadow: true});
    }
    // sun
    s += `<circle cx="1560" cy="170" r="150" fill="#fff8df" opacity="0.5"/>`;
    s += piece(circ(1560, 170, 78), '#fff4c9', {edge: 3, stroke: '#f5e2a8'});
    L.sky = [W, H, s];
  }

  // clouds (tileable, very slow)
  {
    const H = 460;
    const cloud = wrap(TILE, (x, y, w, seed) =>
      piece(scallop(x, y, w, w * 0.34, 11, 0.2, seed), C.cloud, {edge: 5, stroke: '#e6eef2', shadow: 'big'}) +
      piece(scallop(x - w * 0.15, y + w * 0.12, w * 0.55, w * 0.16, 8, 0.2, seed + 9), '#eef5f8', {edge: 0, stroke: false, shadow: false}),
    );
    const list = [[260, 140, 190], [900, 250, 130], [1500, 110, 230], [2250, 230, 150], [2900, 120, 200], [3500, 280, 120]];
    L.clouds = [TILE, H, list.map(([x, y, w], i) => cloud(x, y, w, i + 1)).join('')];
  }

  // mountains / hills (tileable)
  {
    const H = 440;
    const ridge = (col, baseY, amp, period, seed) => {
      const R = rng(seed);
      const pts = [];
      const n = TILE / period;
      const offs = Array.from({length: n}, () => (R() - 0.5) * amp * 0.5);
      for (let k = 0; k <= n * 2; k++) {
        const x = (k * period) / 2;
        const peak = k % 2 === 1;
        const y = peak ? baseY - amp + offs[((k - 1) / 2) % n] : baseY - amp * 0.25;
        pts.push([x, y]);
      }
      const d = smooth(pts, false) + `L${TILE},${H + 10}L0,${H + 10}Z`;
      return piece(d, col, {edge: 5, shadow: 'big', stroke: shade(col, 0.9)});
    };
    let s = ridge('#d4e3e6', 250, 200, 960, 2);
    s += ridge(C.hillFar, 330, 150, 640, 5);
    s += ridge(C.hillMid, 400, 110, 480, 9);
    L.mountains = [TILE, H, s];
  }

  // far town (tileable)
  {
    const H = 300;
    const R = rng(21);
    let s = '';
    const mini = wrap(TILE, (x, w, h, col, roof) =>
      piece(rrect(x, H - h, w, h, 3), col, {edge: 2}) +
      piece(poly([[x - 6, H - h + 4], [x + w / 2, H - h - w * 0.45], [x + w + 6, H - h + 4]]), roof, {edge: 2}) +
      piece(rrect(x + w / 2 - 6, H - h + 14, 12, 14, 2), '#fff2cf', {edge: 0, shadow: false, stroke: false}),
    );
    const tree = wrap(TILE, (x, r, col) => piece(capsule([x, H], [x, H - r * 1.6], 8, 5), C.woodDark, {edge: 1}) + piece(scallop(x, H - r * 1.9, r, r * 0.85, 7, 0.15, Math.round(x)), col, {edge: 2}));
    for (let x = 20; x < TILE; x += 70 + R() * 70) {
      if (R() < 0.3) s += tree(x, 24 + R() * 14, R() < 0.5 ? C.blossom : C.leaf);
      else s += mini(x, 46 + R() * 30, 50 + R() * 60, mix(C.walls[Math.floor(R() * 6)], '#dfe9ee', 0.35), mix(C.roofs[Math.floor(R() * 5)], '#dfe9ee', 0.35));
    }
    s += piece(`M0,${H - 12}H${TILE}V${H + 10}H0Z`, '#b9d6b8', {edge: 0});
    L.far_town = [TILE, H, s];
  }

  // houses (tileable, behind the street shops)
  {
    const H = 620, base = 610;
    let s = '';
    const hs = wrap(TILE, house);
    const tr = wrap(TILE, cherryTree);
    const spots = [[80, 240, 300], [560, 200, 340], [1080, 260, 280], [1650, 220, 320], [2250, 250, 300], [2800, 210, 330], [3350, 230, 290]];
    spots.forEach(([x, w, h], i) => (s += hs(x, base, w, h, i, i + 40)));
    for (const x of [430, 1440, 2600, 3700]) s += tr(x, base, 380, Math.round(x / 10), 1);
    s += piece(`M0,${base - 6}H${TILE}V${H}H0Z`, '#cfe3c6', {edge: 0});
    L.houses = [TILE, H, s];
  }

  // street shops (tileable, nearer mid-ground)
  {
    const H = 560, base = 550;
    let s = '';
    const sh = wrap(TILE, shop);
    const bush = wrap(TILE, (x, w, h, seed) => bushy(x, base, w, h, C.leafDark, seed) + bushy(x + w * 0.3, base, w * 0.6, h * 0.7, C.leaf, seed + 1));
    const spots = [[150, 300, 420], [900, 280, 400], [1700, 320, 440], [2500, 290, 410], [3250, 300, 430]];
    spots.forEach(([x, w, h], i) => (s += sh(x, base, w, h, i, 70 + i)));
    for (const x of [600, 1400, 2250, 3000, 3720]) s += bush(x, 160, 110, x);
    L.street_shops = [TILE, H, s];
  }

  // road: back lane + curb + cobblestone sidewalk (tileable)
  {
    const H = 360;
    let s = '';
    s += piece(`M0,0H${TILE}V${H}H0Z`, C.stone, {edge: 0, stroke: false, shadow: false});
    s += piece(`M-10,6H${TILE + 10}V120H-10Z`, C.lane, {edge: 0, stroke: false, shadow: false});
    // lane dashes
    for (let x = 0; x < TILE; x += 240) s += piece(rrect(x + 40, 58, 120, 10, 5), '#f5f2ea', {edge: 1, shadow: false, stroke: false});
    // curb
    s += piece(`M-10,118H${TILE + 10}V146H-10Z`, '#efe7d8', {edge: 5, shadow: 'big'});
    for (let x = 0; x < TILE; x += 96) s += ink(`M${x},120V144`, '#d7ccb8', 2);
    // cobblestones
    const R = rng(77);
    let row = 0;
    for (let y = 160; y < H; y += 34, row++) {
      const sw = TILE / Math.round(TILE / (58 + row * 7));
      for (let x = (row % 2) * sw * 0.5 - sw; x < TILE + sw; x += sw) {
        const col = mix(C.stone, R() < 0.25 ? '#f3c9c9' : C.stoneDark, 0.3 + R() * 0.4);
        s += piece(rrect(x + 3, y + 3, sw - 6, 28 + row * 0.8, 9), col, {edge: 2, shadow: false, stroke: shade(col, 0.9)});
      }
    }
    // make the tile seamless: stones at the seam are drawn on both sides by using a period of TILE
    L.road = [TILE, H, s];
  }

  // ---------- foreground objects (in front of the girl) ----------
  // fg_flowers: low flower bed with tulips and daisies
  {
    const W = 760, H = 330;
    let s = '';
    s += piece(`M20,${H}Q20,210 120,200Q380,170 640,200Q740,210 740,${H}Z`, '#8fbf88', {edge: 4, shadow: 'big'});
    const R = rng(8);
    for (let i = 0; i < 16; i++) {
      const x = 50 + i * 43 + (R() - 0.5) * 16, top = 70 + R() * 90;
      s += piece(capsule([x, H], [x, top + 20], 8, 6), '#6fa56d', {edge: 1});
      s += piece(ell(x + 16, top + 70, 16, 7), '#7fb07f', {edge: 1, transform: `rotate(-30,${x + 16},${top + 70})`});
      const col = ['#f6a6b8', '#ffd479', '#fffaf2', '#f28f9e', '#c9b4e8'][i % 5];
      if (i % 2) s += piece(`M${x - 18},${top + 10}Q${x - 20},${top - 22} ${x - 8},${top - 14}L${x},${top - 28}L${x + 8},${top - 14}Q${x + 20},${top - 22} ${x + 18},${top + 10}Q${x},${top + 30} ${x - 18},${top + 10}Z`, col, {edge: 3});
      else s += g(flower5(x, top, 15, col), '', 'filter="url(#ps)"');
    }
    L.fg_flowers = [W, H, s];
  }
  // fg_fence: white picket fence segment with grass
  {
    const W = 1400, H = 300;
    let s = '';
    s += piece(rrect(0, 150, W, 22, 6), '#fffaf2', {edge: 3});
    s += piece(rrect(0, 225, W, 22, 6), '#fffaf2', {edge: 3});
    for (let x = 20; x < W - 20; x += 64) s += piece(`M${x},${H}V90L${x + 20},62L${x + 40},90V${H}Z`, '#fffdf7', {edge: 4, shadow: 'big'});
    const R = rng(12);
    for (let x = 0; x < W; x += 60) s += bushy(x + 30, H + 10, 90 + R() * 40, 70 + R() * 40, R() < 0.5 ? C.leaf : C.leafDark, x + 1);
    for (let x = 40; x < W; x += 110) s += flower5(x + R() * 30, 250 + R() * 20, 10, R() < 0.5 ? '#fff' : '#f7b6c6');
    L.fg_fence = [W, H, s];
  }
  // fg_bench: wooden bench
  {
    const W = 640, H = 330;
    let s = '';
    for (const x of [90, 520]) s += piece(rrect(x, 180, 26, 150, 6), '#6e7f7c', {edge: 3});
    for (let k = 0; k < 3; k++) s += piece(rrect(40, 60 + k * 38, 560, 28, 8), C.wood, {edge: 4, shadow: 'big'});
    s += piece(rrect(30, 190, 580, 30, 8), shade(C.wood, 1.08), {edge: 5, shadow: 'big'});
    s += piece(rrect(60, 222, 520, 16, 6), C.woodDark, {edge: 2});
    L.fg_bench = [W, H, s];
  }
  // fg_planters: two terracotta planters with round shrubs
  {
    const W = 820, H = 380;
    let s = '';
    for (const [x, r] of [[190, 120], [590, 105]]) {
      s += bushy(x, 240, r * 2, r * 1.7, C.leafDark, x);
      s += bushy(x + 10, 230, r * 1.4, r * 1.1, C.leaf, x + 1);
      for (let k = 0; k < 6; k++) s += flower5(x - r * 0.6 + k * r * 0.25, 120 + (k % 2) * 40, 9, k % 2 ? '#f6a6b8' : '#fff');
      s += piece(`M${x - 110},220H${x + 110}L${x + 90},${H}H${x - 90}Z`, '#d98f6f', {edge: 5, shadow: 'big'});
      s += piece(rrect(x - 120, 210, 240, 30, 8), '#e3a283', {edge: 3});
    }
    L.fg_planters = [W, H, s];
  }

  // ---------- front-most objects (closest to camera, big, cropped by frame) ----------
  // front_tree: thick cherry trunk (used to hide the girl for a moment)
  {
    const W = 900, H = 1500;
    let s = '';
    s += piece(`M300,${H}C320,1100 340,800 360,500C300,380 180,300 60,260L90,210C200,250 300,320 400,400C430,300 470,200 560,100L610,140C540,240 500,340 480,460C560,380 700,330 840,320L850,380C700,400 580,470 520,560C540,900 560,1200 600,${H}Z`, '#8a6148', {edge: 8, shadow: 'big', stroke: '#6f4c38'});
    s += ink(`M380,${H - 50}C390,1100 400,900 420,700`, '#a07558', 8, {opacity: 0.7});
    s += ink(`M470,${H - 200}C480,1100 470,900 480,720`, '#6f4c38', 5, {opacity: 0.6});
    for (const [x, y, r, k] of [[80, 230, 130, 1], [300, 120, 150, 2], [560, 90, 140, 3], [800, 300, 140, 4], [450, 330, 120, 5]]) s += blossomPuff(x, y, r, k + 30);
    L.front_tree = [W, H, s];
  }
  // front_branch: branch reaching in from the top edge with blossom clusters
  {
    const W = 1900, H = 720;
    let s = '';
    s += piece(`M-20,40C300,80 700,160 1100,260C1400,330 1650,420 1880,560L1860,590C1640,470 1400,380 1090,300C700,210 300,130 -20,100Z`, '#86604a', {edge: 6, shadow: 'big', stroke: '#6a4a38'});
    s += piece(capsule([600, 175], [760, 420], 26, 12), '#86604a', {edge: 4});
    s += piece(capsule([1200, 300], [1300, 90], 24, 10), '#86604a', {edge: 4});
    const puffs = [[120, 90, 110], [380, 140, 120], [620, 230, 110], [760, 430, 95], [920, 230, 120], [1300, 90, 100], [1200, 350, 110], [1500, 420, 105], [1760, 540, 110]];
    puffs.forEach(([x, y, r], i) => (s += blossomPuff(x, y, r, i + 50)));
    L.front_branch = [W, H, s];
  }
  // front_lamp: tall street lamp post (passes very close to the camera)
  {
    const W = 380, H = 1400;
    let s = '';
    s += piece(rrect(160, 300, 50, H - 300, 20), C.lamp, {edge: 6, shadow: 'big'});
    s += piece(rrect(130, H - 160, 110, 160, 20), shade(C.lamp, 0.9), {edge: 5});
    s += piece(rrect(140, 560, 90, 34, 12), shade(C.lamp, 1.15), {edge: 3});
    s += piece(`M100,300H270L240,150H130Z`, '#fff4c9', {edge: 3, stroke: C.lamp, sw: 8});
    s += piece(`M80,160H290L185,50Z`, C.lamp, {edge: 5});
    s += piece(circ(185, 44, 16), C.lamp, {edge: 3});
    s += piece(rrect(90, 300, 190, 26, 10), C.lamp, {edge: 4});
    // hanging flower basket
    s += ink('M210,640Q290,650 300,700', C.lamp, 6);
    s += piece(`M250,700H350Q345,760 300,768Q255,760 250,700Z`, C.wood, {edge: 3});
    for (let k = 0; k < 5; k++) s += flower5(258 + k * 22, 696 - (k % 2) * 10, 10, k % 2 ? '#f6a6b8' : '#fff8f0');
    L.front_lamp = [W, H, s];
  }
  // front_flowers: large tulips right at the lens
  {
    const W = 1000, H = 620;
    let s = '';
    const R = rng(91);
    for (let i = 0; i < 9; i++) {
      const x = 60 + i * 110 + (R() - 0.5) * 30, top = 120 + R() * 200;
      s += piece(capsule([x, H + 20], [x + 10, top + 40], 18, 14), '#6ea56c', {edge: 2});
      s += piece(`M${x - 50},${H}Q${x - 90},${top + 140} ${x - 30},${top + 120}Q${x - 20},${top + 200} ${x - 10},${H}Z`, '#86b983', {edge: 3});
      const col = ['#f6a6b8', '#fff4ec', '#f38fa2', '#ffd27a'][i % 4];
      s += piece(`M${x - 44},${top + 40}Q${x - 50},${top - 30} ${x - 18},${top - 6}L${x + 10},${top - 44}L${x + 38},${top - 6}Q${x + 70},${top - 30} ${x + 64},${top + 40}Q${x + 10},${top + 96} ${x - 44},${top + 40}Z`, col, {edge: 5, shadow: 'big'});
      s += ink(`M${x + 10},${top - 30}V${top + 50}`, shade(col, 0.85), 3, {opacity: 0.6});
    }
    L.front_flowers = [W, H, s];
  }
  // transition_tree: a huge blossom-covered tree that sweeps past the lens and
  // fully covers the frame for a moment (used as the street -> bakery wipe)
  {
    const W = 2700, H = 1500;
    let s = '';
    s += piece(`M1050,${H}C1080,1150 1120,900 1150,700L1550,700C1580,900 1620,1150 1650,${H}Z`, '#8a6148', {edge: 10, shadow: 'big'});
    const R = rng(123);
    const puffs = [];
    for (let row = 0; row < 7; row++) for (let col = 0; col < 11; col++) {
      const x = 130 + col * 245 + (R() - 0.5) * 90 + (row % 2) * 110;
      const y = 120 + row * 185 + (R() - 0.5) * 60;
      // keep the bottom middle open around the trunk only near the bottom row
      puffs.push([x, y, 190 + R() * 70, row * 20 + col]);
    }
    for (const [x, y, r, k] of puffs) s += blossomPuff(x, y, r, k + 200, {base: [C.blossom, C.blossomDeep, '#f9d4de'][k % 3]});
    L.transition_tree = [W, H, s];
  }
  return L;
};
