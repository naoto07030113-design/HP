import { z } from 'zod'
import { phoneSchema, uuidSchema } from './appointment'

/**
 * Web予約（患者向け・未認証）の入力スキーマ。
 *
 * 未認証で誰でも叩けるエンドポイントなので、受け取る値をここで厳密に絞る。
 * 状態（status）や患者ID、料金に関わる値は一切受け取らない。
 */

/** 未入力は '' でも null でも来る。どちらも null にそろえる */
const text = (max: number) =>
  z.string().trim().max(max).nullable().optional().transform((v) => (v ? v : null))

export const intakePatientSchema = z.object({
  name: z.string().trim().min(1, 'お名前を入力してください').max(100),
  name_kana: text(100),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional().transform((v) => v ?? 'unknown'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '生年月日の形式が正しくありません')
    .nullable().optional().or(z.literal('')).transform((v) => (v ? v : null)),
  phone: text(20),
  email: z.string().trim().email('メールアドレスの形式が正しくありません').max(200)
    .nullable().optional().or(z.literal('')).transform((v) => (v ? v : null)),
  postal_code: text(20),
  address: text(200),
  chief_complaint: text(500),
  medical_history: text(500),
  current_medications: text(500),
  allergies: text(500),
  referral_source: text(100),
  referral_name: text(100),
})

export const intakeSchema = z.object({
  /** 初診のときだけ入る。再来は予約だけを作る */
  patient: intakePatientSchema.optional(),
  reservation: z.object({
    clinic_id: uuidSchema,
    staff_id: uuidSchema.nullable().optional().transform((v) => v ?? null),
    menu_id: uuidSchema,
    patient_name: z.string().trim().min(1, 'お名前を入力してください').max(100),
    patient_phone: phoneSchema,
    start_at: z.string().datetime({ offset: true, message: '日時の形式が正しくありません' }),
    end_at: z.string().datetime({ offset: true, message: '日時の形式が正しくありません' }),
    memo: text(500),
    referral_name: text(100),
  }),
})
export type IntakeInput = z.infer<typeof intakeSchema>
