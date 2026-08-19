/**
 * 管理画面（スタッフ）向けの予約操作。
 *
 * 患者向けの AppointmentService とは本人確認の仕方が違うため分けている。
 * こちらはログイン済みスタッフが対象で、所属院スコープと権限で守る。
 *
 * 予約の重複判定はサーバーで行う。ブラウザ側の空き判定だけに任せると、
 * 二人が同時に同じ枠を押したときにダブルブッキングが成立してしまう。
 */

import {
  appointmentRepository,
  type ReservationRow,
  type AdminReservationListQuery,
} from '../repositories/AppointmentRepository'
import { AppError, ERROR_CODES } from '../errors/AppError'
import { assertClinicAccess, clinicScope, requireCapability } from '../permissions/policy'
import type { Actor } from '../auth/session'
import type { AdminReservationListInput, AdminReservationWriteInput } from '../validators/appointment'

export type AdminReservationDto = {
  id: string
  clinicId: string
  staffId: string | null
  menuId: string | null
  patientId: string | null
  patientName: string
  patientPhone: string | null
  referralName: string | null
  startAt: string
  endAt: string
  status: ReservationRow['status']
  memo: string | null
  createdAt: string
  updatedAt: string
}

function toDto(r: ReservationRow): AdminReservationDto {
  return {
    id: r.id,
    clinicId: r.clinic_id,
    staffId: r.staff_id,
    menuId: r.menu_id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    patientPhone: r.patient_phone,
    referralName: r.referral_name ?? null,
    startAt: r.start_at,
    endAt: r.end_at,
    status: r.status,
    memo: r.memo,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toRow(input: Partial<AdminReservationWriteInput>): Record<string, unknown> {
  const map: Array<[keyof AdminReservationWriteInput, string]> = [
    ['clinicId', 'clinic_id'], ['staffId', 'staff_id'], ['menuId', 'menu_id'],
    ['patientId', 'patient_id'], ['patientName', 'patient_name'],
    ['patientPhone', 'patient_phone'], ['referralName', 'referral_name'],
    ['startAt', 'start_at'], ['endAt', 'end_at'], ['status', 'status'], ['memo', 'memo'],
  ]
  const out: Record<string, unknown> = {}
  for (const [from, to] of map) {
    if (input[from] !== undefined) out[to] = input[from]
  }
  return out
}

/** 開始と終了の整合、および担当者の枠の重なりを確認する */
async function assertSchedulable(args: {
  clinicId: string
  staffId: string | null
  startAt: string
  endAt: string
  excludeId: string
  status: ReservationRow['status']
}): Promise<void> {
  const start = new Date(args.startAt)
  const end = new Date(args.endAt)

  if (!(start.getTime() < end.getTime())) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
      message: '終了時刻は開始時刻より後にしてください。',
      detail: `startAt=${args.startAt} endAt=${args.endAt}`,
    })
  }

  // キャンセル・無断キャンセルは枠を占有しないので重複を見ない
  if (args.status === 'cancelled' || args.status === 'no_show') return
  // 担当者未指定なら枠の取り合いは起きない
  if (!args.staffId) return

  const overlapping = await appointmentRepository.findOverlapping(
    args.clinicId, args.staffId, args.startAt, args.endAt, args.excludeId,
  )
  if (overlapping.length > 0) {
    const other = overlapping[0]
    throw new AppError(ERROR_CODES.APPOINTMENT_CONFLICT, {
      message: `この時間帯には既に予約があります（${other.patient_name}様）。`,
      detail: `${overlapping.length}件と重複 staffId=${args.staffId}`,
    })
  }
}

export const adminAppointmentService = {
  async list(actor: Actor, input: AdminReservationListInput) {
    requireCapability(actor, 'appointments.read')
    const scope = clinicScope(actor)

    const query: AdminReservationListQuery = {
      clinicScope: scope,
      clinicFilter: input.clinicId ?? null,
      staffId: input.staffId ?? null,
      patientId: input.patientId ?? null,
      status: input.status ?? null,
      search: input.search,
      from: input.from,
      to: input.to,
      page: input.page,
      perPage: input.perPage,
    }
    const { rows, total } = await appointmentRepository.listForAdmin(query)
    return {
      reservations: rows.map(toDto),
      page: input.page,
      perPage: input.perPage,
      total,
      hasNext: input.page * input.perPage < total,
    }
  },

  async create(actor: Actor, input: AdminReservationWriteInput): Promise<AdminReservationDto> {
    requireCapability(actor, 'appointments.write')
    assertClinicAccess(actor, input.clinicId)

    await assertSchedulable({
      clinicId: input.clinicId, staffId: input.staffId,
      startAt: input.startAt, endAt: input.endAt,
      excludeId: '00000000-0000-0000-0000-000000000000', status: input.status,
    })

    const row = await appointmentRepository.insert(toRow(input), actor.id)
    return toDto(row)
  },

  async update(actor: Actor, id: string, input: Partial<AdminReservationWriteInput>) {
    requireCapability(actor, 'appointments.write')

    const current = await appointmentRepository.findById(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '予約が見つかりませんでした。', detail: `reservationId=${id}`,
      })
    }
    assertClinicAccess(actor, current.clinic_id)
    if (input.clinicId) assertClinicAccess(actor, input.clinicId)

    // 日時や担当者が変わるなら、変更後の内容で重複を見直す
    const next = {
      clinicId: input.clinicId ?? current.clinic_id,
      staffId: input.staffId !== undefined ? input.staffId : current.staff_id,
      startAt: input.startAt ?? current.start_at,
      endAt: input.endAt ?? current.end_at,
      status: input.status ?? current.status,
    }
    await assertSchedulable({ ...next, excludeId: id })

    const row = await appointmentRepository.updateFields(id, toRow(input), actor.id)
    return { before: toDto(current), after: toDto(row) }
  },

  /** 来院済・キャンセルなどの状態変更。当日受付やカレンダーから呼ばれる */
  async changeStatus(actor: Actor, id: string, status: ReservationRow['status']) {
    requireCapability(actor, 'appointments.write')

    const current = await appointmentRepository.findById(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '予約が見つかりませんでした。', detail: `reservationId=${id}`,
      })
    }
    assertClinicAccess(actor, current.clinic_id)

    const row = await appointmentRepository.updateFields(id, { status }, actor.id)
    return { before: toDto(current), after: toDto(row) }
  },

  async remove(actor: Actor, id: string): Promise<AdminReservationDto> {
    requireCapability(actor, 'appointments.delete')

    const current = await appointmentRepository.findById(id)
    if (!current) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '予約が見つかりませんでした。', detail: `reservationId=${id}`,
      })
    }
    assertClinicAccess(actor, current.clinic_id)

    await appointmentRepository.softDelete(id, actor.id)
    return toDto(current)
  },
}
