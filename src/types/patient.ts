export type Gender = 'male' | 'female' | 'other' | 'unknown'
export type InsuranceType = 'national' | 'employee' | 'other' | 'none'

export interface Patient {
  id: string
  clinic_id: string
  name: string            // 漢字
  name_kana: string       // フリガナ
  gender: Gender
  birth_date: string | null   // "yyyy-MM-dd"
  phone: string | null
  email: string | null
  postal_code: string | null
  address: string | null
  first_visit_date: string | null
  primary_staff_id: string | null
  insurance_type: InsuranceType
  referral_source: string | null
  chief_complaint: string | null    // 主訴
  medical_history: string | null    // 既往歴
  current_medications: string | null
  allergies: string | null
  notes: string | null              // 院内メモ（患者非表示）
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PatientFormData = Omit<Patient, 'id' | 'created_at' | 'updated_at'>

export const GENDER_LABELS: Record<Gender, string> = {
  male: '男性',
  female: '女性',
  other: 'その他',
  unknown: '不明',
}

export const INSURANCE_LABELS: Record<InsuranceType, string> = {
  national: '国民健康保険',
  employee: '社会保険',
  other: 'その他保険',
  none: '自費',
}

export const REFERRAL_SOURCES = [
  '知人・家族の紹介',
  'Google検索',
  'Instagram',
  'LINE',
  'チラシ・ポスティング',
  '看板',
  '近くを通りかかって',
  'その他',
] as const

export function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}
