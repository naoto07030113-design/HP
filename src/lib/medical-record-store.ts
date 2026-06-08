'use client'

import { useState, useEffect } from 'react'
import type { MedicalRecord } from '@/types/medical-record'

const NOW = new Date().toISOString()
function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
}

const DEMO_RECORDS: MedicalRecord[] = [
  {
    id: 'rec-1',
    patient_id: 'pat-1',
    patient_name: '田中 一郎',
    reservation_id: null,
    clinic_id: 'clinic-1',
    staff_id: 'staff-1',
    visit_date: daysAgo(7),
    subjective: '右肩の痛みと可動域制限。デスクワークが続いており、首から右腕にかけての張りを訴えている。',
    objective: '右肩関節の外転60°で疼痛。頸部右回旋制限あり。肩甲骨周囲筋の過緊張を触診で確認。',
    assessment: '頸肩症候群（筋筋膜性疼痛）。姿勢不良による慢性的な筋緊張が主因と考える。',
    plan: '週2回の通院で鍼治療＋整体を継続。姿勢指導を実施する。4週後に再評価。',
    blood_pressure_systolic: 124,
    blood_pressure_diastolic: 78,
    pulse: 72,
    temperature: 36.4,
    treatment_areas: ['頸部', '肩', '背部（上）'],
    treatment_methods: ['鍼治療', '整体', 'ストレッチ'],
    treatment_duration_min: 60,
    treatment_notes: '頸部LI4、肩井、天宗に鍼。右肩甲挙筋の弛緩を確認後に整体施行。',
    next_visit_plan: '3日後に再来予定',
    memo: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'rec-2',
    patient_id: 'pat-1',
    patient_name: '田中 一郎',
    reservation_id: null,
    clinic_id: 'clinic-1',
    staff_id: 'staff-1',
    visit_date: daysAgo(3),
    subjective: '前回より痛みが50%程度軽減。可動域も改善してきた。',
    objective: '右肩関節外転80°まで改善。頸部回旋制限も軽減。',
    assessment: '改善傾向良好。継続治療で経過観察。',
    plan: '治療継続。週1回に移行を検討。',
    blood_pressure_systolic: 122,
    blood_pressure_diastolic: 76,
    pulse: 70,
    temperature: 36.5,
    treatment_areas: ['頸部', '肩', '上腕'],
    treatment_methods: ['鍼治療', 'マッサージ'],
    treatment_duration_min: 50,
    treatment_notes: '前回と同穴位。反応が良好なため治療時間を短縮。',
    next_visit_plan: '1週後に再来',
    memo: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'rec-3',
    patient_id: 'pat-2',
    patient_name: '佐藤 美咲',
    reservation_id: null,
    clinic_id: 'clinic-1',
    staff_id: 'staff-2',
    visit_date: daysAgo(5),
    subjective: '腰痛が強く、立ち仕事中の疼痛が辛い。左臀部から左下肢にかけてのしびれも訴えている。',
    objective: 'SLR試験：左45°陽性。腰椎L4/L5周囲の筋緊張著明。',
    assessment: '腰部椎間板ヘルニア疑い（L4-L5）。神経症状に注意しながら保存治療。',
    plan: '電気治療＋鍼治療で炎症抑制。安静指導。改善なければ整形外科への紹介を検討。',
    blood_pressure_systolic: 118,
    blood_pressure_diastolic: 74,
    pulse: 68,
    temperature: 36.2,
    treatment_areas: ['腰部', '臀部', '大腿'],
    treatment_methods: ['鍼治療', '電気治療'],
    treatment_duration_min: 45,
    treatment_notes: '腰部委中・腎兪・大腸兪へ鍼。電気治療15分。',
    next_visit_plan: '2日後に再来',
    memo: null,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'rec-4',
    patient_id: 'pat-3',
    patient_name: '鈴木 健太',
    reservation_id: null,
    clinic_id: 'clinic-1',
    staff_id: 'staff-3',
    visit_date: daysAgo(10),
    subjective: '膝の痛みで階段の昇降が困難。スポーツ中に受傷した模様。',
    objective: 'McMurray試験：陰性。膝蓋骨周囲の圧痛あり。関節水腫なし。',
    assessment: '膝蓋腱炎（ジャンパー膝）。',
    plan: 'テーピング＋超音波治療で経過観察。運動制限を指示。',
    blood_pressure_systolic: 126,
    blood_pressure_diastolic: 80,
    pulse: 65,
    temperature: 36.6,
    treatment_areas: ['膝', '大腿', '下腿'],
    treatment_methods: ['超音波', 'テーピング', 'ストレッチ'],
    treatment_duration_min: 40,
    treatment_notes: '膝蓋靭帯への超音波10分。クロスストラップテーピング施行。',
    next_visit_plan: '1週後に再来',
    memo: 'バスケットボール選手。試合まで3週間あり。',
    created_at: NOW,
    updated_at: NOW,
  },
]

const KEY = 'medical_record_store_v1'

let _records: MedicalRecord[] = (() => {
  if (typeof window === 'undefined') return DEMO_RECORDS
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : DEMO_RECORDS
  } catch { return DEMO_RECORDS }
})()

let _listeners: Array<() => void> = []

function notify() {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(KEY, JSON.stringify(_records)) } catch {}
  }
  _listeners.forEach((fn) => fn())
}

function genId() {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export const medicalRecordStore = {
  getAll: () => _records,
  getById: (id: string) => _records.find((r) => r.id === id) ?? null,
  getByPatient: (patientId: string) =>
    _records
      .filter((r) => r.patient_id === patientId)
      .sort((a, b) => (a.visit_date > b.visit_date ? -1 : 1)),
  getByClinic: (clinicId: string) =>
    _records
      .filter((r) => r.clinic_id === clinicId)
      .sort((a, b) => (a.visit_date > b.visit_date ? -1 : 1)),
  getByReservation: (reservationId: string) =>
    _records.find((r) => r.reservation_id === reservationId) ?? null,
  create: (data: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const item: MedicalRecord = { ...data, id: genId(), created_at: now, updated_at: now }
    _records = [item, ..._records]
    notify()
    return item
  },
  update: (id: string, data: Partial<MedicalRecord>) => {
    _records = _records.map((r) =>
      r.id === id ? { ...r, ...data, updated_at: new Date().toISOString() } : r,
    )
    notify()
  },
  delete: (id: string) => {
    _records = _records.filter((r) => r.id !== id)
    notify()
  },
}

export function useMedicalRecordStore() {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter((l) => l !== fn) }
  }, [])
  return _records
}
