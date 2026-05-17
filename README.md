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
