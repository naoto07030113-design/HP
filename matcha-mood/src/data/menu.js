// 商品データ。写真はすべて元のメニューデザインから切り出した素材。
// 画像が用意されていないものは image: null とし、UI 上で「仮素材」と明示する。

const img = (name) => `${import.meta.env.BASE_URL}products/${name}.jpg`

export const SIZES = [
  { id: 'S', label: 'S', note: '240ml', delta: -60, scale: 0.84 },
  { id: 'M', label: 'M', note: '360ml', delta: 0, scale: 0.94 },
  { id: 'L', label: 'L', note: '480ml', delta: 80, scale: 1.04 },
]

export const SWEETNESS = [
  { id: 'none', label: '無糖', level: 0 },
  { id: 'light', label: '控えめ', level: 1 },
  { id: 'regular', label: 'ふつう', level: 2 },
  { id: 'extra', label: '甘め', level: 3 },
]

export const MILKS = [
  { id: 'cow', label: '牛乳', delta: 0 },
  { id: 'soy', label: '豆乳', delta: 40 },
  { id: 'oat', label: 'オーツ', delta: 60 },
  { id: 'almond', label: 'アーモンド', delta: 60 },
]

export const TOPPINGS = {
  cream: { id: 'cream', label: 'ホイップ', delta: 50, image: img('t-cream') },
  strawberry: { id: 'strawberry', label: 'いちご', delta: 100, image: img('t-strawberry') },
  azuki: { id: 'azuki', label: '粒あん', delta: 80, image: img('t-azuki') },
  icecream: { id: 'icecream', label: 'バニラアイス', delta: 120, image: img('t-icecream') },
  lemon: { id: 'lemon', label: 'レモン追加', delta: 50, image: img('t-lemon') },
  shiratama: { id: 'shiratama', label: '白玉', delta: 80, image: null },
  shot: { id: 'shot', label: '追い抹茶', delta: 60, image: null },
}

// theme: 商品切替時に背景がこの色へ滑らかに遷移する
export const PRODUCTS = [
  {
    id: 'strawberry-latte',
    category: 'drink',
    name: 'Strawberry Matcha Latte',
    ja: 'いちご抹茶ラテ',
    price: 680,
    seasonal: true,
    copy: '甘酸っぱいいちごミルクに、濃い抹茶を重ねた春のご褒美。',
    image: img('strawberry-latte'),
    theme: { from: '#fde4ea', to: '#f6bfcc', blob: '#f3a9ba', accent: '#c95f73' },
    options: { size: true, sweetness: true, milk: true, toppings: ['cream', 'strawberry', 'shiratama', 'shot'] },
    defaults: { toppings: ['cream'] },
  },
  {
    id: 'matcha-latte',
    category: 'drink',
    name: 'Matcha Latte',
    ja: '抹茶ラテ',
    price: 580,
    copy: '国産抹茶をたっぷり点てた、MATCHA MOOD の定番。',
    image: img('matcha-latte'),
    theme: { from: '#f1f8c4', to: '#dcef84', blob: '#c6e06b', accent: '#3f6f22' },
    options: { size: true, sweetness: true, milk: true, toppings: ['cream', 'azuki', 'shiratama', 'shot'] },
  },
  {
    id: 'houjicha-latte',
    category: 'drink',
    name: 'Houjicha Latte',
    ja: 'ほうじ茶ラテ',
    price: 580,
    copy: '香ばしく焙じた茶葉に、やさしいミルクのコク。',
    image: img('houjicha-latte'),
    theme: { from: '#fbefe6', to: '#efd2bf', blob: '#e2b99c', accent: '#8a5a3a' },
    options: { size: true, sweetness: true, milk: true, toppings: ['cream', 'azuki', 'shiratama'] },
  },
  {
    id: 'lemon-soda',
    category: 'drink',
    name: 'Matcha Lemon Soda',
    ja: '抹茶レモンソーダ',
    price: 600,
    copy: 'レモンの爽やかさと抹茶のほろ苦さ。しゅわっと軽やかに。',
    image: img('lemon-soda'),
    theme: { from: '#f9fbd0', to: '#eef39a', blob: '#e2ec6a', accent: '#5d7d1c' },
    options: { size: true, sweetness: true, milk: false, toppings: ['lemon', 'shot'] },
  },
  {
    id: 'matcha-float',
    category: 'drink',
    name: 'Matcha Float',
    ja: '抹茶フロート',
    price: 650,
    copy: '濃厚抹茶にバニラアイスを浮かべた、とろける一杯。',
    image: img('matcha-float'),
    theme: { from: '#eef6cf', to: '#cfe48f', blob: '#b8d46a', accent: '#2c5419' },
    options: { size: true, sweetness: true, milk: true, toppings: ['icecream', 'azuki', 'shot'] },
  },
  {
    id: 'cheesecake',
    category: 'sweets',
    name: 'Matcha Cheesecake',
    ja: '抹茶チーズケーキ',
    price: 520,
    copy: 'しっとり濃厚。抹茶の苦みとチーズの酸味が重なります。',
    image: img('cheesecake'),
    theme: { from: '#fdeaea', to: '#f7cdd4', blob: '#f0b4c0', accent: '#c95f73' },
    options: { toppings: ['cream', 'strawberry', 'icecream'] },
  },
  {
    id: 'roll-cake',
    category: 'sweets',
    name: 'Matcha Roll Cake',
    ja: '抹茶ロールケーキ',
    price: 500,
    copy: 'ふわふわの抹茶生地で、軽いクリームと粒あんを巻きました。',
    image: img('roll-cake'),
    theme: { from: '#f3f9d6', to: '#e3efa6', blob: '#cfe27e', accent: '#3f6f22' },
    options: { toppings: ['cream', 'azuki', 'icecream'] },
  },
  {
    id: 'warabi-mochi',
    category: 'sweets',
    name: 'Matcha Warabi Mochi',
    ja: '抹茶わらび餅',
    price: 480,
    copy: 'ぷるんとした食感に、抹茶ときなこ黒蜜の香り。',
    image: img('warabi-mochi'),
    theme: { from: '#fbefe9', to: '#f1d6cc', blob: '#e6bfb1', accent: '#6b4a3a' },
    options: { toppings: ['azuki', 'shiratama', 'icecream'] },
  },
  {
    id: 'affogato',
    category: 'sweets',
    name: 'Matcha Affogato',
    ja: '抹茶アフォガート',
    price: 600,
    copy: 'バニラアイスに、点てたての抹茶をとろりと注いで。',
    image: img('affogato'),
    theme: { from: '#fde6ec', to: '#f5c3cf', blob: '#eeaabb', accent: '#2c5419' },
    options: { toppings: ['azuki', 'shiratama', 'shot'] },
  },
]

export const CATEGORIES = [
  { id: 'drink', label: 'Drinks', ja: 'ドリンク' },
  { id: 'sweets', label: 'Sweets', ja: 'スイーツ' },
]
