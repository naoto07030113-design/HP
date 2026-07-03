# 鍼灸整骨院 統合業務システム

複数院の鍼灸整骨院向け 予約・患者・カルテ・会計・物販・経営分析の統合管理システム。

- **患者向け**（ログイン不要）: `/reserve` — Web予約（初診問診票つき）・予約の確認/変更/キャンセル・物販予約
- **スタッフ向け**（要ログイン）: `/admin` — 当日受付・予約カレンダー・患者管理・カルテ・会計・日計・シフト・休診日・物販・お知らせ・各種ダッシュボード/レポート・CSV出力

## 技術スタック

| 層 | 技術 |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS |
| UI | shadcn/ui + Radix UI |
| Database / Auth / Realtime | Supabase |
| Hosting | Vercel |

## セットアップ手順

### 1. Supabase の準備

1. [Supabase](https://supabase.com) でプロジェクトを作成（既存プロジェクトでも可）
2. **SQL Editor** を開き、**`supabase/setup.sql` の内容を全文コピー＆実行**
   - 何度実行しても安全（冪等）。過去に `supabase/migrations/` の一部を実行済みでも、このスクリプト1本で最新の状態に収束します
   - テーブル作成・不足カラム補完・RLS（アクセス権限）・リアルタイム配信までまとめて設定されます
3. **Authentication → Users → Add user** で管理者ユーザーを作成（メールアドレス＋パスワード）
   - スタッフの権限は user_metadata の `role`（`admin` / `staff` / `receptionist`）と `clinic_id` で制御できます。未設定の場合は admin 扱いです

### 2. 環境変数

Vercel（または `.env.local`）に設定:

| 変数 | 必須 | 説明 |
|---|---|---|
| `NEXT_PUBLIC_CLINIC_SUPABASE_URL` | ✓ | Supabase プロジェクトURL |
| `NEXT_PUBLIC_CLINIC_SUPABASE_ANON_KEY` | ✓ | anon (publishable) キー |
| `CLINIC_SERVICE_ROLE_KEY` | 推奨 | service_role キー（初診予約APIで使用。未設定でも動作） |
| `LINE_CHANNEL_TOKENS` | 任意 | 新規予約のLINE通知。`{"<clinicのUUID>": "<チャネルトークン>"}` 形式のJSON |

### 3. ローカル起動 / デプロイ

```bash
npm install
npm run dev   # http://localhost:3000 → /admin/login にリダイレクト
```

Vercel には main ブランチを接続してデプロイします。

### 4. 初期データ投入（管理画面から）

1. `/admin/login` でログイン
2. 「院管理」で院を登録 → 「スタッフ管理」「メニュー管理」で施術者・メニューを登録
3. 「休診日管理」で定休日を設定
4. 患者向けページ `/reserve` から予約できることを確認

## データベース

スキーマ・権限の正は **`supabase/setup.sql`** です（`supabase/migrations/` は過去の履歴として残していますが、新規適用には setup.sql を使ってください）。

主なテーブル: `clinics` / `staff` / `menus` / `shifts` / `shift_blocks` / `patients` / `reservations` / `medical_records` / `announcements` / `invoices` / `invoice_items` / `app_settings` / `closed_days` / `merchandise` / `merchandise_bookings` / `monthly_reports`

### アクセス権限（RLS）の方針

- ログイン済みスタッフ（authenticated）: 全テーブル全操作可
- 患者（anon・ログイン不要）:
  - 閲覧: 院・スタッフ・メニュー・お知らせ・休診日・商品・予約設定（公開中のもののみ）
  - 予約（reservations）: 閲覧・作成・更新（空き枠計算とWebキャンセル/日時変更に必要）
  - 問診票（patients）・物販予約（merchandise_bookings）: **作成のみ**（閲覧不可）
  - カルテ・会計・月次レポート: 完全にアクセス不可

> 補足: Web予約をログイン不要で成立させるため、予約テーブルは匿名でも読める設計です（空き枠計算・電話番号での予約検索に使用）。予約者名・電話番号が技術的には匿名APIから参照可能な点は認識してください。より厳密に秘匿したい場合はサーバーAPI化が必要です。

## LINE通知

新規予約が入ると、院ごとに設定したLINE公式アカウントへブロードキャスト通知します。`LINE_CHANNEL_TOKENS` を設定し、通知を受けたいスタッフがその公式アカウントを友だち追加してください。未設定の場合は通知なしで正常動作します。
