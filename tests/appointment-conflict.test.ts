/**
 * 予約の重複判定。
 *
 * ブラウザ側の空き表示だけに任せると、二人が同時に同じ枠を押したときに
 * どちらも成立してしまう。サーバーで必ず弾くことを固定する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '@/server/errors/AppError'
import { adminAppointmentService } from '@/server/services/AdminAppointmentService'
import type { Actor } from '@/server/auth/session'

const C1 = '11111111-1111-4111-8111-111111111111'
const S1 = 'aaaaaaaa-1111-4111-8111-111111111111'

const findOverlapping = vi.fn()
const insert = vi.fn()

vi.mock('@/server/repositories/AppointmentRepository', () => ({
  appointmentRepository: {
    findOverlapping: (...args: unknown[]) => findOverlapping(...args),
    insert: (...args: unknown[]) => insert(...args),
    findById: vi.fn(),
    updateFields: vi.fn(),
    softDelete: vi.fn(),
    listForAdmin: vi.fn(),
  },
}))

const admin: Actor = { id: 'u1', email: 'a@example.com', displayName: '管理者', role: 'admin', clinicId: null }

const base = {
  clinicId: C1, staffId: S1, menuId: null, patientId: null,
  patientName: '山田 太郎', patientPhone: '09011112222', referralName: null,
  startAt: '2026-09-01T10:00:00+09:00',
  endAt: '2026-09-01T10:30:00+09:00',
  status: 'confirmed' as const, memo: null,
}

const row = { ...base, id: 'r1', clinic_id: C1, staff_id: S1, menu_id: null, patient_id: null,
  patient_name: base.patientName, patient_phone: base.patientPhone, referral_name: null,
  start_at: base.startAt, end_at: base.endAt, status: 'confirmed',
  memo: null, created_at: '', updated_at: '' }

beforeEach(() => {
  findOverlapping.mockReset()
  insert.mockReset()
  insert.mockResolvedValue(row)
})

describe('予約作成時の重複判定', () => {
  it('重なる予約が無ければ作成できる', async () => {
    findOverlapping.mockResolvedValue([])
    await expect(adminAppointmentService.create(admin, base)).resolves.toMatchObject({ id: 'r1' })
    expect(findOverlapping).toHaveBeenCalledTimes(1)
  })

  it('同じ担当者の同じ時間帯には入れられない', async () => {
    findOverlapping.mockResolvedValue([{ ...row, patient_name: '佐藤 花子' }])
    try {
      await adminAppointmentService.create(admin, base)
      throw new Error('例外が投げられなかった')
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).code).toBe('APPOINTMENT_CONFLICT')
      expect((err as AppError).status).toBe(409)
      expect((err as AppError).message).toContain('佐藤 花子')
    }
    expect(insert).not.toHaveBeenCalled()
  })

  it('終了が開始より前なら拒否する', async () => {
    findOverlapping.mockResolvedValue([])
    try {
      await adminAppointmentService.create(admin, { ...base, endAt: '2026-09-01T09:00:00+09:00' })
      throw new Error('例外が投げられなかった')
    } catch (err) {
      expect((err as AppError).code).toBe('VALIDATION_FAILED')
    }
    expect(findOverlapping).not.toHaveBeenCalled()
  })

  it('担当者が未指定なら枠の取り合いは起きないので重複を見ない', async () => {
    await adminAppointmentService.create(admin, { ...base, staffId: null })
    expect(findOverlapping).not.toHaveBeenCalled()
    expect(insert).toHaveBeenCalledTimes(1)
  })

  it('キャンセル済みの予約は枠を占有しないので重複を見ない', async () => {
    await adminAppointmentService.create(admin, { ...base, status: 'cancelled' })
    expect(findOverlapping).not.toHaveBeenCalled()
  })

  it('無断キャンセルも同様に重複を見ない', async () => {
    await adminAppointmentService.create(admin, { ...base, status: 'no_show' })
    expect(findOverlapping).not.toHaveBeenCalled()
  })
})

describe('所属院スコープ', () => {
  it('施術者は他院に予約を作れない', async () => {
    const staff: Actor = { id: 'u2', email: 's@example.com', displayName: '施術者', role: 'staff', clinicId: 'other' }
    try {
      await adminAppointmentService.create(staff, base)
      throw new Error('例外が投げられなかった')
    } catch (err) {
      expect((err as AppError).code).toBe('CLINIC_SCOPE_VIOLATION')
    }
    expect(insert).not.toHaveBeenCalled()
  })

  it('受付は予約を削除できない', async () => {
    const reception: Actor = { id: 'u3', email: 'r@example.com', displayName: '受付', role: 'receptionist', clinicId: C1 }
    try {
      await adminAppointmentService.remove(reception, 'r1')
      throw new Error('例外が投げられなかった')
    } catch (err) {
      expect((err as AppError).code).toBe('FORBIDDEN')
    }
  })
})
