# 経費・出納帳アプリ

レシート・通帳・請求書を写真でアップロードするだけで、AIが内容を読み取り、出納帳への記帳・税理士提出用CSV出力・振込期日の通知までを行う、経営者向けのシンプルな経費管理アプリです。治療院総合システムからは独立した単体アプリケーションです。

## 主な機能

- **書類読み取り（1つの窓口）** — 撮影・アップロードした書類をAIが自動判別して振り分けます。
  - レシート・領収書 → 出金として出納帳へ（日付・金額・支払先・勘定科目を自動読み取り）
  - 通帳 → 入出金明細を一括読み取りして出納帳へ
  - 請求書・見積書（振込期日あり） → 支払予定に登録
- **振込期日の通知** — 期日の前日からアプリ上部に通知。「支払済にする」で出納帳へ自動記帳。
- **出納帳** — 収入・支出・差引のサマリー、勘定科目別の内訳、期間・事業所・区分での絞り込み。
- **税理士提出用CSV出力** — 日付・勘定科目・摘要・収入・支出・差引残高の形式（Excelで文字化けしないBOM付き）。
- **事業所管理** — 店舗・拠点・部門を登録し、経費を分けて集計。

## 技術スタック

| 層 | 技術 |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS |
| UI | Radix UI ベースのコンポーネント |
| Database / Auth | Supabase（PostgreSQL + Auth） |
| AI読み取り | OpenAI GPT-4o-mini（Vision） |
| Hosting | Vercel 推奨 |

## セットアップ

### 1. 依存をインストール

```bash
npm install
```

### 2. Supabase を準備

1. [Supabase](https://supabase.com) でプロジェクトを新規作成
2. **SQL Editor** で `supabase/migrations/001_init.sql` をすべて実行
3. **Authentication > Providers > Email** を有効化し、ログイン用ユーザーを1名作成

### 3. 環境変数

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
OPENAI_API_KEY=sk-your_openai_api_key_here
```

- Supabaseのキーは **Project Settings > API** から取得。
- `OPENAI_API_KEY` は書類のAI読み取りに使用します（未設定でも手入力・CSV出力は動作します）。

### 4. 起動

```bash
npm run dev
```

`http://localhost:3000` を開き、作成したアカウントでログインしてください。

## 画面構成

| URL | 説明 |
|---|---|
| `/login` | ログイン |
| `/cashbook` | 経費・出納帳（メイン） |
| `/businesses` | 事業所管理 |

## Vercel デプロイ

1. GitHub リポジトリをインポート
2. Environment Variables に `.env.local` の内容を設定
3. デプロイ

## 補足：振込期日の通知について

通知は「アプリを開いたときに上部へ表示されるバナー」方式です。アプリを開いていなくても届くメール・LINE等のプッシュ通知が必要な場合は、Vercel Cron などの定期実行と組み合わせて拡張できます。
