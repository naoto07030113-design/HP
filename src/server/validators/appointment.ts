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

// ── 管理画面（スタッフ）向け ────────────────────────────

export const reservationStatusSchema = z.enum(['confirmed', 'visited', 'cancelled', 'no_show'])

export const adminReservationWriteSchema = z.object({
  clinicId: uuidSchema,
  staffId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  menuId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  patientId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  patientName: z.string().trim().min(1, '患者名を入力してください').max(100),
  patientPhone: z.string().trim().max(20).optional().or(z.literal('')).transform((v) => (v ? v : null)),
  referralName: z.string().trim().max(100).optional().or(z.literal('')).transform((v) => (v ? v : null)),
  startAt: z.string().datetime({ offset: true, message: '開始日時の形式が正しくありません' }),
  endAt: z.string().datetime({ offset: true, message: '終了日時の形式が正しくありません' }),
  status: reservationStatusSchema.default('confirmed'),
  memo: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : null)),
})
export type AdminReservationWriteInput = z.infer<typeof adminReservationWriteSchema>

export const adminReservationCreateSchema = adminReservationWriteSchema
export const adminReservationUpdateSchema = adminReservationWriteSchema.partial().extend({ id: uuidSchema })

export const adminReservationListSchema = z.object({
  clinicId: uuidSchema.nullable().optional(),
  staffId: uuidSchema.nullable().optional(),
  patientId: uuidSchema.nullable().optional(),
  status: reservationStatusSchema.nullable().optional(),
  search: z.string().trim().max(100).optional(),
  /** 予約カレンダーは日付範囲で引く。一覧は指定なしでも使える */
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().min(1).max(10000).default(1),
  perPage: z.number().int().min(1).max(500).default(100),
})
export type AdminReservationListInput = z.infer<typeof adminReservationListSchema>

export const reservationIdSchema = z.object({ id: uuidSchema })

export const reservationStatusUpdateSchema = z.object({
  id: uuidSchema,
  status: reservationStatusSchema,
})
