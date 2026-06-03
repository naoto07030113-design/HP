/**
 * このスクリプトをローカルで一度だけ実行して GMAIL_REFRESH_TOKEN を取得します。
 * 使い方: node scripts/get-gmail-token.js
 */
import { google } from 'googleapis';
import readline from 'readline/promises';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('環境変数 GMAIL_CLIENT_ID と GMAIL_CLIENT_SECRET を設定してください');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
  ],
  prompt: 'consent',
});

console.log('\n以下のURLをブラウザで開いて認証してください:\n');
console.log(authUrl);
console.log('');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const code = await rl.question('認証コードを貼り付けてください: ');
rl.close();

const { tokens } = await oauth2Client.getToken(code.trim());
console.log('\n✅ 取得成功! 以下の値を GitHub Secrets に登録してください:\n');
console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
