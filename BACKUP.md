# バックアップと復旧

患者情報とカルテを扱うため、「取れていること」ではなく
**「戻せることを確認済みであること」** をもって運用可能とする。

## 現状（要対応）

| 項目 | 状態 |
|---|---|
| Supabase の自動バックアップ | プラン依存。**保持期間の確認が未実施** |
| 手動バックアップ | 未実施 |
| 復元テスト | **未実施** |

> Supabase の Free プランには自動バックアップが含まれない。
> 本番運用の前に Pro 以上へ切り替え、下記の復元テストまで完了させること。

## 1. バックアップ対象

| 対象 | 重要度 | 備考 |
|---|---|---|
| `patients` / `medical_records` | 最重要 | 診療録。復元不能は許容できない |
| `reservations` / `invoices` / `invoice_items` | 重要 | 売上と来院の記録 |
| `audit_logs` | 重要 | 監査証跡。改竄調査に必要 |
| `clinics` / `staff` / `menus` / `app_settings` | 通常 | マスタ。再作成は可能だが手間 |

## 2. 自動バックアップ（Supabase）

1. Supabase ダッシュボード → Database → Backups
2. Daily backup が有効であることを確認
3. 保持期間を記録する（Pro: 7日 / それ以上はプランによる）

## 3. 手動バックアップ

重要な変更（マイグレーション適用など）の直前に必ず取得する。

```bash
# 接続情報は Supabase ダッシュボード → Project Settings → Database から取得
pg_dump "postgresql://postgres:<password>@<host>:5432/postgres" \
  --no-owner --no-acl --format=custom \
  --file="backup_$(date +%Y%m%d_%H%M%S).dump"
```

取得したファイルは、本番DBとは別の場所に保管する。

## 4. 復元手順

**本番へ直接復元する前に、必ず検証プロジェクトで試すこと。**

```bash
# 1. 検証用の Supabase プロジェクトを用意する
# 2. 復元する
pg_restore --no-owner --no-acl --clean --if-exists \
  --dbname="postgresql://postgres:<password>@<検証host>:5432/postgres" \
  backup_20260817_120000.dump

# 3. 件数を突き合わせる
psql "<検証host>" -c "SELECT
  (SELECT count(*) FROM patients)        AS patients,
  (SELECT count(*) FROM medical_records) AS records,
  (SELECT count(*) FROM reservations)    AS reservations,
  (SELECT count(*) FROM invoices)        AS invoices;"
```

## 5. 一部だけ戻したい場合

全体を戻すと、それ以降の正常な更新まで巻き戻る。
1件〜数件の復旧は、まず論理削除の解除を試す。

```sql
-- 誤って削除したカルテを戻す
UPDATE medical_records SET deleted_at = NULL, deleted_by = NULL WHERE id = '<対象ID>';
```

監査ログから変更前の値を確認できる（`RUNBOOK.md` 第4章）。

## 6. 復元テスト（四半期ごと）

以下を実施し、日付と結果を本ファイル末尾に追記する。

1. 最新のバックアップを検証プロジェクトへ復元
2. 件数の突き合わせ（第4章の SQL）
3. 検証環境でアプリを起動し、患者検索・カルテ表示・会計一覧が正しく出ることを確認
4. 所要時間を記録する（障害時の復旧見込みに使う）

### 実施記録

| 実施日 | 実施者 | 結果 | 所要時間 | 備考 |
|---|---|---|---|---|
| （未実施） | | | | 本番運用前に必ず実施する |
