#!/bin/bash
# ITO Claude Deskmate — まとめてセットアップ & 起動（macOS）
#   bash scripts/deskmate-setup.sh
# 何度実行しても大丈夫です（最新を取得 → ビルド → 入れ替え → 起動 → ログイン確認）。
set -u

REPO="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$HOME/Applications"
LOG="$REPO/NotchBuddy/build/deskmate-build.log"

say()  { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓ %s\033[0m\n' "$1"; }
warn() { printf '  \033[33m! %s\033[0m\n' "$1"; }
die()  { printf '\n\033[1;31m✗ %s\033[0m\n' "$1"; exit 1; }

# GUI から起動された場合にも Homebrew / npm のコマンドが見えるように
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"

# ---------------------------------------------------------------- 1. 前提
say "1/6 必要なものを確認"
[ "$(uname)" = "Darwin" ] || die "Mac で実行してください。"

if ! xcodebuild -version >/dev/null 2>&1; then
  if [ -d /Applications/Xcode.app ]; then
    warn "Xcode を使う設定にします（Mac のパスワードを聞かれます）"
    sudo xcode-select -s /Applications/Xcode.app/Contents/Developer || die "xcode-select に失敗しました。"
    sudo xcodebuild -license accept >/dev/null 2>&1 || true
  else
    die "Xcode がありません。App Store で「Xcode」をインストールして一度起動してから、もう一度実行してください。"
  fi
fi
ok "Xcode $(xcodebuild -version | head -1 | awk '{print $2}')"

if ! command -v brew >/dev/null 2>&1; then
  die "Homebrew がありません。https://brew.sh の1行コマンドでインストールしてから、もう一度実行してください。"
fi
if ! command -v xcodegen >/dev/null 2>&1; then
  warn "XcodeGen をインストールします"
  brew install xcodegen >/dev/null || die "XcodeGen のインストールに失敗しました。"
fi
ok "XcodeGen"

# ---------------------------------------------------------------- 2. 最新を取得
say "2/6 最新版を取得"
cd "$REPO" || die "フォルダに入れません: $REPO"
if git pull --ff-only -q 2>/dev/null; then
  ok "$(git log --oneline -1)"
else
  warn "取得できませんでした（ネット接続 or 手元の変更）。手元の版でビルドします。"
fi

# ---------------------------------------------------------------- 3. ビルド
say "3/6 ビルド（初回は数分かかります）"
cd "$REPO/NotchBuddy" || die "NotchBuddy フォルダがありません。"
mkdir -p build
xcodegen generate --quiet >/dev/null 2>&1 || xcodegen >/dev/null || die "プロジェクト生成に失敗しました。"
if ! xcodebuild -scheme NotchBuddy -configuration Debug -derivedDataPath build build >"$LOG" 2>&1; then
  grep -E "error:" "$LOG" | head -20
  die "ビルドに失敗しました。ログ: $LOG （この内容を Claude に送ってください）"
fi
BUILT="$REPO/NotchBuddy/build/Build/Products/Debug/Coucou.app"
[ -d "$BUILT" ] || die "ビルド結果が見つかりません: $BUILT"
ok "ビルド成功"

# ---------------------------------------------------------------- 4. 入れ替えて起動
say "4/6 Coucou を入れ替えて起動"
osascript -e 'tell application "Coucou" to quit' >/dev/null 2>&1 || true
sleep 1
pkill -x Coucou >/dev/null 2>&1 || true
mkdir -p "$APP_DIR"
rm -rf "$APP_DIR/Coucou.app"
ditto "$BUILT" "$APP_DIR/Coucou.app" || die "アプリのコピーに失敗しました。"
open "$APP_DIR/Coucou.app" || die "起動に失敗しました。"
ok "起動しました（$APP_DIR/Coucou.app）"

# ---------------------------------------------------------------- 5. Claude Code
say "5/6 Claude Code（claude）"
if ! command -v claude >/dev/null 2>&1; then
  warn "Claude Code をインストールします"
  curl -fsSL https://claude.ai/install.sh | bash >/dev/null 2>&1 || true
  export PATH="$HOME/.local/bin:$PATH"
fi
if command -v claude >/dev/null 2>&1; then
  if claude auth status --json 2>/dev/null | grep -q '"loggedIn": *true'; then
    ok "ログイン済み"
  else
    warn "ブラウザが開くので、Claude のアカウント（サブスクリプション）でログインしてください"
    claude auth login || warn "あとでターミナルで「claude auth login」を実行してください"
  fi
else
  warn "Claude Code を入れられませんでした。https://claude.com/claude-code の手順でインストールしてください"
fi

# ---------------------------------------------------------------- 6. Codex
say "6/6 Codex（codex）"
if ! command -v codex >/dev/null 2>&1; then
  warn "Codex をインストールします"
  if command -v npm >/dev/null 2>&1; then
    npm install -g @openai/codex >/dev/null 2>&1 || brew install codex >/dev/null 2>&1 || true
  else
    brew install codex >/dev/null 2>&1 || true
  fi
fi
if command -v codex >/dev/null 2>&1; then
  STATUS="$(codex login status 2>&1)"
  if echo "$STATUS" | grep -qi "not logged in"; then
    warn "ブラウザが開くので、ChatGPT のアカウントでログインしてください"
    codex login || warn "あとでターミナルで「codex login」を実行してください"
  elif echo "$STATUS" | grep -qi "api key"; then
    warn "Codex が API キーでログインしています（従量課金）。ChatGPT ログインに切り替えるには: codex logout && codex login"
  else
    ok "ログイン済み"
  fi
else
  warn "Codex を入れられませんでした（Codex を使わないなら無視して大丈夫です）"
fi

printf '\n\033[1;32m完了！\033[0m ノッチの Mochi をクリック →「🔨」タブで仕事を頼めます。\n'
printf '（メニューバーの Coucou アイコン →「Claude に仕事を頼む…」でも開きます）\n\n'
