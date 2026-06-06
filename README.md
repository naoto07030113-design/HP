# Pre-Site Sales AI Engine

AI事前制作型HP営業システム — HP未保有または集客力が弱い中小企業を対象に、Web診断・LP構成案生成・営業メール生成・営業活動管理を一元管理するB2B SaaS。

## 技術スタック

| 層 | 技術 |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS |
| UI | shadcn/ui + Radix UI |
| Backend | Next.js Route Handlers |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| AI | OpenAI GPT-4o-mini |
| Hosting | Vercel |

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/YOUR_ORG/presales-ai-engine.git
cd presales-ai-engine
npm install
```

### 2. Supabase設定

1. [Supabase](https://supabase.com) でプロジェクトを新規作成
2. **SQL Editor** を開き、`supabase/migrations/001_initial_schema.sql` の内容をすべてコピー＆実行
3. **Authentication > Providers > Google** を有効化し、Google Cloud Console で OAuth 2.0 クライアントIDを作成してクライアントID・シークレットを設定
4. **Authentication > URL Configuration** の「Redirect URLs」に `https://YOUR_DOMAIN/auth/callback` を追加（ローカルは `http://localhost:3000/auth/callback`）

### 3. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集：

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENAI_API_KEY=sk-your_openai_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Supabase のキーは **Project Settings > API** から取得してください。

### 4. ローカル起動

```bash
npm run dev
```

`http://localhost:3000` にアクセスし、**Googleアカウント**でログインしてください。

---

## 主要機能

### 顧客管理

- 事業者の手動登録（事業者名・業種・住所・電話・メール・HP URL・GoogleMap URL）
- CSVファイルによる一括インポート
- ステータス管理（新規 / 連絡済 / 商談中 / 契約済 / 失注）

### Web診断AI

口コミ情報・競合情報を入力してAI分析を実行：

- HP有無判定・Web集客力スコア
- HP未保有確率
- 競合差分スコア
- AIの分析根拠（reasoning）を全件保存

### LP構成案生成

AIが以下のセクションで構成されたLP案を生成：

- ファーストビュー
- 選ばれる理由
- サービス紹介
- 強み
- FAQ
- CTA

### 営業メール生成

- 押し売りなし・相手の強みを褒める文体
- 件名・本文を生成・保存
- コピー機能付き

### 営業活動ログ

送信 → 開封 → 返信 → 商談 → 見積 → 契約 → 失注 のタイムライン記録

---

## CSVインポート方法

`/businesses/import` ページからCSVをアップロードします。

### CSVフォーマット（1行目はヘッダー）

```csv
事業者名,業種,住所,電話,メール,HP,GoogleMapURL
田中歯科クリニック,歯科医院,東京都新宿区西新宿1-1-1,03-1234-5678,info@tanaka-dental.com,,https://maps.google.com/...
```

| カラム名 | 必須 | 説明 |
|---|---|---|
| 事業者名 | ✓ | 事業者の正式名称 |
| 業種 | | 例：歯科医院、美容院 |
| 住所 | | 所在地 |
| 電話 | | 電話番号 |
| メール | | メールアドレス |
| HP | | HP URL |
| GoogleMapURL | | GoogleマップのURL |

---

## データベーススキーマ

```
businesses         → 事業者マスタ
web_presence_scores → Web診断結果（全履歴保存）
competitors        → 競合情報
reviews            → 口コミ情報
predictions        → 契約確率・優先度スコア
lp_variants        → LP構成案
outreach_messages  → 営業メール
outreach_events    → 営業活動ログ
```

スコア計算式：

```
web_presence_score = website_quality * 0.35 + sns * 0.15 + review * 0.15 + competitor_gap * 0.25 + confidence * 0.10
no_hp_probability = 1 - website_quality_score
priority_score = no_hp_probability * 0.30 + competitor_gap * 0.25 + revenue_uplift * 0.25 + contract_probability * 0.20
```

---

## Vercelデプロイ方法

1. GitHubリポジトリを作成してプッシュ
2. [Vercel](https://vercel.com) でプロジェクトをインポート
3. Environment Variables に `.env.local` の内容を設定
4. `NEXT_PUBLIC_APP_URL` を本番URLに変更
5. デプロイ実行

---

## 必須画面一覧

| URL | 説明 |
|---|---|
| `/login` | ログイン |
| `/dashboard` | ダッシュボード |
| `/businesses` | 事業者一覧 |
| `/businesses/new` | 新規登録 |
| `/businesses/import` | CSVインポート |
| `/businesses/[id]` | 事業者詳細 |
| `/businesses/[id]/analysis` | Web診断 |
| `/businesses/[id]/lp` | LP構成案 |
| `/businesses/[id]/outreach` | 営業メール |
| `/businesses/[id]/events` | 活動ログ |
| `/settings` | 設定 |
