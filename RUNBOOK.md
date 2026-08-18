# 障害対応手順（RUNBOOK）

「何かおかしい」と連絡を受けたときに、上から順にたどる。

## 0. まず確認する

```bash
curl -s https://<本番ドメイン>/api/v1/health | jq
```

| 応答 | 意味 | 次にすること |
|---|---|---|
| `status: "ok"` (200) | アプリもDBも正常 | 第2章「特定の操作だけ失敗する」へ |
| `status: "degraded"` (503) | 依存先に異常 | `checks` の `detail` を読む。第1章へ |
| 応答なし / タイムアウト | アプリが起動していない | Vercel のデプロイ状況を確認。第3章へ |

`checks` の見方:

- `config` が error → 環境変数の設定漏れ。`detail` に不足している変数名が出る
- `database` が error → Supabase 側の障害かキーの失効

## 1. リクエストIDから原因を特定する

画面に出るエラーには識別子が添えられている（例: `NOT_FOUND / req_dc78b586ba5346cb8cef`）。
利用者にこの文字列を教えてもらう。

1. Vercel のログ検索で `req_dc78b586ba5346cb8cef` を検索する
2. そのリクエストの `リクエスト受信` から `リクエスト失敗` までが一続きで出る
3. `detail` に開発者向けの原因が入っている（利用者の画面には出していない）

```json
{"level":"warn","message":"リクエスト失敗","requestId":"req_dc78...",
 "route":"/api/v1/appointments/cancel","errorCode":"NOT_FOUND",
 "detail":"reservationId=... の電話番号が一致しません（本人確認失敗）"}
```

識別子が分からない場合は、時刻と `route` で絞り込む。

## 2. エラーコード別の対処

| コード | 意味 | 対処 |
|---|---|---|
| `UNAUTHENTICATED` / `SESSION_EXPIRED` | トークンが無い・期限切れ | 再ログインを案内。頻発するならセッション設定を確認 |
| `FORBIDDEN` | 権限不足 | そのアカウントの `app_metadata.role` を確認 |
| `CLINIC_SCOPE_VIOLATION` | 所属院が未設定、または他院のデータ | `app_metadata.clinic_id` を設定する |
| `VALIDATION_FAILED` | 入力不備 | `fields` に項目別の理由が入る。画面側の案内文を見直す |
| `APPOINTMENT_CONFLICT` | 予約の重複 | 想定内。利用者に別の枠を案内 |
| `RATE_LIMITED` | 短時間に集中 | 想定内。攻撃が疑われる場合は `ip_address` で監査ログを確認 |
| `DEPENDENCY_UNAVAILABLE` | DB等に到達できない | 第1章のヘルスチェックへ戻る |
| `INTERNAL` | 想定外 | ログの `stack` を確認。再現手順を控えて修正する |

## 3. アプリが起動しない

1. Vercel のデプロイログでビルド失敗を確認
2. 直前のデプロイに問題があるなら **即座に切り戻す**
   Vercel ダッシュボード → Deployments → 正常だったデプロイ → Promote to Production
3. 切り戻し後、`/api/v1/health` が `ok` に戻ることを確認
4. 原因調査は切り戻したあとで行う

## 4. データがおかしい（消えた・書き換わった）

1. 監査ログで該当操作を特定する

```sql
SELECT occurred_at, action, actor_id, actor_role, target_id, result,
       before_value, after_value, request_id
FROM audit_logs
WHERE target_type = 'reservation' AND target_id = '<対象ID>'
ORDER BY occurred_at DESC;
```

2. `before_value` に変更前の値が入っている（個人情報は伏字）
3. 復元が必要なら `BACKUP.md` の復旧手順へ

論理削除に移行済みのテーブル（patients / reservations / medical_records / invoices）は
物理削除されていないため、`deleted_at` を `NULL` に戻せば復元できる。

```sql
UPDATE medical_records SET deleted_at = NULL, deleted_by = NULL WHERE id = '<対象ID>';
```

## 5. 患者情報の漏洩が疑われる

1. 直ちに該当機能を停止する（Vercel で該当デプロイを切り戻す）
2. 監査ログで参照範囲を確認する

```sql
SELECT occurred_at, action, actor_id, ip_address, after_value
FROM audit_logs
WHERE action IN ('appointment.lookup', 'patient.view')
  AND occurred_at > NOW() - INTERVAL '7 days'
ORDER BY occurred_at DESC;
```

3. Supabase ダッシュボードで anon に付いているポリシーを確認する

```sql
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND 'anon' = ANY(roles) ORDER BY tablename;
```

`reservations` と `patients` に anon のポリシーが存在してはならない。

4. 影響範囲が確定するまで、関係者以外に詳細を共有しない

## 6. 連絡先

| 事象 | 一次対応 |
|---|---|
| アプリ停止・データ喪失・情報漏洩 | 即座にエスカレーション |
| 特定機能の不具合 | 再現手順とリクエストIDを添えて起票 |
| 問い合わせ | 監査ログで事実確認してから回答 |
