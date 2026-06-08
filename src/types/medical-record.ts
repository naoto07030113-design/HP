export const TREATMENT_AREAS = [
  '頭部', '顔面', '頸部', '肩', '上腕', '前腕', '手・指',
  '胸部', '腹部', '背部（上）', '背部（下）', '腰部', '臀部',
  '大腿', '下腿', '膝', '足首', '足・趾',
] as const

export const TREATMENT_METHODS = [
  '鍼治療', '灸治療', '整体', 'マッサージ', 'ストレッチ',
  '電気治療', '超音波', 'テーピング', 'カッピング', 'その他',
] as const

export type TreatmentArea = typeof TREATMENT_AREAS[number]
export type TreatmentMethod = typeof TREATMENT_METHODS[number]

export interface MedicalRecord {
  id: string
  patient_id: string
  patient_name: string       // 表示用の非正規化
  reservation_id: string | null
  clinic_id: string
  staff_id: string | null
  visit_date: string          // "yyyy-MM-dd"

  // SOAP
  subjective: string | null   // S: 患者の訴え・主訴
  objective: string | null    // O: 所見・検査結果
  assessment: string | null   // A: 評価・診断
  plan: string | null         // P: 治療計画

  // バイタルサイン
  blood_pressure_systolic: number | null    // 収縮期血圧 (mmHg)
  blood_pressure_diastolic: number | null   // 拡張期血圧 (mmHg)
  pulse: number | null        // 脈拍 (bpm)
  temperature: number | null  // 体温 (°C)

  // 施術情報
  treatment_areas: string[]
  treatment_methods: string[]
  treatment_duration_min: number | null
  treatment_notes: string | null

  // 次回・メモ
  next_visit_plan: string | null
  memo: string | null

  created_at: string
  updated_at: string
}

export type MedicalRecordFormData = Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>
