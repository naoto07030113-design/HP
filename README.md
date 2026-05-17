# 治療院向け 予約管理 + 患者予約SaaS (初期版)

## 技術スタック
- Frontend: React / TypeScript / Vite / Tailwind / Framer Motion / dnd-kit / Zustand / RHF / Zod / TanStack Query
- Backend: Supabase(PostgreSQL/RLS/Realtime/Edge Functions想定)

## 実装範囲
- CRM: 週次予約ボード、ステータス色分け、可変時間(5分粒度を想定したduration)
- 患者予約: スマホファースト入力フォーム
- KPIカード
- Supabase SQLスキーマ(予約・患者・スタッフ・クーポン・紹介・ランク・LINEログ)

## セットアップ
```bash
npm install
npm run dev
```

## Supabase
1. Supabaseプロジェクト作成
2. `supabase/migrations/202605160001_init.sql` を適用
3. `.env.example` をコピーして `.env` 作成

## デプロイ
- Vercelへデプロイ
- 環境変数をVercelに設定
- Build command: `npm run build`
- Output directory: `dist`

## 次フェーズ提案
- Edge FunctionsでLINE webhook/通知配信
- Realtime購読で空き枠即時反映
- dnd-kitのドラッグ更新をSupabase upsertへ接続


## 依存インストールできない環境でのプレビュー
`npm install` が制限される環境では、静的プレビューをすぐ確認できます。

```bash
python3 -m http.server 4173
# ブラウザで http://localhost:4173/preview.html
```

この `preview.html` は CRM と患者予約画面のUI確認用モックです。


## Netlifyデプロイ（本番/検証）
このリポジトリはSPAなので `netlify.toml` でビルド設定とリダイレクトを定義済みです。

### 1) Netlifyサイトに接続
- GitHubリポジトリをNetlifyに接続
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20`

### 2) 環境変数（Site settings > Environment variables）
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3) 既存サイトに反映
あなたが提示した以下2サイトは、どちらも同じリポジトリを接続可能です。
- `venerable-gumption-efa785.netlify.app`（本番想定）
- `effervescent-dieffenbachia-9141b9.netlify.app`（検証想定）

Netlify UIの **Site configuration > Build & deploy > Continuous deployment** でこのリポジトリを選び、上記設定を保存後に再デプロイしてください。

### 4) 404対策
`netlify.toml` の SPA リダイレクト設定により、`/booking` 直アクセスでも404にならず表示されます。
