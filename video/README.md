# BakeryWalk — 紙工作風 2.5D アニメーション (Remotion)

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
npm run audio      # 全音源を合成（public/assets/audio/*.mp3）
npm run studio     # Remotion Studio でプレビュー
npm run stills -- 120 330 630   # 指定フレームの静止画を preview/ に書き出し
npm run render     # out/bakery-walk.mp4 をレンダリング
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
│  ├─ WalkingGirl.tsx          x / y / scale / state / walkingSpeed / distance / direction
│  ├─ SakuraPetals.tsx         紙の花びら（同時に数枚だけ）
│  ├─ AromaEffect.tsx          紙を細く切ったような香りのリボン
│  ├─ PaperShadow.tsx          影の定義（光源は1つ。影は常に右下に落ちる）
│  └─ Soundtrack.tsx           BGM・効果音・歩行と同期した足音
├─ data/
│  ├─ scenes.ts                タイムライン、カメラ、ステージ配置（ここだけ変えれば別の動画にできる）
│  ├─ characters.ts            キャラクターのスプライト定義
│  ├─ audio.ts                 音の配置
│  └─ asset-manifest.json      素材サイズ（自動生成）
└─ lib/timeline.ts             速度キーフレームを積分してカメラ位置・歩行距離を計算
```

### 仕組みのポイント

- **パララックス**: 各レイヤーの画面上の x は `x - cameraX * speed` です。空 0、雲 0.05、山 0.1、遠景 0.25、住宅 0.45、店舗 0.6、道 1.0、前景 1.1〜1.25、最前景 1.5〜1.8。
  - 道は仕様の 0.75〜0.9 ではなく 1.0 にしています。主人公が実際に歩く面なので、1.0 以外にすると足が滑って見えるためです。
- **足が滑らない歩行**: 歩行ポーズは経過フレームではなく「歩いた距離」で切り替えます。1ポーズで進む距離は歩幅の半分です。減速しても足と地面が同期します。
- **オクルージョン**: `z < 100` が主人公の奥、`z > 100` が手前です。`at: {frame, x, girl: true}` と書くと「そのフレームで主人公の位置を基準に置く」指定になり、街灯や木の幹が主人公を隠す瞬間を狙って配置できます。
- **ワイプ**: 巨大な桜の木（`transition_tree.png`）が画面全体を覆ったフレーム（630）で、street から bakery にステージを切り替えます。

## 別キャラクター・別店舗・別ストーリーに流用するには

1. **キャラクター**: `character.mjs` の `PALETTE` と `POSES` を変えて `npm run assets` を実行します（または同じ仕様のPNGに差し替えます）。`characters.ts` に定義を追加してください。
2. **店舗**: `bakery.mjs` を複製して、建物・窓・陳列・ドアを描き直します。`scenes.ts` の `shopPieces` がまとめて配置します。
3. **ストーリー**: `scenes.ts` の `SCENES`、`CHARACTER_STATES`、`CAMERA`、`GIRL_TRACK`、`TRANSITION`、`EFFECTS`、`STAGES` を編集します。コンポーネントは変更不要です。
