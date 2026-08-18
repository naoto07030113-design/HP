# アーキテクチャ

治療院総合システムの構成と、それぞれの層が何に責任を持つかをまとめる。

## 全体像

```
ブラウザ
  │  Authorization: Bearer <access_token>
  │  x-request-id: req_xxxxx
  ▼
middleware.ts                    リクエストID付与・セキュリティヘッダ
  ▼
/api/v1/*                        API ルート（薄く保つ）
  ▼
src/server/http/handler.ts       ← すべての API が必ず通る共通処理
  ├─ 認証        server/auth/session.ts
  ├─ 認可        server/permissions/policy.ts
  ├─ 入力検証    server/validators/*
  ├─ 業務処理    server/services/*
  ├─ DBアクセス  server/repositories/*
  ├─ 監査ログ    server/logging/auditLog.ts
  └─ エラー整形  server/errors/AppError.ts
  ▼
Supabase (PostgreSQL)
```

### 移行中であること

このシステムは元々「ブラウザから Supabase を直接操作する」構成だった。
現在は API 経由へ段階的に移している途中で、両方の経路が併存している。

| 領域 | 現在の経路 |
|---|---|
| 予約の照会・キャンセル・日時変更・空き枠 | **API 経由**（移行済み） |
| Web予約の登録 | `/api/intake`（移行済み） |
| 患者の一覧・詳細・登録・更新・削除 | **API 経由**（移行済み） |
| カルテの一覧・詳細・作成・更新・削除 | **API 経由**（移行済み） |
| 会計・シフト・その他の管理画面 | ブラウザから直接（未移行） |

未移行の部分は `src/lib/*-store.ts` がブラウザから Supabase を直接呼ぶ。
移行の順序は `PROJECT_STATE.md` を参照。

## 各層の責務

### Frontend（`src/app` / `src/features` / `src/components`）

表示・入力・操作に専念する。以下は Frontend だけで完結させない。

- 権限判定（`PermissionGuard` は表示の出し分けのみ。強制は API 側）
- 料金の確定
- 予約の空き判定
- 重要データの検証（フロントで検証してもサーバーで必ず再検証する）

### `src/server/`

ブラウザに配信されないコード。ここに業務ルールとデータ保護を集約する。

| ディレクトリ | 責務 |
|---|---|
| `auth/` | アクセストークンの検証、ロールと所属院の解決 |
| `permissions/` | RBAC と所属院スコープの判定 |
| `validators/` | zod スキーマ。フロントと共有する |
| `services/` | 業務ロジック。トランザクション境界 |
| `repositories/` | DB アクセス。SQL はここだけ |
| `logging/` | 構造化ログ・監査ログ |
| `errors/` | 例外とエラーコード、外部へ返す形 |
| `http/` | 共通ハンドラ、レート制限 |

### API の約束ごと

**成功時**

```json
{ "success": true, "data": { ... }, "requestId": "req_xxxxx" }
```

**失敗時**

```json
{
  "success": false,
  "error": {
    "code": "APPOINTMENT_CONFLICT",
    "message": "この時間帯には既に予約があります。",
    "fields": [{ "field": "phone", "message": "電話番号は10桁または11桁で入力してください" }],
    "requestId": "req_xxxxx"
  }
}
```

- `message` は利用者にそのまま見せてよい文言だけを入れる
- 開発者向けの詳細（`detail`）はログにのみ出力し、レスポンスには含めない
- `code` は `src/server/errors/AppError.ts` の `ERROR_CODES` が唯一の定義元
- HTTP ステータスも同ファイルの対応表で決まる

## 認証

セッションは localStorage に保持されるため Cookie は飛ばない。
そのためクライアントは `Authorization: Bearer <access_token>` を明示的に付ける
（`src/lib/api-client.ts` が自動で付与する）。

ロールと所属院は **`app_metadata` からのみ** 読む。
`user_metadata` は本人が書き換えられるため信頼しない。

| ロール | 想定 |
|---|---|
| `admin` | 本部管理者。全院を横断できる |
| `staff` | 施術者。自院の患者・カルテ・会計 |
| `receptionist` | 受付。自院の患者・予約・会計閲覧 |

`app_metadata.role` が未設定のアカウントは `receptionist`（最小権限）として扱う。

## ログとデバッグ

すべてのログは 1 行 1 JSON で出力され、`requestId` を含む。

```json
{"ts":"2026-08-17T10:47:00.505Z","level":"warn","env":"production",
 "message":"リクエスト失敗","requestId":"req_dc78b586ba5346cb8cef",
 "route":"/api/v1/appointments/cancel","method":"POST","status":404,
 "errorCode":"NOT_FOUND","durationMs":8,
 "detail":"reservationId=... の電話番号が一致しません（本人確認失敗）"}
```

画面に表示されるエラーには `requestId` が添えられる。
利用者から「エラーが出た」と連絡を受けたら、その ID でログを検索すれば
該当リクエストの全経過が特定できる。

ログ出力前に必ず伏字処理（`src/server/logging/logger.ts` の `redact`）を通す。
パスワード・トークンは値ごと削除、患者氏名・電話番号・カルテ本文は
`[redacted:12]` のように長さだけ残す。

## 診療録の扱い

カルテは上書きしても前の内容が消えない構造にしている。

```
medical_records              常に最新版だけを持つ（画面表示はこれを使う）
medical_record_revisions     更新・削除のたびに、変更前の全内容を1行積む（追記のみ）
```

改訂履歴には診療内容がそのまま入る（復元と監査のために伏字にしない）。
そのため参照できるのは管理者のみで、`POST /api/v1/medical-records/revisions` から取得する。

履歴の保存に失敗しても診療業務は止めない。ただし必ずエラーログに残すので、
`カルテ改訂履歴の保存に失敗しました` が出ていたらマイグレーションの適用状況を確認する。

## 関連ドキュメント

- `PROJECT_STATE.md` — 現在の作業状況と次の一手
- `SECURITY.md` — 権限・データ保護の方針
- `DATABASE.md` — テーブル構成とマイグレーション
- `RUNBOOK.md` — 障害対応手順
- `BACKUP.md` — バックアップと復旧
