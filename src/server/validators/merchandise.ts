import { z } from 'zod'
import { phoneSchema, uuidSchema } from './appointment'

/** 物販予約の入力スキーマ */

export const merchandiseBookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled', 'delivered'])

/** 患者向け（未認証）。状態は受け取らず、必ず pending で作る */
export const merchandiseBookingCreateSchema = z.object({
  merchandiseId: uuidSchema,
  clinicId: uuidSchema,
  patientName: z.string().trim().min(1, 'お名前を入力してください').max(100),
  patientPhone: phoneSchema,
  quantity: z.number().int().min(1, '数量は1以上にしてください').max(99),
  notes: z.string().trim().max(500).nullable().optional().transform((v) => (v ? v : null)),
})
export type MerchandiseBookingCreateInput = z.infer<typeof merchandiseBookingCreateSchema>

export const merchandiseBookingListSchema = z.object({
  clinicId: uuidSchema.nullable().optional(),
  status: merchandiseBookingStatusSchema.nullable().optional(),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(500).default(100),
})
export type MerchandiseBookingListInput = z.infer<typeof merchandiseBookingListSchema>

export const merchandiseBookingStatusUpdateSchema = z.object({
  id: uuidSchema,
  status: merchandiseBookingStatusSchema,
})

export const merchandiseBookingIdSchema = z.object({ id: uuidSchema })
