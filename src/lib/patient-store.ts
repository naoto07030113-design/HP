'use client'

import { useState, useEffect } from 'react'
import type { Patient } from '@/types/patient'
import { format, subDays, subMonths } from 'date-fns'
import { secureSet, secureGet } from './secure-storage'

const NOW = new Date().toISOString()
const TODAY = format(new Date(), 'yyyy-MM-dd')

export const DEMO_PATIENTS: Patient[] = [
  {
    id: 'pat-1', clinic_id: 'clinic-1',
    name: '田中 一郎', name_kana: 'タナカ イチロウ',
    gender: 'male', birth_date: '1975-04-12',
    phone: '090-1111-2222', email: 'tanaka@example.com',
    postal_code: '150-0001', address: '東京都渋谷区神宮前1-1-1',
    first_visit_date: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    primary_staff_id: 'staff-1',
    insurance_type: 'employee',
    referral_source: 'Google検索',
    chief_complaint: '慢性的な右肩の痛みと可動域制限。デスクワーク続きで悪化。',
    medical_history: '特になし',
    current_medications: 'なし',
    allergies: 'なし',
    notes: null,
    is_active: true, created_at: NOW, updated_at: NOW,
  },
  {
    id: 'pat-2', clinic_id: 'clinic-1',
    name: '佐藤 美咲', name_kana: 'サトウ ミサキ',
    gender: 'female', birth_date: '1988-09-25',
    phone: '090-3333-4444', email: null,
    postal_code: '151-0053', address: '東京都渋谷区代々木2-2-2',
    first_visit_date: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    primary_staff_id: 'staff-2',
    insurance_type: 'national',
    referral_source: '知人・家族の紹介',
    chief_complaint: '腰痛、左下肢のしびれ。立ち仕事で悪化。',
    medical_history: '特になし',
    current_medications: 'なし',
    allergies: '金属アレルギー（ニッケル）',
    notes: '鍼はステンレス製を使用すること。',
    is_active: true, created_at: NOW, updated_at: NOW,
  },
  {
    id: 'pat-3', clinic_id: 'clinic-1',
    name: '鈴木 健太', name_kana: 'スズキ ケンタ',
    gender: 'male', birth_date: '1995-03-15',
    phone: '080-5555-7777', email: null,
    postal_code: '160-0022', address: '東京都新宿区新宿4-4-4',
    first_visit_date: format(subMonths(new Date(), 2), 'yyyy-MM-dd'),
    primary_staff_id: 'staff-3',
    insurance_type: 'employee',
    referral_source: 'Instagram',
    chief_complaint: '膝の痛み（バスケ中に受傷）。階段昇降が困難。',
    medical_history: '特になし',
    current_medications: 'なし',
    allergies: 'なし',
    notes: 'バスケットボール選手。大会3週間前。',
    is_active: true, created_at: NOW, updated_at: NOW,
  },
  {
    id: 'pat-4', clinic_id: 'clinic-1',
    name: '中村 勇', name_kana: 'ナカムラ イサム',
    gender: 'male', birth_date: '1990-07-17',
    phone: '080-1234-5678', email: 'nakamura.sports@example.com',
    postal_code: '160-0023', address: '東京都新宿区西新宿5-5-5',
    first_visit_date: format(subMonths(new Date(), 4), 'yyyy-MM-dd'),
    primary_staff_id: 'staff-3',
    insurance_type: 'employee',
    referral_source: 'Instagram',
    chief_complaint: 'マラソン練習中の右膝外側の痛み（腸脛靭帯炎）。',
    medical_history: '特になし',
    current_medications: 'なし',
    allergies: 'なし',
    notes: 'フルマラソン出場予定。コンディショニング目的。',
    is_active: true, created_at: NOW, updated_at: NOW,
  },
  {
    id: 'pat-5', clinic_id: 'clinic-1',
    name: '渡辺 健', name_kana: 'ワタナベ ケン',
    gender: 'male', birth_date: '1955-11-30',
    phone: '070-9999-0000', email: null,
    postal_code: '150-0044', address: '東京都渋谷区円山町5-5-5',
    first_visit_date: format(subMonths(new Date(), 12), 'yyyy-MM-dd'),
    primary_staff_id: 'staff-1',
    insurance_type: 'other',
    referral_source: 'チラシ・ポスティング',
    chief_complaint: '四十肩（五十肩）。右腕が上がらない。',
    medical_history: '糖尿病（インスリン自己注射）、白内障手術歴',
    current_medications: 'インスリン グラルギン（糖尿病）、メトホルミン',
    allergies: 'ペニシリン系抗生物質',
    notes: '糖尿病あり。傷の治りが遅い可能性。インスリン注射タイミングを確認。',
    is_active: true, created_at: NOW, updated_at: NOW,
  },
  {
    id: 'pat-6', clinic_id: 'clinic-1',
    name: '新患 一郎', name_kana: 'シンカン イチロウ',
    gender: 'male', birth_date: '1985-03-20',
    phone: '080-5555-6666', email: null,
    postal_code: null, address: null,
    first_visit_date: TODAY,
    primary_staff_id: null,
    insurance_type: 'employee',
    referral_source: 'Google検索',
    chief_complaint: '腰痛。引越し作業後から痛みが出た。',
    medical_history: '特になし',
    current_medications: 'なし',
    allergies: 'なし',
    notes: '本日初診。',
    is_active: true, created_at: NOW, updated_at: NOW,
  },
]

