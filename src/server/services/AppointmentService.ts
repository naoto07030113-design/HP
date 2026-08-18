/**
 * 予約の業務ルール。
 *
 * 患者向けの照会・キャンセル・日時変更を扱う。ここでの原則:
 * - 本人確認は「予約IDと電話番号の両方が一致すること」で行う
 *   （以前は予約IDだけで誰でも書き換えられた）
 * - 患者へ返す項目は必要最小限に絞る。他の患者の情報は決して混ぜない
 * - キャンセル期限・重複・営業時間はサーバー側で判定する
 */

import {
  appointmentRepository,
  normalizePhoneForMatch,
  type ReservationRow,
} from '../repositories/AppointmentRepository'
import { AppError, ERROR_CODES } from '../errors/AppError'
import { createServiceClient } from '@/lib/supabase'

/** 患者へ返す形。氏名は本人のものだけ、メモや内部IDは返さない */
export type PatientFacingAppointment = {
  id: string
  clinicId: string
  clinicName: string
  /** 日時変更で空き枠を問い合わせるために必要 */
  menuId: string | null
  /** 本人の氏名。照会した本人の予約だけを返すため、ここに他人の名前は入らない */
  patientName: string
  staffName: string | null
  menuName: string | null
  menuDurationMin: number | null
  startAt: string
  endAt: string
  /** キャンセル可能期限を過ぎていないか */
  cancellable: boolean
}

type Settings = { minCancellationHours: number }

async function loadSettings(): Promise<Settings> {
  const { data } = await createServiceClient()
    .from('app_settings')
    .select('min_cancellation_hours')
    .eq('id', 1)
    .maybeSingle()
  const hours = (data as { min_cancellation_hours?: number } | null)?.min_cancellation_hours
  return { minCancellationHours: typeof hours === 'number' ? hours : 24 }
}

/** 表示用の名称をまとめて引く（予約ごとに問い合わせない） */
async function loadLabels(rows: ReservationRow[]) {
  const supabase = createServiceClient()
  const clinicIds = Array.from(new Set(rows.map((r) => r.clinic_id).filter(Boolean)))
  const staffIds = Array.from(new Set(rows.map((r) => r.staff_id).filter((v): v is string => !!v)))
  const menuIds = Array.from(new Set(rows.map((r) => r.menu_id).filter((v): v is string => !!v)))

  const [clinics, staff, menus] = await Promise.all([
    clinicIds.length
      ? supabase.from('clinics').select('id,name').in('id', clinicIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    staffIds.length
      ? supabase.from('staff').select('id,name').in('id', staffIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    menuIds.length
      ? supabase.from('menus').select('id,name,duration_min').in('id', menuIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; duration_min: number }> }),
  ])

  return {
    clinic: new Map((clinics.data ?? []).map((c) => [c.id, c.name])),
    staff: new Map((staff.data ?? []).map((s) => [s.id, s.name])),
    menu: new Map((menus.data ?? []).map((m) => [m.id, m])),
  }
}

function isCancellable(row: ReservationRow, settings: Settings, now: Date): boolean {
  const limit = new Date(row.start_at).getTime() - settings.minCancellationHours * 3600_000
  return now.getTime() < limit
}

/**
 * 予約IDと電話番号の両方が一致した場合だけ対象を返す。
 * どちらかでも違えば「見つからない」として扱い、
 * 「IDは存在するが電話番号が違う」という情報も与えない。
 */
async function findOwned(reservationId: string, phone: string): Promise<ReservationRow> {
  const row = await appointmentRepository.findById(reservationId)
  if (!row) {
    throw new AppError(ERROR_CODES.NOT_FOUND, {
      message: 'ご予約が見つかりませんでした。お電話番号をご確認ください。',
      detail: `reservationId=${reservationId} が存在しません`,
    })
  }
  if (normalizePhoneForMatch(row.patient_phone) !== normalizePhoneForMatch(phone)) {
    throw new AppError(ERROR_CODES.NOT_FOUND, {
      message: 'ご予約が見つかりませんでした。お電話番号をご確認ください。',
      detail: `reservationId=${reservationId} の電話番号が一致しません（本人確認失敗）`,
    })
  }
  return row
}

export const appointmentService = {
  /** 電話番号に一致する今後の予約だけを、患者向けの形で返す */
  async lookupByPhone(phone: string): Promise<PatientFacingAppointment[]> {
    const now = new Date()
    const rows = await appointmentRepository.findUpcomingByPhone(phone, now)
    if (rows.length === 0) return []

    const [settings, labels] = await Promise.all([loadSettings(), loadLabels(rows)])
    return rows.map((r) => {
      const menu = r.menu_id ? labels.menu.get(r.menu_id) : undefined
      return {
        id: r.id,
        clinicId: r.clinic_id,
        clinicName: labels.clinic.get(r.clinic_id) ?? '',
        menuId: r.menu_id,
        patientName: r.patient_name,
        staffName: r.staff_id ? labels.staff.get(r.staff_id) ?? null : null,
        menuName: menu?.name ?? null,
        menuDurationMin: menu?.duration_min ?? null,
        startAt: r.start_at,
        endAt: r.end_at,
        cancellable: isCancellable(r, settings, now),
      }
    })
  },

  async cancel(reservationId: string, phone: string): Promise<{ before: ReservationRow; after: ReservationRow }> {
    const row = await findOwned(reservationId, phone)

    if (row.status === 'cancelled') {
      throw new AppError(ERROR_CODES.ALREADY_CANCELLED, { detail: `reservationId=${reservationId}` })
    }
    if (row.status !== 'confirmed') {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: 'この予約はキャンセルできません。お電話でご連絡ください。',
        detail: `status=${row.status} はキャンセル対象外`,
      })
    }

    const settings = await loadSettings()
    if (!isCancellable(row, settings, new Date())) {
      throw new AppError(ERROR_CODES.CANCELLATION_TOO_LATE, {
        message: `ご予約の${settings.minCancellationHours}時間前を過ぎているため、こちらからはキャンセルできません。お電話でご連絡ください。`,
        detail: `startAt=${row.start_at} minCancellationHours=${settings.minCancellationHours}`,
      })
    }

    const after = await appointmentRepository.updateStatus(reservationId, 'cancelled')
    return { before: row, after }
  },

  async reschedule(
    reservationId: string,
    phone: string,
    startAt: string,
    endAt: string,
  ): Promise<{ before: ReservationRow; after: ReservationRow }> {
    const row = await findOwned(reservationId, phone)

    if (row.status !== 'confirmed') {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: 'この予約は変更できません。お電話でご連絡ください。',
        detail: `status=${row.status} は変更対象外`,
      })
    }

    const start = new Date(startAt)
    const end = new Date(endAt)
    if (!(start.getTime() < end.getTime())) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
        message: '終了時刻は開始時刻より後にしてください。',
        detail: `startAt=${startAt} endAt=${endAt}`,
      })
    }
    if (start.getTime() <= Date.now()) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
        message: '過去の日時には変更できません。',
        detail: `startAt=${startAt} は現在時刻より前`,
      })
    }

    // 変更後の枠が空いているかをサーバー側で確認する
    const overlapping = await appointmentRepository.findOverlapping(
      row.clinic_id, row.staff_id, startAt, endAt, reservationId,
    )
    if (overlapping.length > 0) {
      throw new AppError(ERROR_CODES.APPOINTMENT_CONFLICT, {
        detail: `${overlapping.length}件と重複 (staffId=${row.staff_id ?? 'none'})`,
      })
    }

    const after = await appointmentRepository.updateSchedule(reservationId, startAt, endAt)
    return { before: row, after }
  },
}
