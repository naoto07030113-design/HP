import { z } from 'zod'
import { uuidSchema } from './appointment'

/**
 * 患者情報の入力スキーマ。
 * 画面側と同じ定義を使い、サーバーでも必ず検証する。
 */

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal('')).transform((v) => (v ? v : null))

export const genderSchema = z.enum(['male', 'female', 'other', 'unknown'])
export const insuranceSchema = z.enum(['national', 'employee', 'other', 'none'])

/** yyyy-MM-dd。空文字は未入力として null に倒す */
const dateOrNull = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, '日付の形式が正しくありません')
  .optional()
  .transform((v) => (v ? v : null))

export const patientWriteSchema = z.object({
  clinicId: uuidSchema,
  name: z.string().trim().min(1, '患者名を入力してください').max(100),
  nameKana: optionalText(100),
  gender: genderSchema.default('unknown'),
  birthDate: dateOrNull,
  phone: optionalText(20),
  email: z.string().trim().email('メールアドレスの形式が正しくありません').max(255).optional().or(z.literal('')).transform((v) => (v ? v : null)),
  postalCode: optionalText(10),
  address: optionalText(255),
  firstVisitDate: dateOrNull,
  primaryStaffId: uuidSchema.nullable().optional().transform((v) => v ?? null),
  insuranceType: insuranceSchema.default('none'),
  referralSource: optionalText(100),
  chiefComplaint: optionalText(1000),
  medicalHistory: optionalText(1000),
  currentMedications: optionalText(1000),
  allergies: optionalText(500),
  notes: optionalText(2000),
  isActive: z.boolean().default(true),
})
export type PatientWriteInput = z.infer<typeof patientWriteSchema>

export const patientCreateSchema = patientWriteSchema
export const patientUpdateSchema = patientWriteSchema.partial().extend({ id: uuidSchema })

/** 一覧。件数が増えても壊れないよう必ずページングする */
export const patientListSchema = z.object({
  clinicId: uuidSchema.nullable().optional(),
  search: z.string().trim().max(100).optional(),
  includeInactive: z.boolean().optional(),
  page: z.number().int().min(1).max(10000).default(1),
  perPage: z.number().int().min(1).max(100).default(50),
})
export type PatientListInput = z.infer<typeof patientListSchema>

export const patientIdSchema = z.object({ id: uuidSchema })
