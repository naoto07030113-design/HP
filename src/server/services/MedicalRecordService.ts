/**
 * カルテの業務ルール。
 *
 * 原則:
 * - 参照も更新も、必ず所属院スコープを通す
 * - 上書きで前の内容が消えないよう、更新・削除の前に改訂履歴を積む
 * - 削除は論理削除。診療録は残す
 */

import {
  medicalRecordRepository,
  type MedicalRecordRow,
  type MedicalRecordListQuery,
} from '../repositories/MedicalRecordRepository'
import { AppError, ERROR_CODES } from '../errors/AppError'
import { assertClinicAccess, clinicScope, requireCapability } from '../permissions/policy'
import { logger } from '../logging/logger'
import type { Actor } from '../auth/session'
import type { MedicalRecordListInput, MedicalRecordWriteInput } from '../validators/medicalRecord'

export type MedicalRecordDto = {
  id: string
  patientId: string
  patientName: string
  reservationId: string | null
  clinicId: string
  staffId: string | null
  visitDate: string
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
  bloodPressureSystolic: number | null
  bloodPressureDiastolic: number | null
  pulse: number | null
  temperature: number | null
  treatmentAreas: string[]
  treatmentMethods: string[]
  treatmentDurationMin: number | null
  treatmentNotes: string | null
  nextVisitPlan: string | null
  memo: string | null
  createdAt: string
  updatedAt: string
}

