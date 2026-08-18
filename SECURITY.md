# セキュリティ方針

## 原則

1. **ログインできることと、すべてを見られることを同義にしない**
2. **画面で隠すことをアクセス制御と呼ばない** — 実際の制御はサーバー側で行う
3. **フロントで検証してもサーバーで必ず再検証する**
4. **迷ったら権限を狭い側に倒す** — 未設定は最小権限として扱う

## 認証

- セッションは Supabase Auth が管理する
- API へは `Authorization: Bearer <access_token>` で渡す（Cookie は使っていない）
- サーバーは毎回 Supabase にトークンを問い合わせて検証する

## 認可

ロールと所属院は **`app_metadata` からのみ** 読む。

`user_metadata` は利用者本人が `auth.updateUser()` で書き換えられる。
以前はそちらを優先して読んでいたため、受付スタッフが自分を管理者に
昇格できる状態だった。現在は `app_metadata` のみを見る。

権限の対応表は `src/server/permissions/policy.ts` が唯一の定義元。

### ユーザーの作り方

Supabase ダッシュボード → Authentication → Users → 対象ユーザー →
**App Metadata** に以下を設定する（User Metadata ではない）。

```json
{ "role": "staff", "clinic_id": "<院のUUID>" }
```

- `role`: `admin` / `staff` / `receptionist`
- `clinic_id`: `admin` 以外は必須。未設定だとデータが表示されない
- 退職者は Supabase 側でユーザーを無効化する

## 患者データの保護

| データ | 匿名（患者）からの参照 |
|---|---|
| 院・メニュー・お知らせ・休診日・物販 | 可（公開情報） |
| 予約 | **不可**。API が本人確認のうえ本人の分だけ返す |
| 患者情報・カルテ・会計 | **不可** |
| 勤務シフト | **不可**。空き枠は API がサーバー側で算出する |

患者向けの予約操作は次の API に一本化されている。

| エンドポイント | 本人確認 |
|---|---|
| `POST /api/v1/appointments/availability` | 不要（空き時刻のみ返す） |
| `POST /api/v1/appointments/lookup` | 電話番号 |
| `POST /api/v1/appointments/cancel` | 予約ID＋電話番号 |
| `POST /api/v1/appointments/reschedule` | 予約ID＋電話番号 |

「予約IDは存在するが電話番号が違う」場合も `NOT_FOUND` を返し、
IDの存在自体を推測させない。

## ログに残さないもの

`src/server/logging/logger.ts` の `redact` を必ず通す。

- **値ごと削除**: パスワード、アクセストークン、APIキー、Cookie
- **長さのみ記録**: 患者氏名、電話番号、住所、生年月日、カルテ本文、既往歴、服薬、アレルギー

## 秘密情報

- `.env` は絶対にコミットしない（`.gitignore` 済み）
- 環境変数が未設定なら**起動を失敗させる**。本番へ暗黙にフォールバックしない
- `CLINIC_SERVICE_ROLE_KEY` は RLS を迂回する。サーバー側でのみ使い、
  必ず `src/server/http/handler.ts` の認証・認可を通してから到達させる

## 残っている課題

`PROJECT_STATE.md` の「OPEN ISSUES」を参照。とくに以下は未対応。

- 管理画面がブラウザから Supabase を直接操作している（院をまたいだ制限が効かない）
- RLS に `clinic_id` 条件が入っていない
- ログイン失敗時のレート制限、セッションの有効期限
