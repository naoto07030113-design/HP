/**
 * 患者情報の業務ルール。
 *
 * 原則:
 * - 参照も更新も、必ず所属院スコープを通してから行う
 * - 他院の患者に触ろうとした場合は「見つからない」ではなく明確に拒否し、監査に残す
 * - 削除は論理削除。診療録が道連れで消えないようにする
 */

import { patientRepository, type PatientRow, type PatientListQuery } from '../repositories/PatientRepository'
import { AppError, ERROR_CODES } from '../errors/AppError'
import { assertClinicAccess, clinicScope, requireCapability } from '../permissions/policy'
import type { Actor } from '../auth/session'
import type { PatientListInput, PatientWriteInput } from '../validators/patient'

/** 画面へ返す形。DBの列名をそのまま外に出さない */
export type PatientDto = {
  id: string
  clinicId: string | null
  name: string
  nameKana: string
  gender: PatientRow['gender']
  birthDate: string | null
  phone: string | null
  email: string | null
  postalCode: string | null
  address: string | null
  firstVisitDate: string | null
  primaryStaffId: string | null
  insuranceType: PatientRow['insurance_type']
  referralSource: string | null
  chiefComplaint: string | null
  medicalHistory: string | null
  currentMedications: string | null
  allergies: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function toDto(r: PatientRow): PatientDto {
  return {
    id: r.id,
    clinicId: r.clinic_id,
    name: r.name,
    nameKana: r.name_kana ?? '',
    gender: r.gender,
    birthDate: r.birth_date,
    phone: r.phone,
    email: r.email,
    postalCode: r.postal_code,
    address: r.address,
    firstVisitDate: r.first_visit_date,
    primaryStaffId: r.primary_staff_id,
    insuranceType: r.insurance_type,
    referralSource: r.referral_source,
    chiefComplaint: r.chief_complaint,
    medicalHistory: r.medical_history,
    currentMedications: r.current_medications,
    allergies: r.allergies,
    notes: r.notes,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toRow(input: Partial<PatientWriteInput>): Record<string, unknown> {
  const map: Array<[keyof PatientWriteInput, string]> = [
    ['clinicId', 'clinic_id'], ['name', 'name'], ['nameKana', 'name_kana'],
    ['gender', 'gender'], ['birthDate', 'birth_date'], ['phone', 'phone'],
    ['email', 'email'], ['postalCode', 'postal_code'], ['address', 'address'],
    ['firstVisitDate', 'first_visit_date'], ['primaryStaffId', 'primary_staff_id'],
    ['insuranceType', 'insurance_type'], ['referralSource', 'referral_source'],
    ['chiefComplaint', 'chief_complaint'], ['medicalHistory', 'medical_history'],
    ['currentMedications', 'current_medications'], ['allergies', 'allergies'],
    ['notes', 'notes'], ['isActive', 'is_active'],
  ]
  const out: Record<string, unknown> = {}
  for (const [from, to] of map) {
    if (input[from] !== undefined) out[to] = input[from]
  }
  // 文字列必須の列に null が入らないようにする
  if (out.name_kana === null) out.name_kana = ''
  return out
}

export const patientService = {
  async list(actor: Actor, input: PatientListInput) {
    requireCapability(actor, 'patients.read')
    const scope = clinicScope(actor)

    const query: PatientListQuery = {
      clinicScope: scope,
      clinicFilter: input.clinicId ?? null,
      search: input.search,
      includeInactive: input.includeInactive,
      page: input.page,
      perPage: input.perPage,
    }
    const [{ rows, total }, stats] = await Promise.all([
      patientRepository.list(query),
      // 一覧をページングした以上、画面上部の集計は別途サーバーで数える
      patientRepository.stats({ clinicScope: scope, clinicFilter: input.clinicId ?? null }),
    ])
    return {
      patients: rows.map(toDto),
      page: input.page,
      perPage: input.perPage,
      total,
      hasNext: input.page * input.perPage < total,
      stats,
    }
  },

  async get(actor: Actor, id: string): Promise<PatientDto> {
    requireCapability(actor, 'patients.read')
    const row = await patientRepository.findById(id)
    if (!row) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '患者が見つかりませんでした。', detail: `patientId=${id}`,
      })
    }
    assertClinicAccess(actor, row.clinic_id)
    return toDto(row)
  },

  async create(actor: Actor, input: PatientWriteInput): Promise<PatientDto> {
    requireCapability(actor, 'patients.write')
    assertClinicAccess(actor, input.clinicId)
    const row = await patientRepository.insert(toRow(input), actor.id)
    return toDto(row)
  },

  async update(actor: Actor, id: string, input: Partial<PatientWriteInput>) {
    requireCapability(actor, 'patients.write')

    const current = await patientRepository.findById(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '患者が見つかりませんでした。', detail: `patientId=${id}`,
      })
    }
    // 変更前の院と、変更後の院の両方に権限が要る（他院へ付け替えて逃がさない）
    assertClinicAccess(actor, current.clinic_id)
    if (input.clinicId) assertClinicAccess(actor, input.clinicId)

    const row = await patientRepository.update(id, toRow(input), actor.id)
    return { before: toDto(current), after: toDto(row) }
  },

  async remove(actor: Actor, id: string): Promise<PatientDto> {
    requireCapability(actor, 'patients.delete')

    const current = await patientRepository.findById(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '患者が見つかりませんでした。', detail: `patientId=${id}`,
      })
    }
    assertClinicAccess(actor, current.clinic_id)

    await patientRepository.softDelete(id, actor.id)
    return toDto(current)
  },
}
