import { z } from 'zod'
import { uuidSchema } from './appointment'

/**
 * カルテの入力スキーマ。
 * 診療録なので、値の範囲もここで検証する（あり得ない血圧や体温を弾く）。
 */

const text = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal('')).transform((v) => (v ? v : null))

const intOrNull = (min: number, max: number, label: string) =>
  z.number().int().min(min, `${label}は${min}以上で入力してください`).max(max, `${label}は${max}以下で入力してください`)
    .nullable().optional().transform((v) => v ?? null)

export const medicalRecordWriteSchema = z.object({
  patientId: uuidSchema,
  patientName: z.string().trim().min(1, '患者名を入力してください').max(100),
  clinicId: uuidSchema,
  staffId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  reservationId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '来院日の形式が正しくありません'),

  // SOAP
  subjective: text(4000),
  objective: text(4000),
  assessment: text(4000),
  plan: text(4000),

  // バイタル。臨床的にあり得ない値は保存前に弾く
  bloodPressureSystolic: intOrNull(50, 300, '収縮期血圧'),
  bloodPressureDiastolic: intOrNull(30, 200, '拡張期血圧'),
  pulse: intOrNull(20, 250, '脈拍'),
  temperature: z.number().min(30, '体温は30以上で入力してください').max(45, '体温は45以下で入力してください')
    .nullable().optional().transform((v) => v ?? null),

  treatmentAreas: z.array(z.string().trim().max(50)).max(30).default([]),
  treatmentMethods: z.array(z.string().trim().max(50)).max(30).default([]),
  treatmentDurationMin: intOrNull(0, 600, '施術時間'),
  treatmentNotes: text(4000),

  nextVisitPlan: text(1000),
  memo: text(2000),
})
export type MedicalRecordWriteInput = z.infer<typeof medicalRecordWriteSchema>

export const medicalRecordCreateSchema = medicalRecordWriteSchema
export const medicalRecordUpdateSchema = medicalRecordWriteSchema.partial().extend({ id: uuidSchema })

export const medicalRecordListSchema = z.object({
  clinicId: uuidSchema.nullable().optional(),
  patientId: uuidSchema.nullable().optional(),
  staffId: uuidSchema.nullable().optional(),
  search: z.string().trim().max(100).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.number().int().min(1).max(10000).default(1),
  perPage: z.number().int().min(1).max(100).default(50),
})
export type MedicalRecordListInput = z.infer<typeof medicalRecordListSchema>

export const medicalRecordIdSchema = z.object({ id: uuidSchema })