function toDto(r: MedicalRecordRow): MedicalRecordDto {
  return {
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    reservationId: r.reservation_id,
    clinicId: r.clinic_id,
    staffId: r.staff_id,
    visitDate: r.visit_date,
    subjective: r.subjective,
    objective: r.objective,
    assessment: r.assessment,
    plan: r.plan,
    bloodPressureSystolic: r.blood_pressure_systolic,
    bloodPressureDiastolic: r.blood_pressure_diastolic,
    pulse: r.pulse,
    temperature: r.temperature === null ? null : Number(r.temperature),
    treatmentAreas: r.treatment_areas ?? [],
    treatmentMethods: r.treatment_methods ?? [],
    treatmentDurationMin: r.treatment_duration_min,
    treatmentNotes: r.treatment_notes,
    nextVisitPlan: r.next_visit_plan,
    memo: r.memo,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toRow(input: Partial<MedicalRecordWriteInput>): Record<string, unknown> {
  const map: Array<[keyof MedicalRecordWriteInput, string]> = [
    ['patientId', 'patient_id'], ['patientName', 'patient_name'],
    ['reservationId', 'reservation_id'], ['clinicId', 'clinic_id'], ['staffId', 'staff_id'],
    ['visitDate', 'visit_date'],
    ['subjective', 'subjective'], ['objective', 'objective'],
    ['assessment', 'assessment'], ['plan', 'plan'],
    ['bloodPressureSystolic', 'blood_pressure_systolic'],
    ['bloodPressureDiastolic', 'blood_pressure_diastolic'],
    ['pulse', 'pulse'], ['temperature', 'temperature'],
    ['treatmentAreas', 'treatment_areas'], ['treatmentMethods', 'treatment_methods'],
    ['treatmentDurationMin', 'treatment_duration_min'], ['treatmentNotes', 'treatment_notes'],
    ['nextVisitPlan', 'next_visit_plan'], ['memo', 'memo'],
  ]
  const out: Record<string, unknown> = {}
  for (const [from, to] of map) {
    if (input[from] !== undefined) out[to] = input[from]
  }
  return out
}

/** 改訂履歴を積む。失敗しても診療業務は止めないが、必ずエラーログに残す */
async function recordRevision(
  record: MedicalRecordRow, actor: Actor, requestId: string, changeType: 'update' | 'delete',
): Promise<void> {
  const ok = await medicalRecordRepository.appendRevision({
    record, changedBy: actor.id, changedByRole: actor.role, requestId, changeType,
  })
  if (!ok) {
    logger.error('カルテ改訂履歴の保存に失敗しました', {
      requestId, userId: actor.id, targetId: record.id, changeType,
      detail: 'migrations/009_medical_record_revisions.sql が未適用の可能性があります',
    })
  }
}

export const medicalRecordService = {
  async list(actor: Actor, input: MedicalRecordListInput) {
    requireCapability(actor, 'medicalRecords.read')
    const scope = clinicScope(actor)

    const query: MedicalRecordListQuery = {
      clinicScope: scope,
      clinicFilter: input.clinicId ?? null,
      patientId: input.patientId ?? null,
      staffId: input.staffId ?? null,
      search: input.search,
      from: input.from,
      to: input.to,
      page: input.page,
      perPage: input.perPage,
    }
    const [{ rows, total }, stats] = await Promise.all([
      medicalRecordRepository.list(query),
      medicalRecordRepository.stats({ clinicScope: scope, clinicFilter: input.clinicId ?? null }),
    ])
    return {
      records: rows.map(toDto),
      page: input.page,
      perPage: input.perPage,
      total,
      hasNext: input.page * input.perPage < total,
      stats,
    }
  },

  async get(actor: Actor, id: string): Promise<MedicalRecordDto> {
    requireCapability(actor, 'medicalRecords.read')
    const row = await medicalRecordRepository.findById(id)
    if (!row) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: 'カルテが見つかりませんでした。', detail: `recordId=${id}`,
      })
    }
    assertClinicAccess(actor, row.clinic_id)
    return toDto(row)
  },

  async create(actor: Actor, input: MedicalRecordWriteInput): Promise<MedicalRecordDto> {
    requireCapability(actor, 'medicalRecords.write')
    assertClinicAccess(actor, input.clinicId)
    const row = await medicalRecordRepository.insert(toRow(input), actor.id)
    return toDto(row)
  },

  async update(
    actor: Actor, id: string, input: Partial<MedicalRecordWriteInput>, requestId: string,
  ): Promise<{ before: MedicalRecordDto; after: MedicalRecordDto }> {
    requireCapability(actor, 'medicalRecords.write')

    const current = await medicalRecordRepository.findById(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: 'カルテが見つかりませんでした。', detail: `recordId=${id}`,
      })
    }
    assertClinicAccess(actor, current.clinic_id)
    if (input.clinicId) assertClinicAccess(actor, input.clinicId)

    // 上書きする前に、変更前の内容を履歴として残す
    await recordRevision(current, actor, requestId, 'update')

    const row = await medicalRecordRepository.update(id, toRow(input), actor.id)
    return { before: toDto(current), after: toDto(row) }
  },

  async remove(actor: Actor, id: string, requestId: string): Promise<MedicalRecordDto> {
    requireCapability(actor, 'medicalRecords.delete')

    const current = await medicalRecordRepository.findById(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: 'カルテが見つかりませんでした。', detail: `recordId=${id}`,
      })
    }
    assertClinicAccess(actor, current.clinic_id)

    await recordRevision(current, actor, requestId, 'delete')
    await medicalRecordRepository.softDelete(id, actor.id)
    return toDto(current)
  },

  /** 改訂履歴の閲覧。診療内容を含むため管理者のみ */
  async revisions(actor: Actor, id: string) {
    requireCapability(actor, 'auditLogs.read')
    const row = await medicalRecordRepository.findById(id)
    if (!row) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: 'カルテが見つかりませんでした。', detail: `recordId=${id}`,
      })
    }
    assertClinicAccess(actor, row.clinic_id)
    const revisions = await medicalRecordRepository.listRevisions(id)
    return {
      revisions: revisions.map((r) => ({
        revisionNo: r.revisionNo,
        changedAt: r.changedAt,
        changedBy: r.changedBy,
        changedByRole: r.changedByRole,
        changeType: r.changeType,
        snapshot: toDto(r.snapshot),
      })),
    }
  },
}
