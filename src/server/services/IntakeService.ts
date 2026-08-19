/**
 * Web予約（患者向け・未認証）の受け付け。
 *
 * 未認証で誰でも叩けるため、ブラウザから来た値をそのまま信用しない。
 * 院・メニュー・担当者の実在と有効性、そして「その枠が本当に空いているか」を
 * サーバーで必ず確認してから登録する。
 *
 * 空き判定は画面表示用と同じ AvailabilityService を通す。
 * 画面に空きが出てから送信するまでの間に他の患者が同じ枠を取った場合も、
 * ここで弾かれる。
 */

import { createServiceClient } from '@/lib/supabase'
import { AppError, ERROR_CODES } from '../errors/AppError'
import { availabilityService } from './AvailabilityService'
import { notifyNewReservation } from '../notifications/lineNotifier'
import type { IntakeInput } from '../validators/intake'

type ClinicRow = { id: string; name: string; is_active: boolean }
type MenuRow = { id: string; clinic_id: string; name: string; duration_min: number; is_active: boolean }
type StaffRow = { id: string; clinic_id: string; name: string; is_active: boolean; is_bookable: boolean }

function db() {
  return createServiceClient()
}

function wrap(error: { message: string; code?: string } | null, what: string): void {
  if (!error) return
  throw new AppError(ERROR_CODES.DEPENDENCY_UNAVAILABLE, {
    detail: `${what} に失敗: ${error.message}${error.code ? ` (code=${error.code})` : ''}`,
  })
}

/** ISO 日時から JST の yyyy-MM-dd と HH:MM を取り出す */
function jstParts(iso: string): { date: string; time: string } {
  const jst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}`,
    time: `${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`,
  }
}

export type IntakeResult = {
  reservationId: string
  patientId: string | null
}

export const intakeService = {
  async create(input: IntakeInput, requestId: string): Promise<IntakeResult> {
    const r = input.reservation
    const supabase = db()

    if (new Date(r.start_at).getTime() >= new Date(r.end_at).getTime()) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
        message: 'ご予約の時間が正しくありません。', detail: `start=${r.start_at} end=${r.end_at}`,
      })
    }
    if (new Date(r.start_at).getTime() < Date.now()) {
      throw new AppError(ERROR_CODES.VALIDATION_FAILED, {
        message: '過去の日時にはご予約できません。', detail: `start=${r.start_at}`,
      })
    }

    const [clinicRes, menuRes] = await Promise.all([
      supabase.from('clinics').select('id,name,is_active').eq('id', r.clinic_id).maybeSingle(),
      supabase.from('menus').select('id,clinic_id,name,duration_min,is_active').eq('id', r.menu_id).maybeSingle(),
    ])
    const clinic = clinicRes.data as ClinicRow | null
    const menu = menuRes.data as MenuRow | null

    if (!clinic || !clinic.is_active) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: '院が見つかりませんでした。', detail: `clinicId=${r.clinic_id}`,
      })
    }
    if (!menu || !menu.is_active || menu.clinic_id !== r.clinic_id) {
      throw new AppError(ERROR_CODES.NOT_FOUND, {
        message: 'メニューが見つかりませんでした。', detail: `menuId=${r.menu_id} clinicId=${r.clinic_id}`,
      })
    }

    let staff: StaffRow | null = null
    if (r.staff_id) {
      const { data } = await supabase
        .from('staff').select('id,clinic_id,name,is_active,is_bookable').eq('id', r.staff_id).maybeSingle()
      staff = data as StaffRow | null
      if (!staff || !staff.is_active || !staff.is_bookable || staff.clinic_id !== r.clinic_id) {
        throw new AppError(ERROR_CODES.NOT_FOUND, {
          message: '担当者が見つかりませんでした。', detail: `staffId=${r.staff_id} clinicId=${r.clinic_id}`,
        })
      }
    }

    // その枠が本当に空いているか（休診・営業時間・シフト・重複をまとめて見る）
    const { date, time } = jstParts(r.start_at)
    const openSlots = await availabilityService.listOpenSlots({
      clinicId: r.clinic_id, date, menuId: r.menu_id, staffId: r.staff_id,
    })
    if (!openSlots.includes(time)) {
      throw new AppError(ERROR_CODES.APPOINTMENT_CONFLICT, {
        message: '申し訳ありません、この時間はちょうど埋まってしまいました。別の時間をお選びください。',
        detail: `date=${date} time=${time} staffId=${r.staff_id ?? 'none'} openSlots=${openSlots.length}`,
      })
    }

    // 初診なら患者を登録する。
    // anon キーで動く環境では RETURNING が使えないため ID をこちらで採番する
    let patientId: string | null = null
    if (input.patient?.name) {
      const p = input.patient
      patientId = crypto.randomUUID()
      const { error } = await supabase.from('patients').insert({
        id: patientId,
        clinic_id: r.clinic_id,
        name: p.name,
        name_kana: p.name_kana ?? '',
        gender: p.gender,
        birth_date: p.birth_date,
        phone: p.phone ?? r.patient_phone,
        email: p.email,
        postal_code: p.postal_code,
        address: p.address,
        first_visit_date: date,
        chief_complaint: p.chief_complaint,
        medical_history: p.medical_history,
        current_medications: p.current_medications,
        allergies: p.allergies,
        referral_source: p.referral_source,
      })
      wrap(error, '患者の登録')
    }

    const reservationId = crypto.randomUUID()
    const { error: resError } = await supabase.from('reservations').insert({
      id: reservationId,
      clinic_id: r.clinic_id,
      staff_id: r.staff_id,
      menu_id: r.menu_id,
      patient_id: patientId,
      patient_name: r.patient_name,
      patient_phone: r.patient_phone,
      referral_name: r.referral_name ?? input.patient?.referral_name ?? null,
      start_at: r.start_at,
      end_at: r.end_at,
      status: 'confirmed',
      memo: r.memo,
    })
    wrap(resError, '予約の登録')

    // 通知は予約が成立してから、サーバー内部からのみ送る（失敗しても予約は成立）
    await notifyNewReservation({
      requestId,
      clinicId: clinic.id,
      clinicName: clinic.name,
      patientName: r.patient_name,
      startAt: r.start_at,
      menuName: menu.name,
      staffName: staff?.name ?? null,
    })

    return { reservationId, patientId }
  },
}
