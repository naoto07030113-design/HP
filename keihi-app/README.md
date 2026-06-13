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

## Vercel デプロイ（このリポジトリのサブフォルダから）

このアプリは `hp` リポジトリ内の `keihi-app/` フォルダに置かれています。新しいリポジトリを作らずに、サブフォルダを指定してそのままデプロイできます。

1. [Vercel](https://vercel.com) で「Add New… > Project」から `hp` リポジトリをインポート
2. **Root Directory** を `keihi-app` に設定（ここが重要。これでこのフォルダだけがビルドされます）
3. Framework Preset が「Next.js」になっていることを確認
4. **Environment Variables** に `.env.example` と同じ3つ（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `OPENAI_API_KEY`）を設定
5. デプロイ

> 治療院システム本体とは別のVercelプロジェクトとして登録してください。Root Directory が `keihi-app` になっているため、両者は独立してビルド・公開されます。

## Netlify デプロイ（このリポジトリのサブフォルダから）

Vercel の代わりに Netlify でも公開できます。同梱の `netlify.toml` により、Next.js Runtime（App Router・APIルート対応）が自動で適用されます。

1. [Netlify](https://app.netlify.com) で「Add new site > Import an existing project」から `hp` リポジトリを選択
2. **Base directory** を `keihi-app` に設定（Vercel の Root Directory に相当。これでこのフォルダだけがビルドされます）
3. Build command `npm run build` / Publish directory `.next` は `netlify.toml` で設定済み（自動入力されます）
4. **Environment variables** に3つ（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `OPENAI_API_KEY`）を設定
5. Deploy

> Base directory を `keihi-app` にしているため、治療院システム本体とは独立してビルド・公開されます。新しいリポジトリを作らなくても、`hp` リポジトリのまま公開できます。

## 補足：振込期日の通知について

通知は「アプリを開いたときに上部へ表示されるバナー」方式です。アプリを開いていなくても届くメール・LINE等のプッシュ通知が必要な場合は、Vercel Cron などの定期実行と組み合わせて拡張できます。
