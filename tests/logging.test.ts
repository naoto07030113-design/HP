/**
 * ログの伏字処理。
 *
 * パスワード・トークンは値ごと消し、患者情報は長さだけを残す。
 * ここが緩むと医療情報や資格情報がログに残り続けるため、必ず固定する。
 */
import { describe, it, expect } from 'vitest'
import { redact } from '@/server/logging/logger'

describe('redact', () => {
  it('パスワードとトークンは値ごと消える', () => {
    const out = redact({ password: 'himitsu', access_token: 'eyJhbGciOi', apiKey: 'sk-123' }) as Record<string, unknown>
    expect(JSON.stringify(out)).not.toContain('himitsu')
    expect(JSON.stringify(out)).not.toContain('eyJhbGciOi')
    expect(JSON.stringify(out)).not.toContain('sk-123')
  })

  it('患者氏名や電話番号は長さだけが残る', () => {
    const out = redact({ patient_name: '山田 太郎', phone: '09012345678' }) as Record<string, unknown>
    expect(String(out.patient_name)).toMatch(/^\[redacted:\d+\]$/)
    expect(String(out.phone)).toMatch(/^\[redacted:\d+\]$/)
    expect(JSON.stringify(out)).not.toContain('山田')
    expect(JSON.stringify(out)).not.toContain('09012345678')
  })

  it('入れ子のオブジェクトでも効く', () => {
    const out = redact({ before: { patient_name: '佐藤 花子', password: 'x' } }) as Record<string, Record<string, unknown>>
    expect(JSON.stringify(out)).not.toContain('佐藤')
    expect(JSON.stringify(out)).not.toContain('"password"')
  })

  it('配列の中身も伏字になる', () => {
    const out = redact([{ patient_name: '鈴木 一郎' }])
    expect(JSON.stringify(out)).not.toContain('鈴木')
  })

  it('伏字対象でない値はそのまま残る', () => {
    const out = redact({ status: 'confirmed', count: 3 }) as Record<string, unknown>
    expect(out.status).toBe('confirmed')
    expect(out.count).toBe(3)
  })
})
