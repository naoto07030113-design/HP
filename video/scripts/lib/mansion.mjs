// Haunted-mansion hallway, one PNG per depth layer (dark papercraft palette).
import {piece, ink, g, shade, mix, rng, circ, ell, rrect, poly, smooth, scallop, capsule} from './paper.mjs';

export const TILE = 3840;
const M = {
  wall: '#3d3764',
  wallDark: '#2f2a50',
  damask: '#4a4378',
  molding: '#2a2442',
  wood: '#4e3528',
  woodLight: '#6a4a36',
  woodDark: '#35231a',
  gold: '#d9b25a',
  goldDark: '#a88237',
  carpet: '#8c2e3c',
  carpetDark: '#6d2230',
  night: '#27406e',
  nightDeep: '#1b2c52',
  moon: '#fff4c9',
  curtain: '#6b2c4a',
  curtainDark: '#50203a',
  candle: '#f6ecd6',
  flame: '#ffd86b',
  stone: '#8e8aa3',
};
const wrap = (W, fn) => (x, ...a) => fn(x - W, ...a) + fn(x, ...a) + fn(x + W, ...a);

const fleur = (x, y, col) =>
  `<path d="M${x},${y - 18}C${x + 10},${y - 6} ${x + 12},${y + 4} ${x},${y + 16}C${x - 12},${y + 4} ${x - 10},${y - 6} ${x},${y - 18}Z M${x - 16},${y + 2}Q${x - 8},${y - 6} ${x - 4},${y + 6} M${x + 16},${y + 2}Q${x + 8},${y - 6} ${x + 4},${y + 6}" fill="${col}" stroke="${col}" stroke-width="3"/>`;

const candleFlame = (x, y, s = 1) =>
  `<ellipse cx="${x}" cy="${y - 10 * s}" rx="${22 * s}" ry="${26 * s}" fill="${M.flame}" opacity="0.25"/>` +
  piece(`M${x},${y - 22 * s}Q${x + 8 * s},${y - 8 * s} ${x},${y}Q${x - 8 * s},${y - 8 * s} ${x},${y - 22 * s}Z`, M.flame, {edge: 0, shadow: false, stroke: '#f0a93a'});

const frame = (x, y, w, h, inner) => {
  let s = piece(rrect(x - 18, y - 18, w + 36, h + 36, 10), M.gold, {edge: 5, stroke: M.goldDark, shadow: 'big'});
  s += piece(rrect(x - 8, y - 8, w + 16, h + 16, 6), shade(M.gold, 0.85), {edge: 0, shadow: false});
  for (const [cx, cy] of [[x - 10, y - 10], [x + w + 10, y - 10], [x - 10, y + h + 10], [x + w + 10, y + h + 10]]) s += piece(circ(cx, cy, 10), shade(M.gold, 1.1), {edge: 2});
  s += piece(rrect(x, y, w, h, 4), inner, {edge: 0, shadow: false, stroke: M.goldDark});
  return s;
};

