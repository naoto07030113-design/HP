/**
 * 入力スキーマ。
 *
 * 未認証で叩けるエンドポイントと、金額に関わる入力を重点的に固定する。
 * とくに会計は「合計を受け取らない」ことが安全性の要になっている。
 */
import { describe, it, expect } from 'vitest'
import { invoiceCreateSchema } from '@/server/validators/invoice'
import { intakeSchema } from '@/server/validators/intake'
import { shiftUpsertSchema, shiftListSchema } from '@/server/validators/shift'
import { loginSchema } from '@/server/validators/auth'
import { phoneSchema } from '@/server/validators/appointment'

const C1 = '11111111-1111-4111-8111-111111111111'
const M1 = '22222222-2222-4222-8222-222222222222'
const S1 = '33333333-3333-4333-8333-333333333333'

describe('会計の入力', () => {
  const valid = {
    clinicId: C1, patientName: '山田 太郎', visitDate: '2026-09-01',
    items: [{ menuId: null, name: '施術', unitPrice: 5000, quantity: 1, discount: 0 }],
    insuranceType: 'none', insuranceCopay: 0,
    paymentMethod: 'cash', paymentAmount: 6000, status: 'paid',
  }

  it('正しい入力は通る', () => {
    expect(invoiceCreateSchema.safeParse(valid).success).toBe(true)
  })

  it('合計金額を送りつけても取り込まれない（サーバーが計算する）', () => {
    const parsed = invoiceCreateSchema.safeParse({ ...valid, totalAmount: 1, taxAmount: 0, subtotal: 1 })
    expect(parsed.success).toBe(true)
    expect(JSON.stringify(parsed.success && parsed.data)).not.toContain('totalAmount')
  })

  it('伝票番号も受け取らない（サーバーが採番する）', () => {
    const parsed = invoiceCreateSchema.safeParse({ ...valid, invoiceNumber: 'INV-XXXX-999' })
    expect(parsed.success).toBe(true)
    expect(JSON.stringify(parsed.success && parsed.data)).not.toContain('INV-XXXX-999')
  })

  it('単価が負の明細は弾く', () => {
    const parsed = invoiceCreateSchema.safeParse({
      ...valid, items: [{ menuId: null, name: '施術', unitPrice: -1, quantity: 1, discount: 0 }],
    })
    expect(parsed.success).toBe(false)
  })

  it('明細が空だと弾く', () => {
    expect(invoiceCreateSchema.safeParse({ ...valid, items: [] }).success).toBe(false)
  })
})

describe('Web予約の入力', () => {
  const reservation = {
    clinic_id: C1, staff_id: null, menu_id: M1,
    patient_name: '山田 太郎', patient_phone: '090-1234-5678',
    start_at: '2026-09-01T10:00:00+09:00',
    end_at: '2026-09-01T10:30:00+09:00',
    memo: null,
  }

  it('再来（患者情報なし）でも通る', () => {
    expect(intakeSchema.safeParse({ reservation }).success).toBe(true)
  })

  it('電話番号は必須', () => {
    expect(intakeSchema.safeParse({ reservation: { ...reservation, patient_phone: '' } }).success).toBe(false)
  })

  it('桁数の足りない電話番号は弾く', () => {
    expect(intakeSchema.safeParse({ reservation: { ...reservation, patient_phone: '0901234' } }).success).toBe(false)
  })

  it('予約の状態は受け取らない（必ず confirmed で作る）', () => {
    const parsed = intakeSchema.safeParse({ reservation: { ...reservation, status: 'visited' } })
    expect(parsed.success).toBe(true)
    expect(JSON.stringify(parsed.success && parsed.data)).not.toContain('visited')
  })

  it('患者IDを送りつけても取り込まれない', () => {
    const parsed = intakeSchema.safeParse({ reservation: { ...reservation, patient_id: S1 } })
    expect(parsed.success).toBe(true)
    expect(JSON.stringify(parsed.success && parsed.data)).not.toContain(S1)
  })

  it('未入力は null でも空文字でも受け取れる', () => {
    expect(intakeSchema.safeParse({
      patient: { name: '山田 太郎', email: '', name_kana: null }, reservation,
    }).success).toBe(true)
  })

  it('メールアドレスの形式は見る', () => {
    expect(intakeSchema.safeParse({
      patient: { name: '山田 太郎', email: 'not-an-email' }, reservation,
    }).success).toBe(false)
  })
})

describe('シフトの入力', () => {
  const shift = { staffId: S1, clinicId: C1, workDate: '2026-09-01' }

  it('時刻を省略すると既定値が入る', () => {
    const parsed = shiftUpsertSchema.safeParse(shift)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.startTime).toBe('09:00')
      expect(parsed.data.endTime).toBe('18:00')
      expect(parsed.data.shiftType).toBe('work')
      expect(parsed.data.breakStart).toBeNull()
    }
  })

  it('時刻の形式が違えば弾く', () => {
    expect(shiftUpsertSchema.safeParse({ ...shift, startTime: '9:00' }).success).toBe(false)
    expect(shiftUpsertSchema.safeParse({ ...shift, startTime: '25:00' }).success).toBe(false)
  })

  it('勤務日の形式が違えば弾く', () => {
    expect(shiftUpsertSchema.safeParse({ ...shift, workDate: '2026/09/01' }).success).toBe(false)
  })

  it('一覧は開始日と終了日が要る', () => {
    expect(shiftListSchema.safeParse({ clinicId: C1 }).success).toBe(false)
    expect(shiftListSchema.safeParse({ from: '2026-09-01', to: '2026-09-07' }).success).toBe(true)
  })
})

describe('ログインの入力', () => {
  it('メール形式でなければ弾く', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false)
  })
  it('パスワードが空なら弾く', () => {
    expect(loginSchema.safeParse({ email: 'a@example.com', password: '' }).success).toBe(false)
  })
})

describe('電話番号', () => {
  it('ハイフン入りでも通る', () => {
    expect(phoneSchema.safeParse('090-1234-5678').success).toBe(true)
  })
  it('10桁でも通る', () => {
    expect(phoneSchema.safeParse('0312345678').success).toBe(true)
  })
  it('12桁は弾く', () => {
    expect(phoneSchema.safeParse('090123456789').success).toBe(false)
  })
})
