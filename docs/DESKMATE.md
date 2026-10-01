# ITO Claude Deskmate（Coucou ローカル検証版）

Coucou の既存体験（Mochi の外観・アニメーション・Hooks 連携）はそのままに、
**キャラクターへ仕事を頼むと Claude Code がバックグラウンドで起動し、最後まで自律実行する**機能を追加したもの。
Anthropic API は使わない。ユーザーの `claude` CLI のログイン（Claude サブスクリプション）で動く。

## いちばん簡単な始め方
ターミナルで次の1行を貼り付けて Enter（取得・ビルド・起動・ログイン確認まで全部やります。何度実行してもOK）:

```bash
D="$(ls -d ~/coucou-deskmate ~/*/coucou-deskmate ~/*/*/coucou-deskmate 2>/dev/null | head -1)"; [ -z "$D" ] && D=~/coucou-deskmate && git clone -b ito-claude-deskmate https://github.com/naoto07030113-design/HP.git "$D"; cd "$D" && git pull -q; bash scripts/deskmate-setup.sh
```

## 使い方

1. Coucou を開く（ノッチをクリック／メニューバー →「Claude に仕事を頼む…」）。
2. ヘッダーの 🔨 タブ（仕事を頼む）を開く。
3. 📁 で作業フォルダを選ぶ（今の Claude Code セッションの cwd／最近使ったフォルダ／任意のフォルダ）。毎回入力は不要、前回の選択を記憶。
4. 依頼を書いて送信（例:「このプロジェクトをビルドして、エラーがあれば直して」）。
5. Mochi が状態を表示: 考え中 → 作業中 → 検証中 →（承認待ち）→ 完了。ターミナル操作は不要。
6. 承認が必要な操作はノッチが自動で開く:「Claude Codeが以下の操作を要求しています ／ 拒否・今回許可・常に許可」。
7. 完了 → Mochi が finished。「フォルダを開く」「続けて指示…」「OK」。

🌐 ボタンで Claude in Chrome（`--chrome`）の利用を切り替え（既定オフ。Chrome 拡張を入れている場合にオン）。

## Codex（OpenAI）で仕事を頼む
🔨 タブ左の切替で **Claude / Codex** を選ぶ。Codex は `codex exec --json` で裏で動かし、
進捗・承認カード・Safety Guard・Finish Loop（自動検証と差し戻し）・返信での再開は Claude と同じように動く。

- 認証は Codex CLI の **ChatGPT ログイン**（`codex login`）。API キーは使わず、子プロセスから `OPENAI_API_KEY` / `CODEX_API_KEY` を外す。
  利用分は ChatGPT プランの Codex 利用枠から消費（枠を超えるとクレジット購入または待機）。
- **初回だけ**「Codex に Coucou の Hook を登録します」と出るので「登録して開始」を押す。
  `~/.codex/hooks.json` に Coucou の Hook を追記し（既存の Hook は残す・`hooks.json.bak-日時` を作成）、
  Codex 自身の設定 API（app-server `config/batchWrite`）で **Coucou の Hook だけ** を信頼済みにする。
  Coucou 外で使う普通の `codex` ではこの Hook は何もせず即終了する。
- サンドボックスは workspace-write。ネット接続などサンドボックス外の実行は Codex が承認を求め、それが Coucou の承認カードに出る
  （新規は `--approve-for-me`、再開は `approval_policy="on-request"` + `approvals_reviewer="auto_review"`。Coucou が答えない場合は Codex の自動レビューに回る）。
- Codex の承認カードには「常に許可」を出さない（Hook から恒久ルールを作れないため）。
- セッション ID は Codex が出す thread id を保存し、返信・再試行は `codex exec resume <thread>` で同じスレッドを続ける。

## 💬 チャットで GPT を使う
💬 タブの入力欄左の **Claude / GPT** ボタンで切替。GPT は Codex CLI（ChatGPT ログイン）経由で、読み取り専用サンドボックスで答える。
API キー不要・ChatGPT プランの Codex 利用枠を消費。会話の続きは同じ Codex スレッドを再開する。
初期値: Anthropic API キーがあれば Claude、なければ Codex が入っていれば GPT。

## ピル（Resend / n8n / Vercel / GitHub など）
初期状態ですべてオフ（このブランチの初回起動時に一度だけオフにする）。必要なものは Settings で再度オンにできる。

## 構成

