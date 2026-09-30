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
COMP=MansionPatrol npm run stills -- 270 560   # MansionPatrol の静止画
```

Chromium が導入済みの環境では、`REMOTION_CHROME` 環境変数、または `--browser-executable=<path>` オプションでブラウザを指定できます。

## 素材について

素材はすべてコードから生成しています（`scripts/`）。

- `scripts/lib/paper.mjs` … 紙パーツの共通処理。厚み（ずらした濃色の複製）、輪郭線、柔らかい影、紙の繊維テクスチャを付けます。
- `scripts/lib/character.mjs` … パラメトリックな紙人形です。全ポーズを同じ描画コードで作るため、顔・髪・服・頭身が変わりません。
- `scripts/lib/sheet.mjs` … キャラクター設定画（`char_ref.png`：正面・3/4・横、4つの表情、配色）。
- `scripts/lib/street.mjs` / `bakery.mjs` … 背景をレイヤーごとに1枚ずつ生成します。横に流れるレイヤーは継ぎ目なくタイル状に並べられます。
- `scripts/generate-audio.mjs` … BGM（撥弦ギター＋グロッケン）、鳥、足音、ドアベル、風、きらめき音をすべて合成。外部音源を使っていないので、著作権の問題はありません。

AIで生成した画像に差し替える場合は、同じファイル名・同じキャンバス仕様で置き換え、`src/data/asset-manifest.json` のサイズを更新してください。キャラクターは 560×900、足裏の位置が y=862 です。

## コード構成

```
src/
├─ Root.tsx                    Composition 登録
├─ compositions/BakeryWalk.tsx 全体の組み立て（ステージ・キャラ・演出・ワイプ・フェード）
├─ components/
│  ├─ ParallaxLayer.tsx        speed / x / y / scale / zIndex / opacity / tile / shadow
│  ├─ PaperStage.tsx           ステージ（レイヤー配列）を描画
│  ├─ WalkingGirl.tsx          ペーパーマリオ風の紙人形（跳ねる歩行・フリップ・スクワッシュ）
│  ├─ Emote.tsx                頭上に出る「！」・ハート・音符
│  ├─ SakuraPetals.tsx         紙の花びら（同時に数枚だけ）
│  ├─ AromaEffect.tsx          紙を細く切ったような香りのリボン
│  ├─ PaperShadow.tsx          影の定義（光源は1つ。影は常に右下に落ちる）
│  └─ Soundtrack.tsx           BGM・効果音・着地に合わせた足音
├─ data/
│  ├─ scenes.ts                タイムライン、カメラ、ステージ配置（ここだけ変えれば別の動画にできる）
│  ├─ characters.ts            キャラクターのスプライト定義
│  ├─ audio.ts                 音の配置
│  └─ asset-manifest.json      素材サイズ（自動生成）
└─ lib/timeline.ts             速度キーフレームを積分してカメラ位置・歩行距離を計算
```

### 仕組みのポイント

- **ペーパーマリオ風の人物表現**: 人物は白いフチ付きで切り抜いた「1枚の紙」です。手足は動かさず、紙そのものの動きで命を与えています。
  - 歩行: 歩き用の1枚絵（`stroll.png`）がひょこひょこ跳ねながら進みます。跳ねる間隔と高さは `characters.ts` の `hopDistance` / `hopHeight` で調整できます。跳ねるたびに左右交互に傾き、着地で少しつぶれ（スクワッシュ）、紙らしく少しはためきます。
  - 向きの変化: 横向きと正面向きが入れ替わるときは、紙を裏返すように Y 軸で回転します。真横を向いた瞬間は、紙の厚みの細い線だけが見えます。
  - リアクション: `scenes.ts` の `HOPS`（ジャンプ）と `EMOTES`（「！」、ハート、音符の紙ステッカー）で指定します。
  - 影: 足元の丸い影は、ジャンプの高さに応じて小さくなります。

- **パララックス**: 各レイヤーの画面上の x は `x - cameraX * speed` です。空 0、雲 0.05、山 0.1、遠景 0.25、住宅 0.45、店舗 0.6、道 1.0、前景 1.1〜1.25、最前景 1.5〜1.8。
  - 道は仕様の 0.75〜0.9 ではなく 1.0 にしています。主人公が実際に歩く面なので、1.0 以外にすると進む速さと地面の流れがずれて見えるためです。
- **地面と同期したジャンプ**: 跳ねるタイミングは経過フレームではなく「歩いた距離」で決めています。減速すると跳ねる間隔も自然にゆっくりになります。
- **オクルージョン**: `z < 100` が主人公の奥、`z > 100` が手前です。`at: {frame, x, girl: true}` と書くと「そのフレームで主人公の位置を基準に置く」指定になり、街灯や木の幹が主人公を隠す瞬間を狙って配置できます。
- **ワイプ**: 巨大な桜の木（`transition_tree.png`）が画面全体を覆ったフレーム（630）で、street から bakery にステージを切り替えます。

## 別キャラクター・別店舗・別ストーリーに流用するには

1. **キャラクター**: `character.mjs` の `PALETTE` と `POSES` を変えて `npm run assets` を実行します（または同じ仕様のPNGに差し替えます）。`characters.ts` に定義を追加してください。
2. **店舗**: `bakery.mjs` を複製して、建物・窓・陳列・ドアを描き直します。`scenes.ts` の `shopPieces` がまとめて配置します。
3. **ストーリー**: `scenes.ts` の `SCENES`、`CHARACTER_STATES`、`CAMERA`、`GIRL_TRACK`、`TRANSITION`、`EFFECTS`、`STAGES` を編集します。コンポーネントは変更不要です。

---

# MansionPatrol — 洋館パトロール

柴犬の先輩（怖がりながらも頼りになる）と、うさぎの後輩（物音のたびに飛び上がる）が、懐中電灯を持って夜の洋館を探索します。途中で瓶が倒れて転がり、肖像画が壁から落ちるたびに2人は大慌て。最後は奥の扉からコウモリがわーっと飛び出して終わります。

- **キャラクター**: `scripts/lib/animals.mjs` で描いたちびキャラの紙人形です（白フチ付き）。先輩4ポーズ、後輩5ポーズを `public/assets/police/` に出力し、懐中電灯の先端位置は `src/data/mansion/police-meta.json` に書き出します。設定画は `police_ref.png` です。
- **背景**: `scripts/lib/mansion.mjs` … 壁紙と月夜の窓（タイル）、じゅうたんの床、肖像画、燭台、柱時計、甲冑、瓶ののったテーブル、大扉と左右の扉、手前の柱・燭台・カーテン・蜘蛛の巣・シャンデリア。
- **暗闇と懐中電灯**: `DarkRoom.tsx` が画面全体を暗くし、懐中電灯の光の円錐とろうそく・窓・キャラ周りの光だけを切り抜きます。2人は暗闇より上に描いて見やすくし、手前の家具はさらにその上に暗めの明るさで重ねています。
- **仕掛け**: 瓶・肖像画・扉は `story.ts` の `EVENTS` に合わせて、`MansionPatrol.tsx` の `animate()` で動かします（倒れる、落ちる、きしみながら開く）。
- **コウモリ**: `BatSwarm.tsx` … 扉から放射状に飛び出し、最後は画面いっぱいに迫ってきます。
- **音**: `scripts/generate-audio-mansion.mjs` … 忍び足のピチカートとオルゴール（コウモリ以降は追いかけっこ曲）、雷、瓶、落下音、驚きのスティング、扉のきしみ、コウモリの羽音、スライドホイッスル。
- **タイミングの調整**: `src/data/mansion/story.ts` だけを編集します。カメラ速度・後輩との距離（`JUNIOR_GAP`）・ポーズ・ジャンプ・エモート・イベント・小物の配置がすべてここにあります。

共通部品（`PaperDoll`、`PaperStage`、`ParallaxLayer`、`Emote`、`lib/motion.ts`、`lib/stage.ts`）は2作品で共有しています。新しい作品も、素材の生成スクリプトと `story.ts` を用意すれば同じ仕組みで作れます。
