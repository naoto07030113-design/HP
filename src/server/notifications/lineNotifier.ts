/**
 * 院のスタッフ向け LINE 通知。
 *
 * 以前は `/api/line/notify` という未認証のエンドポイントがあり、
 * 誰でも任意の本文を院の LINE 公式アカウントから一斉配信できた。
 * 通知は「予約が実際に作られたとき」にサーバー内部から送るだけにする。
 *
 * 通知の失敗で予約を失敗させない（患者の予約は成立させ、失敗はログに残す）。
 * トークンは絶対にログへ出さない。
 */

import { logger } from '../logging/logger'

const BROADCAST_URL = 'https://api.line.me/v2/bot/message/broadcast'

function tokenFor(clinicId: string): string | null {
  const raw = process.env.LINE_CHANNEL_TOKENS
  if (!raw) return null
  try {
    const map = JSON.parse(raw) as Record<string, string>
    return map[clinicId] ?? null
  } catch {
    logger.error('LINE_CHANNEL_TOKENS が JSON として解釈できません')
    return null
  }
}

function formatJst(iso: string): string {
  const d = new Date(iso)
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const wd = ['日', '月', '火', '水', '木', '金', '土'][jst.getUTCDay()]
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${jst.getUTCMonth() + 1}月${jst.getUTCDate()}日（${wd}） ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`
}

export async function notifyNewReservation(args: {
  requestId: string
  clinicId: string
  clinicName: string
  patientName: string
  startAt: string
  menuName: string | null
  staffName: string | null
}): Promise<void> {
  const token = tokenFor(args.clinicId)
  if (!token) return

  const text = [
    '【新規予約】',
    `院: ${args.clinicName}`,
    `患者: ${args.patientName}`,
    `日時: ${formatJst(args.startAt)}`,
    args.menuName ? `メニュー: ${args.menuName}` : null,
    args.staffName ? `担当: ${args.staffName}` : null,
  ].filter(Boolean).join('\n')

  try {
    const res = await fetch(BROADCAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages: [{ type: 'text', text }] }),
    })
    if (!res.ok) {
      // 本文には患者情報が含まれないため、ステータスだけ残す
      logger.error('LINE通知の送信に失敗しました', {
        requestId: args.requestId, clinicId: args.clinicId, status: res.status,
      })
    }
  } catch (err) {
    logger.error('LINE通知の送信で例外が発生しました', {
      requestId: args.requestId, clinicId: args.clinicId,
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