```
Coucou UI (TaskComposerView / 既存の approval・question・error・finished ビュー)
   │ start / resume / cancel
TaskRunnerBridge ── AppState（ピル・Mochi 状態・自動展開）
   │
LocalTaskRunner ── TaskStore（tasks.json）
   │ ClaudeProcess: claude -p --session-id <taskID> --settings runner-settings.json
   │                --output-format stream-json --verbose --permission-mode acceptEdits
   ▼
Claude Code ── hooks ── "nb-hook runner"（COUCOU_TASK_ID 付き）── Unix socket ── HookServer ──► LocalTaskRunner.handleHook
```

| ファイル | 役割 |
|---|---|
| `TaskSession.swift` | `TaskSession` / `TaskStatus`、Claude に渡す標準プロンプト（GOAL + RULES）、完了マーカー解析 |
| `TaskStore.swift` | セッションと最近のフォルダを `~/Library/Application Support/NotchBuddy/tasks.json` に保存 |
| `ClaudeProcess.swift` | `claude` の検出（既定パス → ログインシェルの PATH）、起動・stream-json 読み取り・停止 |
| `LocalTaskRunner.swift` | 実行本体: Hook 処理、状態遷移、承認、Finish Loop、再開 |
| `TaskVerifier.swift` | Finish Loop の検証コマンド決定と実行 |
| `SafetyGuard.swift` | 自動許可しない危険操作の判定 |
| `TaskRunnerBridge.swift` | Runner ↔ 島 UI（macOS） |
| `TaskComposerView.swift` | 依頼入力ビューと、Runner タスク用の question / error / finished カード |

既存ファイルへの変更は最小限: `HookServer.swift`（`coucou_task_id` 付きイベントの振り分け、Runner 承認キュー、`nb-hook.py` の runner モード）、
`IslandTypes.swift`（`.task` ビュー、`ApprovalInfo.taskId/guardReason`）、ヘッダーのタブ 1 つ、メニュー項目 1 つ、各アラートビューの Runner 分岐。
Mochi の描画・サイズ・表情・アニメーション・マウス追従は無変更。VS Code セッションの既存経路も無変更。

### セッションと Hooks の対応付け
- `--session-id` に TaskSession の UUID を渡すので、Hook の `session_id` = タスク ID。
- さらに子プロセス環境に `COUCOU_TASK_ID` を設定し、`nb-hook runner` がペイロードに `coucou_task_id` として付ける。HookServer はこれで Runner へ回す（VS Code フィルタより前）。
- Runner 用 Hooks は `--settings` で渡すため `~/.claude/settings.json` は変更しない。グローバルに Coucou Hooks が入っていても、`COUCOU_TASK_ID` があり `runner` 引数がない呼び出しは何もせず終了するので二重通知にならない。

### 状態と Mochi
| TaskStatus | Mochi |
|---|---|
| queued / starting / planning | thinking |
| working | working（ブラウザ・Web 取得中は searching） |
| verifying | searching |
| waitingApproval | approval |
| waitingHuman | question |
| completed | finished |
| failed | error |

### Finish Loop
Claude が終了しようとすると（Stop Hook、タイムアウト 3600 秒）Coucou が検証を実行する。Claude の「終わりました」だけでは完了にしない。
- 検証コマンド: `.coucou/verify`（1 行 1 コマンド）があればそれ。なければ自動検出 —
  `package.json` の lint / typecheck / test / build（pnpm・yarn・bun・npm を自動判別）、`Package.swift` → `swift build`、`Cargo.toml`、`go.mod`。
- 失敗 → `{"decision":"block"}` で出力末尾を Claude に返し、修正・再検証させる。
- 上限 3 回（`runnerMaxVerifyRounds`）を超えたら failed。無限ループしない。
- 検証コマンドがないプロジェクトは「完了（自動検証なし）」と表示。
- 最終メッセージの `COUCOU_STATUS: NEEDS_HUMAN: …` → waitingHuman（ログイン切れ・MFA・CAPTCHA など）。「対応した・再開」または返信で `claude -p --resume` により同じセッションを続行。

### 承認と Safety Guard
- 通常の権限要求（PermissionRequest）は既存の承認ビューに表示。`-p` モードでもこの Hook は動作し、ユーザーのクリックまで待つ（最長 1 時間）。
- `SafetyGuard` に該当する操作は、ユーザーの許可ルールにかかわらず PreToolUse で止めて承認を求める（「常に許可」は出さない）:
  git push / reset --hard / clean、gh pr merge、本番 deploy（vercel/netlify --prod、firebase、fly、gcloud、terraform、kubectl…）、publish、
  rm -rf・find -delete 等の大量削除、DROP / TRUNCATE / DELETE FROM、破壊的マイグレーション、メール・Slack 等への送信、Stripe 操作、
  sudo / chmod -R、認証情報・`.env`・`~/.ssh`・`.claude/settings.json` の変更、外部送信系 MCP ツール（send/deploy/delete/merge/payment…）。
