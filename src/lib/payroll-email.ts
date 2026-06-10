import nodemailer from 'nodemailer'

export function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   ?? 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT ?? '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER ?? '',
      pass: process.env.EMAIL_PASS ?? '',
    },
  })
}

interface SendPayslipOptions {
  to:          string
  staffName:   string
  companyName: string
  year:        number
  month:       number
  token:       string
  appUrl:      string
}

export async function sendPayslipEmail(opts: SendPayslipOptions) {
  const transporter = createTransporter()
  const from = process.env.EMAIL_FROM ?? process.env.EMAIL_USER ?? 'noreply@example.com'
  const url  = `${opts.appUrl}/payslip/${opts.token}`

  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Noto Sans JP',sans-serif;color:#1a1a1a;background:#f0faf4;margin:0;padding:20px;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <div style="background:#166534;padding:24px 28px;">
      <p style="color:#bbf7d0;font-size:12px;margin:0 0 4px;">${opts.companyName}</p>
      <h1 style="color:white;font-size:20px;margin:0;font-weight:700;">給与明細書のお知らせ</h1>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 16px;">${opts.staffName} 様</p>
      <p style="margin:0 0 16px;line-height:1.7;color:#374151;">
        ${opts.year}年${opts.month}月分の給与明細書が発行されました。<br>
        下のボタンからご確認ください。
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${url}" style="display:inline-block;background:#166534;color:white;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.05em;">
          給与明細を確認する
        </a>
      </div>
      <p style="font-size:12px;color:#6b7280;margin:0 0 6px;">
        ※ このリンクは発行日から90日間有効です。<br>
        ※ お心当たりのない方はこのメールを破棄してください。
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
      <p style="font-size:11px;color:#9ca3af;margin:0;">
        ${opts.companyName} / 給与担当
      </p>
    </div>
  </div>
</body>
</html>`

  await transporter.sendMail({
    from,
    to:      opts.to,
    subject: `【給与明細】${opts.year}年${opts.month}月分 - ${opts.companyName}`,
    html,
  })
}
