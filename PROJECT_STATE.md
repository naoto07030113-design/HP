# Project

治療院総合システム（naoto07030113-design/hp）

複数院の鍼灸整骨院向け。予約・患者・電子問診・カルテ・会計・CRM・スタッフ・シフト・
経営分析を一元管理する業務基幹システム。長期運用が前提。

# Purpose

「動くアプリ」ではなく、安全に運用でき、異常に気づけて、原因を追跡でき、
データを戻せる業務基幹システムにする。

# CORE

| 層 | 技術 |
|---|---|
| Frontend | Next.js 14 App Router / TypeScript / Tailwind / Radix UI |
| Backend | `src/server/`（services / repositories / auth / permissions / logging） |
| API | `/api/v1/*`（`src/server/http/handler.ts` を必ず通す） |
| DB | Supabase (PostgreSQL) |
| Hosting | Vercel |

構造の詳細は `ARCHITECTURE.md`。

# CURRENT

**バックエンドへの段階的移行（第1段階まで完了）**

現在は「ブラウザから直接 Supabase」と「API 経由」が併存している。
予約まわりは移行済み。管理画面は未移行。

次に着手するのは **管理画面の patients 領域を API 経由へ移すこと**。

# DECISIONS

- **ディレクトリを frontend/ と backend/ に二分割しない。** Next.js の推奨構成から
  外れるため、`src/server/`（ブラウザに配信されない）に backend 相当を置く形にした。
- **認証は Bearer トークンで渡す。** セッションが localStorage にあり Cookie が
  飛ばないため。Cookie 方式（@supabase/ssr）への移行は影響範囲が大きく、後回し。
- **ロールは `app_metadata` のみを見る。** `user_metadata` は本人が書き換えられる。
- **未設定のロールは `receptionist`（最小権限）。** 以前は `admin` 扱いだった。
- **環境変数が無ければ起動を失敗させる。** 以前は本番へ暗黙にフォールバックしていた。
- **監査ログの書き込み失敗で業務を止めない。** ただし必ずエラーログには残す。
- **レート制限はプロセス内メモリ。** サーバーレスでは完全ではないが、無いよりよい。
  本格運用時に Redis へ差し替える。

# COMPLETED

- 全画面の実操作による監査。院未選択で空白になる不具合、集計が¥0になる競合、
  保存失敗の無通知など、実バグを修正
- 患者向け予約サイトの演出（背景・遷移・完了時の演出・1分セルフケア）
- アーキテクチャとセキュリティの全体調査（P0 10件 / P1 11件を特定）
- **バックエンド基盤の新設** — エラー体系・構造化ログ・リクエストID・認証・認可・
  zod 検証・共通ハンドラ・レート制限・ヘルスチェック・middleware
- **P0 の情報漏洩を封鎖** — 未認証で全予約が読めた問題、他人の予約を書き換えられた問題を
  API 経由に置き換えて解消。通信を実測し、他の患者の情報が流れないことを確認済み
- Next.js を 14.2.35 へ更新（critical CVE の解消）
- 監査ログ・操作者記録・論理削除のマイグレーション作成（**未適用**）
- ドキュメント整備（ARCHITECTURE / SECURITY / RUNBOOK / BACKUP / PROJECT_STATE）

# NEXT

1. **`supabase/migrations/008_audit_and_soft_delete.sql` を適用する**
   （バックアップ取得後。適用しないと監査ログが保存されない）
2. `CLINIC_SERVICE_ROLE_KEY` を Vercel に設定する（**必須になった**。未設定だと予約APIが動かない）
3. 管理画面を API 経由へ移行（patients → appointments → medical-records → billing）
4. RLS に `clinic_id` 条件を導入し、院をまたいだアクセスを DB 側でも遮断
5. 論理削除をアプリ側に反映（現在は物理削除のまま）
6. 自動テスト（会計計算・予約重複判定から）と CI（lint / typecheck / build / test）
7. 監視とアラート、ステージング環境

# OPEN ISSUES

| 優先 | 内容 |
|---|---|
| P0 | 管理画面がブラウザから Supabase を直接操作しており、院をまたいだ制限が効かない |
| P0 | RLS が `authenticated` に全テーブル全操作を許可している |
| P0 | 論理削除がアプリ側に未反映（DB列は追加済みだが、コードは物理削除のまま） |
| P0 | バックアップの復元テストが未実施 |
| P1 | `.catch(() => {})` による保存失敗の握りつぶしが管理画面に残っている |
| P1 | 一覧のページネーション未実装（Supabase の 1000行上限で集計が静かに狂う） |
| P1 | `/api/line/notify` が無認証で一斉配信できる |
| P1 | 自動テスト 0件、CI/CD 未整備 |
| P2 | ログイン失敗時のレート制限、セッション有効期限 |
| P2 | 巨大ファイルの責務分離（957行 / 669行 / 600行） |

# LAST UPDATED

2026-08-17
