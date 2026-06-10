import { NextRequest, NextResponse } from 'next/server'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

export async function POST(req: NextRequest) {
  const { clinicId, clinicName, patientName, startAt, menuName, staffName } = await req.json()

  const tokensJson = process.env.LINE_CHANNEL_TOKENS ?? '{}'
  let tokens: Record<string, string>
  try {
    tokens = JSON.parse(tokensJson)
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_tokens_config' })
  }

  const token = tokens[clinicId]
  if (!token) {
    return NextResponse.json({ ok: false, reason: 'no_token_for_clinic' })
  }

  const dt = parseISO(startAt)
  const dateStr = format(dt, 'M月d日（E） HH:mm', { locale: ja })

  const lines = [
    '【新規予約】',
    `院: ${clinicName}`,
    `患者: ${patientName}`,
    `日時: ${dateStr}`,
    menuName ? `メニュー: ${menuName}` : null,
    staffName ? `担当: ${staffName}` : null,
  ].filter(Boolean).join('\n')

  const res = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages: [{ type: 'text', text: lines }] }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ ok: false, status: res.status, error: err }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
