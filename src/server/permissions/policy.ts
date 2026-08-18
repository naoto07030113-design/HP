/**
 * 認可（RBAC）と所属院スコープ。
 *
 * 画面側の PermissionGuard は「見せない」ための仕組みでしかない。
 * 実際にデータを守るのはこの層で、すべての API はここを必ず通す。
 */

import { AppError, ERROR_CODES } from '../errors/AppError'
import type { Actor, Role } from '../auth/session'

export type Capability =
  | 'patients.read' | 'patients.write' | 'patients.delete'
  | 'appointments.read' | 'appointments.write' | 'appointments.delete'
  | 'medicalRecords.read' | 'medicalRecords.write' | 'medicalRecords.delete'
  | 'billing.read' | 'billing.write' | 'billing.delete'
  | 'staff.manage' | 'clinics.manage' | 'settings.manage'
  | 'analytics.read' | 'analytics.readAllClinics'
  | 'auditLogs.read'

/** ロールごとに許す操作。ここが唯一の定義元 */
const MATRIX: Record<Role, Capability[]> = {
  admin: [
    'patients.read', 'patients.write', 'patients.delete',
    'appointments.read', 'appointments.write', 'appointments.delete',
    'medicalRecords.read', 'medicalRecords.write', 'medicalRecords.delete',
    'billing.read', 'billing.write', 'billing.delete',
    'staff.manage', 'clinics.manage', 'settings.manage',
    'analytics.read', 'analytics.readAllClinics',
    'auditLogs.read',
  ],
  staff: [
    'patients.read', 'patients.write',
    'appointments.read', 'appointments.write',
    'medicalRecords.read', 'medicalRecords.write',
    'billing.read', 'billing.write',
    'analytics.read',
  ],
  receptionist: [
    'patients.read', 'patients.write',
    'appointments.read', 'appointments.write',
    'billing.read',
  ],
}

export function can(actor: Actor, capability: Capability): boolean {
  return MATRIX[actor.role].includes(capability)
}

export function requireCapability(actor: Actor, capability: Capability): void {
  if (!can(actor, capability)) {
    throw new AppError(ERROR_CODES.FORBIDDEN, {
      detail: `role=${actor.role} には ${capability} が許可されていません`,
    })
  }
}

/**
 * 参照してよい院を決める。
 * - admin: null を返す（全院を横断できる）
 * - それ以外: 自分の所属院のみ。所属院が未設定なら何も見せない
 */
export function clinicScope(actor: Actor): string | null {
  if (actor.role === 'admin') return null
  if (!actor.clinicId) {
    throw new AppError(ERROR_CODES.CLINIC_SCOPE_VIOLATION, {
      message: '所属院が設定されていないため、データを表示できません。管理者にお問い合わせください。',
      detail: `userId=${actor.id} の app_metadata.clinic_id が未設定`,
    })
  }
  return actor.clinicId
}

/** 特定の院のデータへ触れてよいか。触れない場合は例外 */
export function assertClinicAccess(actor: Actor, clinicId: string | null | undefined): void {
  if (actor.role === 'admin') return
  const scope = clinicScope(actor)
  if (!clinicId || clinicId !== scope) {
    throw new AppError(ERROR_CODES.CLINIC_SCOPE_VIOLATION, {
      detail: `userId=${actor.id} scope=${scope} requested=${clinicId ?? 'null'}`,
    })
  }
}
