import { z } from 'zod'

/**
 * 予約まわりの入力スキーマ。
 * フロントとサーバーで同じ定義を使い、二重に検証する。
 */

/** 電話番号は表記ゆれ（ハイフン・全角）を吸収したうえで桁数だけ見る */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, '電話番号を入力してください')
  .max(20, '電話番号が長すぎます')
  .refine(
    (v) => {
      const digits = v.replace(/[^0-9]/g, '').replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xfee0))
      return digits.length >= 10 && digits.length <= 11
    },
    '電話番号は10桁または11桁で入力してください',
  )

export const uuidSchema = z.string().uuid('IDの形式が正しくありません')

/** 予約の照会（患者向け・未認証） */
export const lookupAppointmentsSchema = z.object({
  phone: phoneSchema,
})
export type LookupAppointmentsInput = z.infer<typeof lookupAppointmentsSchema>

/** 予約のキャンセル（患者向け・未認証） */
export const cancelAppointmentSchema = z.object({
  reservationId: uuidSchema,
  phone: phoneSchema,
})
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>

/** 予約の日時変更（患者向け・未認証） */
export const rescheduleAppointmentSchema = z.object({
  reservationId: uuidSchema,
  phone: phoneSchema,
  startAt: z.string().datetime({ offset: true, message: '日時の形式が正しくありません' }),
  endAt: z.string().datetime({ offset: true, message: '日時の形式が正しくありません' }),
})
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>