// 暗号化キー（新フォーマット）・旧平文キー（移行用）
const KEY_ENC = 'patient_store_v1_enc'
const KEY_OLD = 'patient_store_v1'

// メモリ上は常に復号済みの平文データを保持
let _patients: Patient[] = DEMO_PATIENTS
let _listeners: Array<() => void> = []

function notifyListeners() { _listeners.forEach((fn) => fn()) }

function notify() {
  notifyListeners()
  secureSet(KEY_ENC, _patients) // 非同期・fire and forget
}

function genId() { return `pat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }

/** アプリ起動時に一度呼ぶ。暗号化ストレージから復号して状態を更新する */
export async function hydratePatientStore() {
  if (typeof window === 'undefined') return

  // 新しい暗号化キーを試す
  const data = await secureGet<Patient[]>(KEY_ENC)
  if (data && data.length > 0) {
    _patients = data
    notifyListeners()
    return
  }

  // 移行: 旧平文キーが残っていれば読み込んで暗号化して保存
  const old = localStorage.getItem(KEY_OLD)
  if (old) {
    try {
      const parsed = JSON.parse(old) as Patient[]
      _patients = parsed
      notifyListeners()
      await secureSet(KEY_ENC, _patients)
      localStorage.removeItem(KEY_OLD) // 平文データを削除
    } catch {}
  }
}

export const patientStore = {
  getAll: () => _patients,
  getById: (id: string) => _patients.find((p) => p.id === id) ?? null,
  getByClinic: (clinicId: string) => _patients.filter((p) => p.clinic_id === clinicId),
  search: (query: string, clinicId?: string) => {
    const q = query.toLowerCase()
    return _patients.filter((p) => {
      if (clinicId && p.clinic_id !== clinicId) return false
      return (
        p.name.includes(q) ||
        p.name_kana.toLowerCase().includes(q) ||
        (p.phone ?? '').replace(/-/g, '').includes(q.replace(/-/g, '')) ||
        (p.email ?? '').toLowerCase().includes(q)
      )
    })
  },
  create: (data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const item: Patient = { ...data, id: genId(), created_at: now, updated_at: now }
    _patients = [..._patients, item]
    notify()
    return item
  },
  update: (id: string, data: Partial<Patient>) => {
    _patients = _patients.map((p) =>
      p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p,
    )
    notify()
  },
  delete: (id: string) => {
    _patients = _patients.filter((p) => p.id !== id)
    notify()
  },
}

export function usePatientStore() {
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    const fn = () => forceUpdate((n) => n + 1)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter((l) => l !== fn) }
  }, [])
  return _patients
}
