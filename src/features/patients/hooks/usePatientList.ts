'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiPost, ApiError } from '@/lib/api-client'
import type { Patient, PatientFormData } from '@/types/patient'

/**
 * 患者一覧をサーバーから取得する。
 *
 * 以前は全患者をブラウザに読み込んで絞り込んでいた。
 * 件数が増えると取りこぼしが起き（Supabase の既定上限）、
 * 他院の患者まで端末に載っていたため、検索・絞り込み・集計をサーバーへ移した。
 */

export type PatientListItem = {
  id: string
  clinicId: string | null
  name: string
  nameKana: string
  gender: 'male' | 'female' | 'other' | 'unknown'
  birthDate: string | null
  phone: string | null
  email: string | null
  postalCode: string | null
  address: string | null
  firstVisitDate: string | null
  primaryStaffId: string | null
  insuranceType: 'national' | 'employee' | 'other' | 'none'
  referralSource: string | null
  chiefComplaint: string | null
  medicalHistory: string | null
  currentMedications: string | null
  allergies: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type Response = {
  patients: PatientListItem[]
  page: number
  perPage: number
  total: number
  hasNext: boolean
  stats: { total: number; active: number; newThisMonth: number }
}

const PER_PAGE = 50

/** API(camelCase) → 画面で使っている型(snake_case) */
function toPatient(d: PatientListItem): Patient {
  return {
    id: d.id,
    clinic_id: d.clinicId ?? '',
    name: d.name,
    name_kana: d.nameKana,
    gender: d.gender,
    birth_date: d.birthDate,
    phone: d.phone,
    email: d.email,
    postal_code: d.postalCode,
    address: d.address,
    first_visit_date: d.firstVisitDate,
    primary_staff_id: d.primaryStaffId,
    insurance_type: d.insuranceType,
    referral_source: d.referralSource,
    chief_complaint: d.chiefComplaint,
    medical_history: d.medicalHistory,
    current_medications: d.currentMedications,
    allergies: d.allergies,
    notes: d.notes,
    is_active: d.isActive,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  }
}

/** 画面のフォーム型 → API の入力形 */
export function toApiInput(form: PatientFormData) {
  return {
    clinicId: form.clinic_id,
    name: form.name,
    nameKana: form.name_kana ?? '',
    gender: form.gender,
    birthDate: form.birth_date ?? '',
    phone: form.phone ?? '',
    email: form.email ?? '',
    postalCode: form.postal_code ?? '',
    address: form.address ?? '',
    firstVisitDate: form.first_visit_date ?? '',
    primaryStaffId: form.primary_staff_id,
    insuranceType: form.insurance_type,
    referralSource: form.referral_source ?? '',
    chiefComplaint: form.chief_complaint ?? '',
    medicalHistory: form.medical_history ?? '',
    currentMedications: form.current_medications ?? '',
    allergies: form.allergies ?? '',
    notes: form.notes ?? '',
    isActive: form.is_active,
  }
}

export function usePatientList(options: { search: string; clinicId: string | null }) {
  const [items, setItems] = useState<Patient[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, newThisMonth: 0 })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const { search, clinicId } = options
  const abortRef = useRef<AbortController | null>(null)

  // 検索条件が変わったら1ページ目へ戻す
  useEffect(() => { setPage(1) }, [search, clinicId])

  useEffect(() => {
    // 入力のたびに投げず、少し待ってからまとめて問い合わせる
    const delay = search ? 300 : 0
    const timer = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setError(null)

      apiPost<Response>('/api/v1/patients/list', {
        search: search || undefined,
        clinicId: clinicId ?? undefined,
        page,
        perPage: PER_PAGE,
      }, { authenticated: true, signal: controller.signal })
        .then((res) => {
          setItems(res.patients.map(toPatient))
          setTotal(res.total)
          setHasNext(res.hasNext)
          setStats(res.stats)
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          setItems([])
          setError(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : '患者一覧を取得できませんでした。')
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, delay)

    return () => clearTimeout(timer)
  }, [search, clinicId, page, reloadToken])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  return { items, stats, total, page, setPage, hasNext, loading, error, reload, perPage: PER_PAGE }
}
