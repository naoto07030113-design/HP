/**
 * 操作ログと監査ログ。
 *
 * 「誰が・いつ・何を・変更前/変更後」を追えるようにする。
 * 保存先は audit_logs テーブル（supabase/migrations/008_audit_and_soft_delete.sql）。
 * テーブルが未作成の環境でも業務処理を止めないよう、書き込み失敗は
 * 例外にせず error ログに落とす（記録が消えることは重大なので必ずログには残す）。
 */

import { createServiceClient } from '@/lib/supabase'
import { logger, redact } from './logger'

export type AuditAction =
  | 'login' | 'logout' | 'login_failed'
  | 'patient.view' | 'patient.create' | 'patient.update' | 'patient.delete'
  | 'appointment.create' | 'appointment.update' | 'appointment.cancel' | 'appointment.reschedule'
  | 'appointment.lookup'
  | 'medical_record.view' | 'medical_record.create' | 'medical_record.update' | 'medical_record.delete'
  | 'invoice.create' | 'invoice.update' | 'invoice.cancel' | 'invoice.delete'
  | 'staff.create' | 'staff.update' | 'role.update'
  | 'settings.update'

export type AuditEntry = {
  requestId: string
  action: AuditAction
  actorId: string | null
  actorRole: string | null
  clinicId: string | null
  targetType: string
  targetId: string | null
  result: 'success' | 'failure'
  /** 変更前後。個人情報は保存前に伏字化される */
  before?: unknown
  after?: unknown
  ipAddress?: string | null
  userAgent?: string | null
  errorCode?: string | null
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  // 監査ログは業務ログとしても必ず残す（DBが落ちていても追跡できるように）
  logger.info('audit', {
    requestId: entry.requestId,
    action: entry.action,
    userId: entry.actorId ?? undefined,
    role: entry.actorRole ?? undefined,
    clinicId: entry.clinicId ?? undefined,
    targetType: entry.targetType,
    targetId: entry.targetId ?? undefined,
    result: entry.result,
    errorCode: entry.errorCode ?? undefined,
  })

  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from('audit_logs').insert({
      request_id: entry.requestId,
      action: entry.action,
      actor_id: entry.actorId,
      actor_role: entry.actorRole,
      clinic_id: entry.clinicId,
      target_type: entry.targetType,
      target_id: entry.targetId,
      result: entry.result,
      before_value: entry.before === undefined ? null : redact(entry.before),
      after_value: entry.after === undefined ? null : redact(entry.after),
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
      error_code: entry.errorCode ?? null,
    })
    if (error) throw error
  } catch (err) {
    // ここで throw すると業務処理まで巻き込むため、記録漏れとして残すに留める
    logger.error('監査ログの保存に失敗しました', {
      requestId: entry.requestId,
      action: entry.action,
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
