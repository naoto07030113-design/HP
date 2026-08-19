'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { apiPost, ApiError } from '@/lib/api-client'
import type { MedicalRecord, MedicalRecordFormData } from '@/types/medical-record'

/**
 * カルテ一覧をサーバーから取得する。
 *
 * 以前は全カルテをブラウザに読み込んで絞り込んでいた。
 * 診療録が他院の分まで端末に載ってしまううえ、件数が増えると
 * 取りこぼしが起きるため、検索・絞り込み・ページングをサーバーへ移した。
 */

export type MedicalRecordDto = {
  id: string
  patientId: string
  patientName: string
  reservationId: string | null
  clinicId: string
  staffId: string | null
  visitDate: string
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
  bloodPressureSystolic: number | null
  bloodPressureDiastolic: number | null
  pulse: number | null
  temperature: number | null
  treatmentAreas: string[]
  treatmentMethods: string[]
  treatmentDurationMin: number | null
  treatmentNotes: string | null
  nextVisitPlan: string | null
  memo: string | null
  createdAt: string
  updatedAt: string
}

type Response = {
  records: MedicalRecordDto[]
  page: number
  perPage: number
  total: number
  hasNext: boolean
  stats: { total: number; thisMonth: number; patientCount: number }
}

/** API(camelCase) → 画面で使っている型(snake_case) */
export function toRecord(d: MedicalRecordDto): MedicalRecord {
  return {
    id: d.id,
    patient_id: d.patientId,
    patient_name: d.patientName,
    reservation_id: d.reservationId,
    clinic_id: d.clinicId,
    staff_id: d.staffId,
    visit_date: d.visitDate,
    subjective: d.subjective,
    objective: d.objective,
    assessment: d.assessment,
    plan: d.plan,
    blood_pressure_systolic: d.bloodPressureSystolic,
    blood_pressure_diastolic: d.bloodPressureDiastolic,
    pulse: d.pulse,
    temperature: d.temperature,
    treatment_areas: d.treatmentAreas,
    treatment_methods: d.treatmentMethods,
    treatment_duration_min: d.treatmentDurationMin,
    treatment_notes: d.treatmentNotes,
    next_visit_plan: d.nextVisitPlan,
    memo: d.memo,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  }
}

/** 画面のフォーム型 → API の入力形 */
export function toApiInput(form: MedicalRecordFormData) {
  return {
    patientId: form.patient_id,
    patientName: form.patient_name,
    reservationId: form.reservation_id,
    clinicId: form.clinic_id,
    staffId: form.staff_id,
    visitDate: form.visit_date,
    subjective: form.subjective ?? '',
    objective: form.objective ?? '',
    assessment: form.assessment ?? '',
    plan: form.plan ?? '',
    bloodPressureSystolic: form.blood_pressure_systolic,
    bloodPressureDiastolic: form.blood_pressure_diastolic,
    pulse: form.pulse,
    temperature: form.temperature,
    treatmentAreas: form.treatment_areas ?? [],
    treatmentMethods: form.treatment_methods ?? [],
    treatmentDurationMin: form.treatment_duration_min,
    treatmentNotes: form.treatment_notes ?? '',
    nextVisitPlan: form.next_visit_plan ?? '',
    memo: form.memo ?? '',
  }
}

const PER_PAGE = 50

export type RecordListFilters = {
  search: string
  clinicId: string | null
  staffId: string | null
  from?: string
  to?: string
  /** 患者詳細から、その患者のカルテだけを引くときに使う */
  patientId?: string | null
  perPage?: number
}

export function useMedicalRecordList(filters: RecordListFilters) {
  const [items, setItems] = useState<MedicalRecord[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, patientCount: 0 })
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const { search, clinicId, staffId, from, to, patientId } = filters
  const perPage = filters.perPage ?? PER_PAGE

  useEffect(() => { setPage(1) }, [search, clinicId, staffId, from, to, patientId])

  useEffect(() => {
    const delay = search ? 300 : 0
    const timer = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setError(null)

      apiPost<Response>('/api/v1/medical-records/list', {
        search: search || undefined,
        clinicId: clinicId ?? undefined,
        staffId: staffId ?? undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        patientId: patientId ?? undefined,
        perPage,
      }, { authenticated: true, signal: controller.signal })
        .then((res) => {
          setItems(res.records.map(toRecord))
          setTotal(res.total)
          setHasNext(res.hasNext)
          setStats(res.stats)
        })
        .catch((err) => {
          if (controller.signal.aborted) return
          setItems([])
          setError(err instanceof ApiError ? `${err.message}（${err.supportCode}）` : 'カルテ一覧を取得できませんでした。')
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, delay)

    return () => clearTimeout(timer)
  }, [search, clinicId, staffId, from, to, patientId, page, perPage, reloadToken])

  const reload = useCallback(() => setReloadToken((n) => n + 1), [])

  return { items, stats, total, page, setPage, hasNext, loading, error, reload, perPage }
}
