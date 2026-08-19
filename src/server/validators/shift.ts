import { z } from 'zod'
import { uuidSchema } from './appointment'

/** 勤務シフトの入力スキーマ */

const hhmm = (label: string) =>
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${label}は HH:MM 形式で入力してください`)

export const shiftTypeSchema = z.enum(['work', 'off', 'paid', 'sick', 'special'])

export const shiftUpsertSchema = z.object({
  staffId: uuidSchema,
  clinicId: uuidSchema,
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '勤務日の形式が正しくありません'),
  shiftType: shiftTypeSchema.default('work'),
  startTime: hhmm('開始時刻').default('09:00'),
  endTime: hhmm('終了時刻').default('18:00'),
  breakStart: hhmm('休憩開始').nullable().optional().transform((v) => v ?? null),
  breakEnd: hhmm('休憩終了').nullable().optional().transform((v) => v ?? null),
})
export type ShiftUpsertInput = z.infer<typeof shiftUpsertSchema>

/** 一括入力・前週コピー用 */
export const shiftBulkUpsertSchema = z.object({
  shifts: z.array(shiftUpsertSchema).min(1, '対象が1件もありません').max(500),
})

export const shiftListSchema = z.object({
  clinicId: uuidSchema.nullable().optional(),
  staffId: uuidSchema.nullable().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '開始日の形式が正しくありません'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '終了日の形式が正しくありません'),
})
export type ShiftListInput = z.infer<typeof shiftListSchema>

export const shiftDeleteSchema = z.object({
  staffId: uuidSchema,
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '勤務日の形式が正しくありません'),
})