export const buildMansion = () => {
  const L = {};

  // back wall: wallpaper + wainscot + arched moonlit windows (tileable)
  {
    const H = 860;
    let s = `<rect width="${TILE}" height="${H}" fill="${M.wall}"/>`;
    for (let y = 60; y < 560; y += 90) for (let x = (y / 90) % 2 ? 60 : 0; x < TILE; x += 120) s += fleur(x, y, M.damask);
    s += piece(`M0,0H${TILE}V46H0Z`, M.molding, {edge: 5, shadow: 'big'});
    s += piece(`M0,40H${TILE}V58H0Z`, shade(M.molding, 1.2), {edge: 2});
    // wainscot
    s += piece(`M0,560H${TILE}V${H}H0Z`, M.wood, {edge: 0, stroke: false});
    s += piece(`M0,548H${TILE}V574H0Z`, M.woodLight, {edge: 4, shadow: 'big'});
    for (let x = 30; x < TILE; x += 240) s += piece(rrect(x, 600, 190, 190, 8), shade(M.wood, 1.08), {edge: 3, stroke: M.woodDark});
    s += piece(`M0,820H${TILE}V${H}H0Z`, M.woodDark, {edge: 3});
    // windows
    const win = wrap(TILE, (x) => {
      let w = '';
      const top = 110, wd = 240, ht = 380;
      w += piece(`M${x - 24},${top + ht + 24}V${top + wd / 2}A${wd / 2 + 24},${wd / 2 + 24} 0 0,1 ${x + wd + 24},${top + wd / 2}V${top + ht + 24}Z`, M.woodDark, {edge: 5, shadow: 'big'});
      w += piece(`M${x},${top + ht}V${top + wd / 2}A${wd / 2},${wd / 2} 0 0,1 ${x + wd},${top + wd / 2}V${top + ht}Z`, M.night, {edge: 0, shadow: false});
      w += `<path d="M${x},${top + ht}V${top + ht * 0.6}H${x + wd}V${top + ht}Z" fill="${M.nightDeep}" opacity="0.6"/>`;
      w += piece(circ(x + wd * 0.66, top + 110, 42), M.moon, {edge: 0, shadow: false, stroke: '#f0dd9c'});
      w += piece(circ(x + wd * 0.66 + 18, top + 98, 38), M.night, {edge: 0, shadow: false, stroke: false});
      const R = rng(Math.round(x) + 5);
      for (let k = 0; k < 9; k++) w += `<circle cx="${x + 20 + R() * (wd - 40)}" cy="${top + 60 + R() * 200}" r="${1.5 + R() * 2}" fill="#fff8dc"/>`;
      // spooky tree silhouette
      w += piece(`M${x + 30},${top + ht}L${x + 50},${top + 250}L${x + 20},${top + 190}L${x + 56},${top + 232}L${x + 70},${top + 160}L${x + 76},${top + 240}L${x + 110},${top + 200}L${x + 80},${top + 268}L${x + 90},${top + ht}Z`, '#141c33', {edge: 0, shadow: false, stroke: false});
      w += ink(`M${x + wd / 2},${top + 8}V${top + ht}M${x},${top + 250}H${x + wd}`, M.woodDark, 10);
      // curtains
      for (const side of [-1, 1]) {
        const cx = side < 0 ? x - 40 : x + wd + 40;
        w += piece(`M${cx - 50},${top - 30}H${cx + 50}Q${cx + side * -10},${top + 200} ${cx + side * 30},${top + ht + 40}L${cx - side * 60},${top + ht + 40}Q${cx - side * 30},${top + 200} ${cx - 50},${top - 30}Z`, M.curtain, {edge: 4, stroke: M.curtainDark, shadow: 'big'});
        w += ink(`M${cx - side * 10},${top}Q${cx + side * 5},${top + 200} ${cx + side * 10},${top + ht + 30}`, M.curtainDark, 4, {opacity: 0.7});
        w += piece(rrect(cx - 30, top + 230, 60, 18, 8), M.gold, {edge: 2});
      }
      w += piece(rrect(x - 90, top - 44, wd + 180, 24, 10), M.goldDark, {edge: 3});
      return w;
    });
    for (const x of [320, 1600, 2880]) s += win(x);
    L.mansion_wall = [TILE, H, s];
  }

  // floor: dark planks + red carpet runner (tileable)
  {
    const H = 320;
    let s = `<rect width="${TILE}" height="${H}" fill="${M.woodLight}"/>`;
    for (let y = 0; y < H; y += 40) {
      s += ink(`M0,${y}H${TILE}`, M.woodDark, 3, {opacity: 0.7});
      for (let x = (y / 40) % 2 ? 0 : 160; x < TILE; x += 320) s += ink(`M${x},${y}V${y + 40}`, M.woodDark, 3, {opacity: 0.6});
    }
    s += piece(`M-10,110H${TILE + 10}V250H-10Z`, M.carpet, {edge: 4, shadow: 'big', stroke: M.carpetDark});
    s += ink(`M-10,124H${TILE + 10}M-10,236H${TILE + 10}`, M.gold, 5, {opacity: 0.9});
    for (let x = 0; x < TILE; x += 96) s += piece(poly([[x + 48, 150], [x + 70, 180], [x + 48, 210], [x + 26, 180]]), M.carpetDark, {edge: 0, shadow: false, stroke: false});
    L.mansion_floor = [TILE, H, s];
  }

  // ---------- wall props (hang on the back wall) ----------
  // stern cat noble portrait
  {
    const W = 300, H = 380;
    let s = frame(30, 30, 240, 320, '#3f5a4a');
    s += piece(`M60,350Q70,250 150,240Q230,250 240,350Z`, '#5b2b45', {edge: 2});
    s += piece(scallop(150, 250, 70, 22, 12, 0.2, 3), '#f3eee4', {edge: 2});
    s += piece(poly([[92, 150], [100, 80], [130, 120]]), '#7a7a88', {edge: 2});
    s += piece(poly([[208, 150], [200, 80], [170, 120]]), '#7a7a88', {edge: 2});
    s += piece(ell(150, 170, 68, 62), '#8a8a98', {edge: 3});
    s += ink('M118,160L140,166M160,166L182,160', '#1d1d24', 5);
    s += `<circle cx="130" cy="176" r="6" fill="#e8d36a"/><circle cx="170" cy="176" r="6" fill="#e8d36a"/>`;
    s += ink('M150,196L150,204M138,212Q150,206 162,212', '#1d1d24', 3);
    s += ink('M100,196H74M100,204H76M200,196H226M200,204H224', '#dcdce4', 2);
    L.portrait_cat = [W, H, s];
  }
  // landscape painting
  {
    const W = 420, H = 300;
    let s = frame(30, 30, 360, 240, '#2e4a66');
    s += piece(`M30,210Q120,130 200,190Q280,120 390,200V270H30Z`, '#35584a', {edge: 2});
    s += piece(`M250,120L280,70L310,120Z M262,120V160H298V120Z`, '#1f2a36', {edge: 1});
    s += piece(circ(100, 90, 22), M.moon, {edge: 1});
    L.portrait_land = [W, H, s];
  }
  // owl portrait — the one that falls
  {
    const W = 320, H = 400;
    let s = frame(30, 30, 260, 340, '#4d3b5c');
    s += piece(smooth([[90, 350], [80, 220], [110, 130], [160, 110], [210, 130], [240, 220], [230, 350]]), '#8c6a4a', {edge: 3});
    s += piece(poly([[110, 140], [100, 90], [140, 125]]), '#6d5238', {edge: 2});
    s += piece(poly([[210, 140], [220, 90], [180, 125]]), '#6d5238', {edge: 2});
    for (const x of [130, 190]) {
      s += piece(circ(x, 180, 28), '#f2e6c8', {edge: 2});
      s += `<circle cx="${x}" cy="182" r="14" fill="#1d1a20"/><circle cx="${x + 5}" cy="176" r="5" fill="#fff"/>`;
    }
    s += piece(poly([[152, 210], [168, 210], [160, 232]]), '#e0a94a', {edge: 1});
    s += piece(smooth([[110, 350], [120, 260], [160, 240], [200, 260], [210, 350]]), '#c9a57a', {edge: 1});
    L.portrait_owl = [W, H, s];
  }
  // pale patch left on the wallpaper after the portrait falls
  {
    const W = 320, H = 400;
    let s = `<rect x="14" y="14" width="292" height="372" rx="10" fill="#554d86" opacity="0.9"/>`;
    s += `<rect x="14" y="14" width="292" height="372" rx="10" fill="none" stroke="#2c2750" stroke-width="6" opacity="0.6"/>`;
    s += piece(circ(160, 6, 7), '#9b9bab', {edge: 1});
    L.portrait_mark = [W, H, s];
  }
  // wall sconce with a candle
  {
    const W = 160, H = 240;
    let s = '';
    s += piece(`M60,160Q80,200 100,160Z`, M.gold, {edge: 2});
    s += piece(rrect(72, 60, 16, 110, 6), M.goldDark, {edge: 2});
    s += piece(ell(80, 150, 40, 12), M.gold, {edge: 3, stroke: M.goldDark});
    s += piece(rrect(68, 90, 24, 58, 5), M.candle, {edge: 2});
    s += `<path d="M68,100Q74,110 72,120" stroke="#e6dcc4" stroke-width="4" fill="none"/>`;
    s += candleFlame(80, 88, 1.2);
    L.sconce = [W, H, s];
  }
  // grandfather clock (floor-standing, just in front of the wall)
  {
    const W = 220, H = 620;
    let s = '';
    s += piece(`M30,600V200Q30,150 110,140Q190,150 190,200V600Z`, M.woodDark, {edge: 5, shadow: 'big'});
    s += piece(`M20,610H200V590H20Z`, M.wood, {edge: 3});
    s += piece(circ(110, 220, 58), '#efe3c4', {edge: 3, stroke: M.gold, sw: 6});
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      s += `<circle cx="${110 + Math.cos(a) * 46}" cy="${220 + Math.sin(a) * 46}" r="3" fill="#3a2a22"/>`;
    }
    s += ink('M110,220L110,184M110,220L134,232', '#2a1d18', 5);
    s += piece(rrect(60, 300, 100, 250, 40), '#241810', {edge: 0, shadow: false, stroke: M.gold, sw: 4});
    s += ink('M110,310V470', M.gold, 3);
    s += piece(circ(110, 480, 26), M.gold, {edge: 2, stroke: M.goldDark});
    s += piece(poly([[80, 140], [110, 100], [140, 140]]), M.wood, {edge: 3});
    L.clock = [W, H, s];
  }
  // suit of armor
  {
    const W = 260, H = 640;
    let s = '';
    const st = '#9ea3b6', sd = '#6e7388';
    s += piece(rrect(70, 590, 120, 40, 10), '#4a4658', {edge: 3});
    s += piece(capsule([108, 430], [100, 590], 34, 30), st, {edge: 3, stroke: sd});
    s += piece(capsule([152, 430], [160, 590], 34, 30), st, {edge: 3, stroke: sd});
    s += piece(smooth([[80, 440], [70, 300], [90, 230], [170, 230], [190, 300], [180, 440]]), st, {edge: 4, stroke: sd, shadow: 'big'});
    s += piece(circ(70, 250, 30), st, {edge: 3, stroke: sd});
    s += piece(circ(190, 250, 30), st, {edge: 3, stroke: sd});
    s += piece(capsule([62, 270], [56, 420], 30, 26), st, {edge: 3, stroke: sd});
    s += piece(capsule([198, 270], [214, 400], 30, 26), st, {edge: 3, stroke: sd});
    s += piece(capsule([214, 80], [214, 610], 10, 10), '#6b5a48', {edge: 2});
    s += piece(poly([[214, 30], [236, 90], [192, 90]]), st, {edge: 2, stroke: sd});
    s += piece(smooth([[90, 230], [84, 150], [130, 110], [176, 150], [170, 230]]), st, {edge: 4, stroke: sd});
    s += piece(rrect(96, 160, 68, 14, 4), '#23232e', {edge: 0, shadow: false});
    s += piece(poly([[124, 110], [130, 60], [150, 100]]), '#b0344a', {edge: 2});
    L.armor = [W, H, s];
  }
  // side table (the bottle stands on it)
  {
    const W = 300, H = 300;
    let s = '';
    for (const x of [60, 230]) s += piece(capsule([x, 110], [x + (x < 150 ? -8 : 8), 290], 18, 12), M.woodDark, {edge: 2});
    s += piece(rrect(20, 80, 260, 36, 10), M.woodLight, {edge: 5, shadow: 'big', stroke: M.woodDark});
    s += piece(rrect(40, 116, 220, 40, 6), M.wood, {edge: 2});
    s += piece(circ(150, 136, 6), M.gold, {edge: 1});
    s += piece(`M28,86Q150,60 272,86L262,100Q150,80 38,100Z`, '#e9e1d0', {edge: 1});
    L.side_table = [W, H, s];
  }
  // the bottle (event prop): green glass bottle with a cork
  {
    const W = 90, H = 200;
    let s = '';
    s += piece(`M20,190V90Q20,60 38,52V20H52V52Q70,60 70,90V190Z`, '#3f8a64', {edge: 3, stroke: '#2b6448'});
    s += `<path d="M28,100V176" stroke="#bfe8cf" stroke-width="6" stroke-linecap="round" opacity="0.6"/>`;
    s += piece(rrect(36, 8, 18, 18, 4), '#c49a6a', {edge: 1});
    s += piece(rrect(24, 110, 42, 44, 6), '#efe3c4', {edge: 1});
    L.bottle = [W, H, s];
  }
  // big double door at the end of the hall (frame + dark doorway)
  {
    const W = 520, H = 760;
    let s = '';
    s += piece(`M20,760V230A240,240 0 0,1 500,230V760Z`, '#2c1f18', {edge: 6, shadow: 'big', stroke: M.woodDark});
    s += piece(`M60,760V250A200,200 0 0,1 460,250V760Z`, '#0c0a14', {edge: 0, shadow: false});
    s += piece(poly([[230, 36], [260, 10], [290, 36], [260, 64]]), M.gold, {edge: 2});
    L.door_frame = [W, H, s];
  }
  // one door leaf (mirrored for the other side)
  {
    const W = 200, H = 520;
    let s = '';
    s += piece(`M0,520V170A200,200 0 0,1 200,50V520Z`, '#5a3a2a', {edge: 4, stroke: M.woodDark});
    s += piece(rrect(30, 200, 140, 120, 10), shade('#5a3a2a', 0.85), {edge: 2});
    s += piece(rrect(30, 350, 140, 140, 10), shade('#5a3a2a', 0.85), {edge: 2});
    s += piece(circ(172, 330, 14), M.gold, {edge: 2, stroke: M.goldDark});
    L.door_leaf = [W, H, s];
    L.door_leaf_r = [W, H, `<g transform="translate(${W},0) scale(-1,1)">${s}</g>`];
  }

  // ---------- foreground (in front of the officers) ----------
  // stone pillar
  {
    const W = 260, H = 1160;
    let s = '';
    s += piece(rrect(40, 60, 180, 1100, 8), M.stone, {edge: 8, shadow: 'big', stroke: '#6d6985'});
    for (let x = 70; x < 210; x += 36) s += ink(`M${x},110V1110`, '#77738f', 5, {opacity: 0.8});
    s += piece(rrect(10, 20, 240, 70, 10), shade(M.stone, 1.1), {edge: 6});
    s += piece(rrect(20, 1060, 220, 100, 10), shade(M.stone, 1.05), {edge: 6});
    L.fg_pillar = [W, H, s];
  }
  // standing candelabra
  {
    const W = 360, H = 760;
    let s = '';
    s += piece(`M130,760L180,680L230,760Z`, M.goldDark, {edge: 3});
    s += piece(capsule([180, 690], [180, 260], 22, 16), M.gold, {edge: 3, stroke: M.goldDark});
    s += ink('M60,250Q60,330 180,330Q300,330 300,250', M.gold, 16);
    for (const x of [60, 180, 300]) {
      s += piece(ell(x, 250, 36, 12), M.gold, {edge: 2, stroke: M.goldDark});
      s += piece(rrect(x - 14, 170, 28, 80, 5), M.candle, {edge: 2});
      s += candleFlame(x, 166, 1.3);
    }
    L.fg_candelabra = [W, H, s];
  }
  // velvet armchair
  {
    const W = 460, H = 440;
    let s = '';
    s += piece(`M60,420V120Q60,40 230,40Q400,40 400,120V420Z`, M.curtain, {edge: 5, shadow: 'big', stroke: M.curtainDark});
    for (const [x, y] of [[140, 110], [230, 100], [320, 110], [185, 170], [275, 170]]) s += piece(circ(x, y, 6), M.gold, {edge: 1, shadow: false});
    s += piece(rrect(40, 260, 380, 90, 30), shade(M.curtain, 1.1), {edge: 4, stroke: M.curtainDark});
    s += piece(rrect(10, 220, 80, 170, 30), M.curtainDark, {edge: 4});
    s += piece(rrect(370, 220, 80, 170, 30), M.curtainDark, {edge: 4});
    for (const x of [60, 390]) s += piece(rrect(x - 10, 380, 20, 60, 6), M.woodDark, {edge: 2});
    L.fg_chair = [W, H, s];
  }
  // big vase with dead flowers
  {
    const W = 300, H = 520;
    let s = '';
    for (const [a, b] of [[[150, 250], [80, 60]], [[150, 250], [160, 30]], [[150, 250], [230, 80]]]) {
      s += ink(`M${a[0]},${a[1]}Q${(a[0] + b[0]) / 2 + 20},${(a[1] + b[1]) / 2} ${b[0]},${b[1]}`, '#5a5a3a', 6);
      s += piece(scallop(b[0], b[1], 26, 22, 7, 0.25, b[0]), '#7a5a6e', {edge: 2});
    }
    s += piece(`M90,520Q40,420 90,320Q110,280 100,250H200Q190,280 210,320Q260,420 210,520Z`, '#3f5f7a', {edge: 5, shadow: 'big', stroke: '#2c4459'});
    s += ink('M70,400Q150,430 230,400', M.gold, 6);
    L.fg_vase = [W, H, s];
  }
  // heavy curtain hanging right in front of the lens
  {
    const W = 520, H = 1200;
    let s = '';
    s += piece(`M0,0H480Q420,300 460,600Q500,900 420,1200H0Z`, M.curtain, {edge: 8, shadow: 'big', stroke: M.curtainDark});
    for (const x of [90, 200, 310]) s += ink(`M${x},0Q${x + 30},500 ${x - 10},1200`, M.curtainDark, 12, {opacity: 0.8});
    s += piece(rrect(0, 520, 470, 50, 20), M.gold, {edge: 4, stroke: M.goldDark});
    s += piece(`M200,570Q180,680 230,720Q280,680 260,570Z`, M.gold, {edge: 3});
    L.front_curtain = [W, H, s];
  }
  // cobweb in the top corner
  {
    const W = 520, H = 420;
    let s = '';
    const c = '#e9e6f5';
    for (let k = 0; k <= 6; k++) {
      const a = (k / 6) * (Math.PI / 2);
      s += ink(`M0,0L${Math.cos(a) * 520},${Math.sin(a) * 420}`, c, 3, {opacity: 0.8});
    }
    for (const r of [90, 170, 250, 330]) {
      let d = '';
      for (let k = 0; k <= 6; k++) {
        const a = (k / 6) * (Math.PI / 2);
        const p = [Math.cos(a) * r * 1.2, Math.sin(a) * r];
        if (k === 0) d += `M${p[0]},${p[1]}`;
        else {
          const a0 = ((k - 0.5) / 6) * (Math.PI / 2);
          d += `Q${Math.cos(a0) * r * 1.05},${Math.sin(a0) * r * 0.88} ${p[0]},${p[1]}`;
        }
      }
      s += ink(d, c, 3, {opacity: 0.8});
    }
    // little spider
    s += ink('M300,150V230', c, 2);
    s += piece(circ(300, 240, 14), '#2a2236', {edge: 2, stroke: '#fff'});
    s += `<circle cx="296" cy="238" r="3" fill="#fff"/><circle cx="305" cy="238" r="3" fill="#fff"/>`;
    L.front_cobweb = [W, H, s];
  }
  // chandelier hanging from the ceiling
  {
    const W = 700, H = 460;
    let s = '';
    s += ink('M350,0V120', M.goldDark, 8);
    s += ink('M100,240Q350,360 600,240', M.gold, 14);
    s += ink('M190,250Q350,320 510,250', M.gold, 10);
    s += piece(smooth([[330, 120], [370, 120], [390, 250], [350, 330], [310, 250]]), M.gold, {edge: 4, stroke: M.goldDark, shadow: 'big'});
    for (const x of [100, 190, 280, 420, 510, 600]) {
      s += piece(ell(x, 240, 30, 10), M.gold, {edge: 2});
      s += piece(rrect(x - 11, 180, 22, 60, 4), M.candle, {edge: 2});
      s += candleFlame(x, 176, 1.1);
    }
    for (const x of [150, 250, 450, 550]) s += piece(poly([[x, 290], [x + 10, 320], [x, 350], [x - 10, 320]]), '#d8e8f5', {edge: 1});
    L.front_chandelier = [W, H, s];
  }
  return L;
};