- 複数の承認が重なったらキューで順番に表示。

### 認証
- `claude` CLI のサブスクリプションログインを使う。子プロセスからは `ANTHROPIC_API_KEY` を外す（API 課金に切り替わらないように）。
- ブラウザのログイン状態を利用。パスワードを CLAUDE.md やソースに保存しないよう RULES で指示。

## 設定（`defaults write fr.louisraille.NotchBuddy <key> <value>`）
| キー | 既定 | 内容 |
|---|---|---|
| `claudeCLIPath` | 自動検出 | `claude` のパス |
| `runnerPermissionMode` | `acceptEdits` | `--permission-mode`（`default` にするとファイル編集も毎回承認） |
| `runnerMaxVerifyRounds` | 3 | Finish Loop の最大差し戻し回数 |
| `runnerUseChrome` | false | `--chrome` を付ける（🌐 ボタンと同じ） |
| `runnerEngine` | `claude` | 🔨 タブの既定エンジン（`claude` / `codex`） |
| `codexCLIPath` | 自動検出 | `codex` のパス |
| `chatProvider` | 自動 | 💬 チャットの相手（`claude` / `gpt`） |

ログ: `~/Library/Application Support/NotchBuddy/tasks/<task-id>.log`（stream-json と stderr）。

## 前提
- `claude` CLI がインストール済みでログイン済み（`claude` を一度ターミナルで起動してログイン）。
- Hook リレーは既存どおり `/usr/bin/python3` を使うため Xcode Command Line Tools が必要（`xcode-select --install`）。
  Hook が 45 秒届かないとタスクに警告を表示。
- App Store ビルド（サンドボックス）では無効（タブ・メニューを出さない）。

## 検証済みの内容（Linux 上、実際の Claude Code CLI で実施）
Runner コア（Foundation のみのファイル）を Swift 6.0（strict concurrency）でビルドし、実際の `claude` CLI・
`HookServer.swift` から抽出した実物の `nb-hook.py` で E2E 実行:
1. build-fix: ビルドが壊れたプロジェクト → 承認 2 回 → 修正 → Coucou 検証（test → build）OK → completed（検証済み）
2. finish-loop: 1 回目の検証失敗 → Stop を block → Claude が修正 → 2 回目 OK → completed
3. guard: `git push` を SafetyGuard が PreToolUse で止める → 拒否 → push せずに完了
4. needs-human: NEEDS_HUMAN → waitingHuman → 返信で `--resume` → completed
加えて SafetyGuard・マーカー解析・検証計画・Codex 連携などの単体テスト 67 件。

Codex（codex-cli 0.159.3）は ChatGPT ログインができない環境のため、モデルだけをローカルのモック（Responses API 互換）に差し替え、
実物の Codex CLI・Hook・`CodexSetup`・Runner で検証: Hook 登録と信頼（未登録 → ready）、Finish Loop の差し戻し → 完了、
同じスレッドでの再開、`git push` を Safety Guard が拒否、サンドボックス外実行（ネット）の承認カード → 許可、
`hooks.json` の重複除去、GPT チャットのスレッド継続。実際の GPT の応答品質は Mac 上で確認すること。
macOS UI 部分（SwiftUI/AppKit）は GitHub Actions の macOS ビルドでコンパイル確認。実機での島 UI の目視確認は Mac で行うこと。

## 今後（MVP 外）
- **ITOClaudeRunner**: Runner を UI から分離し launchd 常駐（Coucou を閉じてもタスク継続）。
  `LocalTaskRunner` / `ClaudeProcess` / `TaskStore` / `TaskVerifier` / `SafetyGuard` は AppKit 非依存なのでそのまま移せる。
  Coucou ⇄ Runner は既存と同じ Unix socket + 1 行 JSON で `start/resume/cancel/list` と状態通知を流す想定。
- 1 プロジェクトの並列タスク制御、タスク履歴ビュー、検証コマンドの UI 設定。

## ライセンス上の注意
コードは MIT。ただし名前「Coucou」「Mochi」、キャラクター、アイコン、サウンドは作者の権利物（`LICENSE-ASSETS.md`）。
ローカルでのビルド・利用は可能だが、社内外へ配布する場合は独自の名前・アイコン・キャラクター・サウンドに差し替えること。
