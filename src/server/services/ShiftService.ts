/**
 * 勤務シフトの参照と編集。
 *
 * 以前はブラウザが shifts テーブルを全件取得し、そのまま upsert / delete していた。
 * 他院のシフトが端末に載るうえ、所属院の外を書き換えることも止められなかった。
 * ここで表示期間で絞り、対象スタッフの所属院を必ず確認してから書き込む。
 */

import {
  shiftRepository,
  type ShiftRow,
  type ShiftBlockRow,
} from '../repositories/ShiftRepository'
import { AppError, ERROR_CODES } from '../errors/AppError'
import { assertClinicAccess, clinicScope, requireCapability } from '../permissions/policy'
import type { Actor } from '../auth/session'
import type { ShiftListInput, ShiftUpsertInput } from '../validators/shift'

export type ShiftDto = {
  id: string
  staffId: string
  clinicId: string
  workDate: string
  shiftType: ShiftRow['shift_type']
  startTime: string
  endTime: string
  breakStart: string | null
  breakEnd: string | null
  createdAt: string
  updatedAt: string
}

export type ShiftBlockDto = {
  id: string
  staffId: string
  blockDate: string
  startTime: string
  endTime: string
  reason: string | null
}

/** 時刻は "09:00:00" で返ることがあるため画面が扱う HH:MM にそろえる */
function hhmm(value: string | null): string | null {
  if (!value) return null
  return value.slice(0, 5)
}

function toDto(r: ShiftRow): ShiftDto {
  return {
    id: r.id,
    staffId: r.staff_id,
    clinicId: r.clinic_id,
    workDate: r.work_date,
    shiftType: r.shift_type ?? 'work',
    startTime: hhmm(r.start_time) ?? '09:00',
    endTime: hhmm(r.end_time) ?? '18:00',
    breakStart: hhmm(r.break_start),
    breakEnd: hhmm(r.break_end),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toBlockDto(r: ShiftBlockRow): ShiftBlockDto {
  return {
    id: r.id,
    staffId: r.staff_id,
    blockDate: r.block_date,
    startTime: hhmm(r.start_time) ?? '00:00',
    endTime: hhmm(r.end_time) ?? '00:00',
    reason: r.reason,
  }
}

const MAX_RANGE_DAYS = 400

function assertRange(from: string, to: string): void {
  const start = new Date(`${from}T00:00:00+09:00`).getTime()
  const end = new Date(`${to}T00:00:00+09:00`).getTime()
  if (!(start <= end)) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
      message: '終了日は開始日以降にしてください。',
      detail: `from=${from} to=${to}`,
    })
  }
  const days = (end - start) / 86_400_000
  if (days > MAX_RANGE_DAYS) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
      message: '一度に表示できる期間を超えています。',
      detail: `${days}日 (上限 ${MAX_RANGE_DAYS}日)`,
    })
  }
}

function assertTimes(input: ShiftUpsertInput): void {
  // 休みの日は時刻を見ない（画面上も既定値のまま残ることがある）
  if (input.shiftType !== 'work' && input.shiftType !== 'special') return
  if (!(input.startTime < input.endTime)) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
      message: '終了時刻は開始時刻より後にしてください。',
      detail: `${input.workDate} ${input.startTime}-${input.endTime}`,
    })
  }
  if (input.breakStart && input.breakEnd && !(input.breakStart < input.breakEnd)) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
      message: '休憩の終了時刻は開始時刻より後にしてください。',
      detail: `${input.workDate} break ${input.breakStart}-${input.breakEnd}`,
    })
  }
}

function toRow(input: ShiftUpsertInput): Record<string, unknown> {
  return {
    staff_id: input.staffId,
    clinic_id: input.clinicId,
    work_date: input.workDate,
    shift_type: input.shiftType,
    start_time: input.startTime,
    end_time: input.endTime,
    break_start: input.breakStart,
    break_end: input.breakEnd,
  }
}

/**
 * 対象スタッフが本当にその院に所属しているかを確認する。
 * 画面から送られてきた clinic_id を信用すると、他院のスタッフのシフトを
 * 自院のものとして作れてしまう。
 */
async function assertStaffInClinic(actor: Actor, inputs: ShiftUpsertInput[]): Promise<void> {
  const staffIds = Array.from(new Set(inputs.map((i) => i.staffId)))
  const owners = await shiftRepository.staffClinicIds(staffIds)

  for (const input of inputs) {
    assertClinicAccess(actor, input.clinicId)

    const owner = owners.get(input.staffId)
    if (!owner) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '対象のスタッフが見つかりませんでした。',
        detail: `staffId=${input.staffId}`,
      })
    }
    if (owner !== input.clinicId) {
      throw new AppError(ERROR_CODES.CLINIC_SCOPE_VIOLATION, {
        detail: `staffId=${input.staffId} は clinicId=${owner} 所属だが ${input.clinicId} で登録しようとした`,
      })
    }
    assertClinicAccess(actor, owner)
  }
}

export const shiftService = {
  async list(actor: Actor, input: ShiftListInput) {
    requireCapability(actor, 'shifts.read')
    assertRange(input.from, input.to)
    const scope = clinicScope(actor)
    if (input.clinicId) assertClinicAccess(actor, input.clinicId)

    const { shifts, blocks } = await shiftRepository.listByRange({
      clinicScope: scope,
      clinicFilter: input.clinicId ?? null,
      staffId: input.staffId ?? null,
      from: input.from,
      to: input.to,
    })

    return {
      shifts: shifts.map(toDto),
      blocks: blocks.map(toBlockDto),
      from: input.from,
      to: input.to,
    }
  },

  /** 1件でも一括でも同じ経路を通す（前週コピー・一括入力もここ） */
  async upsertMany(actor: Actor, inputs: ShiftUpsertInput[]): Promise<ShiftDto[]> {
    requireCapability(actor, 'shifts.manage')
    inputs.forEach(assertTimes)
    await assertStaffInClinic(actor, inputs)

    const rows = await shiftRepository.upsertMany(inputs.map(toRow))
    return rows.map(toDto)
  },

  async remove(actor: Actor, staffId: string, workDate: string): Promise<ShiftDto | null> {
    requireCapability(actor, 'shifts.manage')

    const current = await shiftRepository.findOne(staffId, workDate)
    if (!current) {
      // 既に無いものを消そうとした場合は成功扱いにする（同じ結果になるため）
      return null
    }
    assertClinicAccess(actor, current.clinic_id)

    await shiftRepository.remove(staffId, workDate)
    return toDto(current)
  },
}
