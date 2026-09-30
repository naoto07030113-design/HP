# 紙工作風 2.5D アニメーション (Remotion)

このプロジェクトには2本の作品があります。

| Composition | 内容 | 出力 |
|---|---|---|
| `BakeryWalk` | 春の街を散歩してパン屋にたどり着く女の子（30秒） | `out/bakery-walk.mp4` |
| `MansionPatrol` | 懐中電灯で洋館を探索する動物のお巡りさん2人（36秒） | `out/mansion-patrol.mp4` |

---

# BakeryWalk

春の街を散歩する女の子が、パンの香りに気づき、パン屋の前までたどり着く約30秒の映像です。
何層もの紙で作った舞台を、パララックスと前景オクルージョンで動かしています。

- 完成動画: `out/bakery-walk.mp4`（1920×1080 / 30fps / 900フレーム / AAC音声）
- Composition: `BakeryWalk`
- このフォルダは独立した Remotion プロジェクトです（親の Next.js アプリとは依存関係を共有しません）。

## コマンド

```bash
cd video
npm install
npm run assets     # 全PNG素材を生成（public/assets/** と src/data/asset-manifest.json）
                   # 個別生成: node scripts/generate-assets.mjs character|street|bakery|police|mansion
npm run audio      # 全音源を合成（public/assets/audio/*.mp3）
npm run studio     # Remotion Studio でプレビュー
npm run stills -- 120 330 630   # 指定フレームの静止画を preview/ に書き出し
npm run render     # out/bakery-walk.mp4 をレンダリング
npm run render:mansion   # out/mansion-patrol.mp4 をレンダリング
COMP=MansionPatrol npm run stills -- 270 560   # MansionPatrol — 洋館パトロール

柴犬の先輩（怖がりながらも頼りになる）と、うさぎの後輩（物音のたびに飛び上がる）が、懐中電灯を持って夜の洋館を探索します。途中で瓶が倒れて転がり、肖像画が壁から落ちるたびに2人は大慌て。最後は奥の扉からコウモリが一斉に飛び出して終わります。

画づくりは「本物の紙で作ったジオラマを撮影した映像」を目指しています。

- **キャラクター**: `scripts/lib/animals.mjs` … 約5頭身の、本物の動物に近い顔つきと体つきです。何層もの紙で毛並み・陰影・制服（肩章、胸のバッジ、装備ベルト）を表現しています。柴犬は裏白の毛色と巻き尾、うさぎは野うさぎ色で、横についた大きな目と長い耳です。先輩4ポーズ、後輩5ポーズを `public/assets/police/` に出力し、懐中電灯の先端位置は `src/data/mansion/police-meta.json` に書き出します。設定画は `police_ref.png` です。
- **本物の紙らしさ**: `paper.mjs` の `setPaperStyle({real: true})` を使うと、紙1枚ごとのわずかな反り（明暗）、光を受ける切り口、紙の繊維、柔らかく長い影が付きます。洋館とキャラクターの素材だけに適用しています（パン屋の作品は従来どおり）。
- **撮影された質感**:
  - 被写界深度: `story.ts` の `depthBlur` で、キャラクターの面にピントを合わせ、奥の壁や手前の家具をぼかします。
  - `DarkRoom.tsx`: 暗闇、懐中電灯の光、光の中を舞うほこり、ろうそくの光のにじみ。
  - 壁に落ちる2人の影: `PaperDoll` の `silhouette`。
  - `FilmLook.tsx`: フィルムの粒子、周辺減光、色調。
  - 手持ちカメラのわずかな揺れと、衝撃でのカメラの揺れ。
- **動き**: 1枚の紙人形のまま、跳ねと揺れを控えめにしています（`bounce`、`hopHeight`）。驚きは漫画的なマークではなく、ポーズ・小さなジャンプ・音・カメラの揺れで表現しています。
- **背景**: `scripts/lib/mansion.mjs` … 壁紙と月夜の窓（タイル）、木目の床とじゅうたん、肖像画、燭台、柱時計、甲冑、瓶ののったテーブル、大扉と左右の扉、手前の柱・燭台・カーテン・蜘蛛の巣・シャンデリア。
- **仕掛け**: 瓶・肖像画・扉は `story.ts` の `EVENTS` に合わせて、`MansionPatrol.tsx` の `animate()` で動かします。
- **コウモリ**: `BatSwarm.tsx` の `variant="real"` … 指の骨に張った翼膜をもつ、切り紙のコウモリです。カメラに近いものほどぼけます。
- **音**: `scripts/generate-audio-mansion.mjs` … 忍び足のピチカートとオルゴール（コウモリ以降は追いかけっこ曲）、雷、瓶、落下音、驚きのスティング、扉のきしみ、コウモリの羽音、スライドホイッスル。
- **タイミングの調整**: `src/data/mansion/story.ts` だけを編集します。

共通部品（`PaperDoll`、`PaperStage`、`ParallaxLayer`、`Emote`、`lib/motion.ts`、`lib/stage.ts`、`scripts/lib/synth.mjs`）は2作品で共有しています。
