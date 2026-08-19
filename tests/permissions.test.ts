/**
 * 権限と所属院スコープ。
 *
 * 画面の出し分けではなく、ここがデータを守る最後の砦になる。
 * ロールに操作が増減したときに気づけるよう、対応表そのものを固定する。
 */
import { describe, it, expect } from 'vitest'
import { can, requireCapability, clinicScope, assertClinicAccess } from '@/server/permissions/policy'
import { AppError } from '@/server/errors/AppError'
import type { Actor } from '@/server/auth/session'

const C1 = '11111111-1111-4111-8111-111111111111'
const C2 = '22222222-2222-4222-8222-222222222222'

const actor = (role: Actor['role'], clinicId: string | null = C1): Actor => ({
  id: 'user-1', email: 'x@example.com', displayName: 'テスト', role, clinicId,
})

describe('ロールごとに許される操作', () => {
  it('管理者はカルテを読み書きし、削除もできる', () => {
    expect(can(actor('admin'), 'medicalRecords.read')).toBe(true)
    expect(can(actor('admin'), 'medicalRecords.delete')).toBe(true)
  })

  it('受付はカルテを読めない', () => {
    expect(can(actor('receptionist'), 'medicalRecords.read')).toBe(false)
  })

  it('受付は会計を作れない（閲覧のみ）', () => {
    expect(can(actor('receptionist'), 'billing.read')).toBe(true)
    expect(can(actor('receptionist'), 'billing.write')).toBe(false)
  })

  it('受付は患者を削除できない', () => {
    expect(can(actor('receptionist'), 'patients.delete')).toBe(false)
    expect(can(actor('staff'), 'patients.delete')).toBe(false)
    expect(can(actor('admin'), 'patients.delete')).toBe(true)
  })

  it('シフトは管理者と施術者が編集でき、受付は参照だけ', () => {
    expect(can(actor('admin'), 'shifts.manage')).toBe(true)
    expect(can(actor('staff'), 'shifts.manage')).toBe(true)
    expect(can(actor('receptionist'), 'shifts.manage')).toBe(false)
    expect(can(actor('receptionist'), 'shifts.read')).toBe(true)
  })

  it('受付は集計を見られない', () => {
    expect(can(actor('receptionist'), 'analytics.read')).toBe(false)
    expect(can(actor('staff'), 'analytics.read')).toBe(true)
  })

  it('全院横断は管理者だけ', () => {
    expect(can(actor('admin'), 'analytics.readAllClinics')).toBe(true)
    expect(can(actor('staff'), 'analytics.readAllClinics')).toBe(false)
  })

  it('許可されていない操作は FORBIDDEN で止まる', () => {
    try {
      requireCapability(actor('receptionist'), 'medicalRecords.read')
      throw new Error('例外が投げられなかった')
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).code).toBe('FORBIDDEN')
      expect((err as AppError).status).toBe(403)
    }
  })
})

describe('所属院スコープ', () => {
  it('管理者は全院を横断できる（スコープ無し）', () => {
    expect(clinicScope(actor('admin', null))).toBeNull()
  })

  it('施術者は自院に固定される', () => {
    expect(clinicScope(actor('staff'))).toBe(C1)
  })

  it('所属院が未設定なら何も見せない', () => {
    try {
      clinicScope(actor('staff', null))
      throw new Error('例外が投げられなかった')
    } catch (err) {
      expect((err as AppError).code).toBe('CLINIC_SCOPE_VIOLATION')
    }
  })

  it('他院のデータには触れない', () => {
    expect(() => assertClinicAccess(actor('staff'), C1)).not.toThrow()
    try {
      assertClinicAccess(actor('staff'), C2)
      throw new Error('例外が投げられなかった')
    } catch (err) {
      expect((err as AppError).code).toBe('CLINIC_SCOPE_VIOLATION')
    }
  })

  it('院が未指定でも他院扱いで拒否する', () => {
    try {
      assertClinicAccess(actor('staff'), null)
      throw new Error('例外が投げられなかった')
    } catch (err) {
      expect((err as AppError).code).toBe('CLINIC_SCOPE_VIOLATION')
    }
  })

  it('管理者はどの院でも通る', () => {
    expect(() => assertClinicAccess(actor('admin', null), C2)).not.toThrow()
  })
})
