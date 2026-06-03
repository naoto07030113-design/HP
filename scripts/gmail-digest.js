import { google } from 'googleapis';
import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

async function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

async function fetchNewEmails(gmail, hoursAgo = 6) {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const after = Math.floor(since.getTime() / 1000);

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: `after:${after} -from:me`,
    maxResults: 50,
  });

  const messages = res.data.messages || [];
  if (messages.length === 0) return [];

  const emails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = detail.data.payload.headers;
      const get = (name) =>
        headers.find((h) => h.name === name)?.value || '';

      const snippet = detail.data.snippet || '';

      return {
        from: get('From'),
        subject: get('Subject'),
        date: get('Date'),
        snippet,
      };
    })
  );

  return emails;
}

async function summarizeWithClaude(emails) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const emailList = emails
    .map(
      (e, i) =>
        `[${i + 1}] 送信者: ${e.from}\n件名: ${e.subject}\n日時: ${e.date}\n内容プレビュー: ${e.snippet}`
    )
    .join('\n\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `以下の受信メール一覧を日本語で簡潔に要約してください。重要度が高いものや返信が必要そうなものを優先して教えてください。\n\n${emailList}`,
      },
    ],
  });

  return message.content[0].text;
}

async function sendSummaryEmail(summary, emailCount) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.RECIPIENT_EMAIL,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });

  const now = new Date().toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  await transporter.sendMail({
    from: process.env.RECIPIENT_EMAIL,
    to: process.env.RECIPIENT_EMAIL,
    subject: `📬 Gmail ダイジェスト（${emailCount}件）- ${now}`,
    text: `Gmail ダイジェストレポート\n生成日時: ${now}\n新着メール数: ${emailCount}件\n\n${summary}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a73e8;">📬 Gmail ダイジェスト</h2>
        <p style="color: #666;">生成日時: ${now} | 新着メール: <strong>${emailCount}件</strong></p>
        <hr style="border: 1px solid #e0e0e0;">
        <div style="white-space: pre-wrap; line-height: 1.8; color: #333;">${summary.replace(/\n/g, '<br>')}</div>
        <hr style="border: 1px solid #e0e0e0;">
        <p style="color: #999; font-size: 12px;">このメールは自動送信されました（6時間ごと）</p>
      </div>
    `,
  });
}

async function main() {
  console.log('Gmail ダイジェスト開始...');

  const gmail = await getGmailClient();
  const emails = await fetchNewEmails(gmail, 6);

  if (emails.length === 0) {
    console.log('新着メールなし。スキップします。');
    return;
  }

  console.log(`新着メール ${emails.length} 件を取得しました`);

  const summary = await summarizeWithClaude(emails);
  console.log('要約完了');

  await sendSummaryEmail(summary, emails.length);
  console.log('ダイジェストメール送信完了');
}

main().catch((err) => {
  console.error('エラー:', err.message);
  process.exit(1);
});
