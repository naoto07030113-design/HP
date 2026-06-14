export interface Scene {
  id: string
  image: string
  /** 大見出し（日本語） */
  title: string
  /** 添えるラテン語的な小見出し */
  kicker: string
  /** 詩的なボディコピー */
  body: string
  /** 画面下部に流れる薄いインデックス語 */
  index: string
  /** このシーンの基調となる光の色（rgb） */
  glow: string
}

export const scenes: Scene[] = [
  {
    id: 'exterior',
    image: '/immersive/01-exterior.png',
    kicker: 'PROLOGUE — 黄昏',
    title: '夜に灯る家',
    body: '昼が静かに退き、石とコンクリートに残光がにじむ。やわらかな間接光が、これから始まる物語の入口を照らしている。',
    index: 'FAÇADE / 0:01',
    glow: '255, 176, 92',
  },
  {
    id: 'entrance',
    image: '/immersive/02-entrance.png',
    kicker: 'CHAPTER I — 境界',
    title: '光の回廊',
    body: '一歩、内へ。足元を撫でる帯状のあかりが奥へと誘い、外の喧噪は遠ざかる。木と石、影と灯。境界をまたぐ静けさ。',
    index: 'THRESHOLD / 0:02',
    glow: '255, 198, 120',
  },
  {
    id: 'living',
    image: '/immersive/03-living.png',
    kicker: 'CHAPTER II — 余白',
    title: '吹き抜ける時間',
    body: '高い天井に夜気が満ち、ガラスの向こうに庭の闇が広がる。何もない余白こそが、心をいちばん深く満たしていく。',
    index: 'VOID / 0:03',
    glow: '214, 200, 178',
  },
  {
    id: 'courtyard',
    image: '/immersive/04-courtyard.png',
    kicker: 'EPILOGUE — 中庭',
    title: '夜と緑のあいだ',
    body: '四方をガラスに囲まれた小さな宇宙。一本の樹が闇に呼吸し、石庭の灯がまたたく。ここで、物語はそっと余韻に還る。',
    index: 'COURTYARD / 0:04',
    glow: '156, 196, 150',
  },
]
