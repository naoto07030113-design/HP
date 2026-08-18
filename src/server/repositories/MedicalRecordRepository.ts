/**
 * カルテテーブルへのアクセス。
 *
 * service_role で動くため RLS を迂回する。誰に見せるかの判断は
 * 呼び出し元（Service / permissions）で済ませてから来る前提。
 *
 * 更新・削除の前には必ず改訂履歴を積む。診療録は上書きで前の内容が
 * 消えてはならないため、その責務をこの層に閉じ込めている。
 */

import { createServiceClient } from '@/lib/supabase'
import { AppError, ERROR_CODES } from '../errors/AppError'

export type MedicalRecordRow = {
  id: string
  patient_id: string
  patient_name: string
  reservation_id: string | null
  clinic_id: string
  staff_id: string | null
  visit_date: string
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  pulse: number | null
  temperature: number | null
  treatment_areas: string[]
  treatment_methods: string[]
  treatment_duration_min: number | null
  treatment_notes: string | null
  next_visit_plan: string | null
  memo: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
  deleted_at?: string | null
  deleted_by?: string | null
}

function db() {
  return createServiceClient()
}

function wrap(error: { message: string; code?: string } | null, what: string): void {
  if (!error) return
  throw new AppError(ERROR_CODES.DEPENDENCY_UNAVAILABLE, {
    detail: `${what} に失敗: ${error.message}${error.code ? ` (code=${error.code})` : ''}`,
  })
}

export type MedicalRecordListQuery = {
  /** null なら全院（admin のみ）。値があればその院に限定する */
  clinicScope: string | null
  clinicFilter?: string | null
  patientId?: string | null
  staffId?: string | null
  search?: string
  from?: string
  to?: string
  page: number
  perPage: number
}

/** 一覧と件数で同じ絞り込みを使う。ここが二重定義になると件数と中身が食い違う */
function applyFilters<T extends { eq: Function; is: Function; gte: Function; lte: Function; ilike: Function }>(
  builder: T,
  q: MedicalRecordListQuery,
): T {
  let b = builder.is('deleted_at', null) as T
  if (q.clinicScope) b = b.eq('clinic_id', q.clinicScope) as T
  else if (q.clinicFilter) b = b.eq('clinic_id', q.clinicFilter) as T
  if (q.patientId) b = b.eq('patient_id', q.patientId) as T
  if (q.staffId) b = b.eq('staff_id', q.staffId) as T
  if (q.from) b = b.gte('visit_date', q.from) as T
  if (q.to) b = b.lte('visit_date', q.to) as T
  if (q.search) {
    const safe = q.search.replace(/[%_]/g, (c) => `\\${c}`)
    b = b.ilike('patient_name', `%${safe}%`) as T
  }
  return b
}

export const medicalRecordRepository = {
  async list(query: MedicalRecordListQuery): Promise<{ rows: MedicalRecordRow[]; total: number }> {
    const from = (query.page - 1) * query.perPage

    const countQuery = applyFilters(
      db().from('medical_records').select('id', { count: 'exact', head: true }) as never,
      query,
    ) as unknown as PromiseLike<{ count: number | null; error: { message: string } | null }>

    const rowsQuery = applyFilters(
      db().from('medical_records').select('*') as never,
      query,
    ) as unknown as { order: Function }

    const [countRes, rowsRes] = await Promise.all([
      countQuery,
      (rowsQuery.order('visit_date', { ascending: false }) as { range: Function })
        .range(from, from + query.perPage - 1),
    ])

    wrap(countRes.error, 'カルテ件数の取得')
    wrap((rowsRes as { error: { message: string } | null }).error, 'カルテ一覧の取得')

    return {
      rows: ((rowsRes as { data: MedicalRecordRow[] | null }).data ?? []) as MedicalRecordRow[],
      total: countRes.count ?? 0,
    }
  },

  /** 画面上部の集計。一覧をページングするため、全件を読まずに数える */
  async stats(scope: { clinicScope: string | null; clinicFilter: string | null }): Promise<{
    total: number; thisMonth: number; patientCount: number
  }> {
    const clinic = scope.clinicScope ?? scope.clinicFilter
    const now = new Date()
    const monthFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    const base = () => {
      let q = db().from('medical_records').select('id', { count: 'exact', head: true }).is('deleted_at', null)
      if (clinic) q = q.eq('clinic_id', clinic)
      return q
    }

    // 患者の実数はカルテの patient_id の種類数。件数APIでは出せないため
    // patient_id だけを引いて数える（本文は取得しない）
    let patientQuery = db().from('medical_records').select('patient_id').is('deleted_at', null)
    if (clinic) patientQuery = patientQuery.eq('clinic_id', clinic)

    const [totalRes, monthRes, patientRes] = await Promise.all([
      base(),
      base().gte('visit_date', monthFrom),
      patientQuery,
    ])
    wrap(totalRes.error, 'カルテ総数の取得')
    wrap(monthRes.error, '今月のカルテ数の取得')
    wrap(patientRes.error, 'カルテ患者数の取得')

    const ids = new Set(((patientRes.data ?? []) as Array<{ patient_id: string }>).map((r) => r.patient_id))
    return {
      total: totalRes.count ?? 0,
      thisMonth: monthRes.count ?? 0,
      patientCount: ids.size,
    }
  },

  async findById(id: string): Promise<MedicalRecordRow | null> {
    const { data, error } = await db()
      .from('medical_records').select('*').eq('id', id).is('deleted_at', null).maybeSingle()
    wrap(error, 'カルテの取得')
    return (data as MedicalRecordRow | null) ?? null
  },

  async insert(values: Record<string, unknown>, actorId: string): Promise<MedicalRecordRow> {
    const now = new Date().toISOString()
    const { data, error } = await db()
      .from('medical_records')
      .insert({ ...values, created_by: actorId, updated_by: actorId, created_at: now, updated_at: now })
      .select('*')
      .single()
    wrap(error, 'カルテの作成')
    return data as MedicalRecordRow
  },

  async update(id: string, values: Record<string, unknown>, actorId: string): Promise<MedicalRecordRow> {
    const { data, error } = await db()
      .from('medical_records')
      .update({ ...values, updated_by: actorId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    wrap(error, 'カルテの更新')
    return data as MedicalRecordRow
  },

  async softDelete(id: string, actorId: string): Promise<void> {
    const { error } = await db()
      .from('medical_records')
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorId })
      .eq('id', id)
    wrap(error, 'カルテの削除')
  },

  /**
   * 変更前の内容を履歴として積む。
   * 履歴テーブルが未作成の環境でも診療業務を止めないよう、
   * 失敗しても例外にはせず false を返す（呼び出し元がエラーログに残す）。
   */
  async appendRevision(args: {
    record: MedicalRecordRow
    changedBy: string
    changedByRole: string
    requestId: string
    changeType: 'update' | 'delete'
  }): Promise<boolean> {
    const { record, changedBy, changedByRole, requestId, changeType } = args
    try {
      const supabase = db()
      const { count } = await supabase
        .from('medical_record_revisions')
        .select('id', { count: 'exact', head: true })
        .eq('record_id', record.id)

      const { error } = await supabase.from('medical_record_revisions').insert({
        record_id: record.id,
        revision_no: (count ?? 0) + 1,
        changed_by: changedBy,
        changed_by_role: changedByRole,
        request_id: requestId,
        change_type: changeType,
        snapshot: record,
      })
      if (error) throw error
      return true
    } catch {
      return false
    }
  },

  async listRevisions(recordId: string): Promise<Array<{
    revisionNo: number; changedAt: string; changedBy: string | null
    changedByRole: string | null; changeType: string; snapshot: MedicalRecordRow
  }>> {
    const { data, error } = await db()
      .from('medical_record_revisions')
      .select('revision_no,changed_at,changed_by,changed_by_role,change_type,snapshot')
      .eq('record_id', recordId)
      .order('revision_no', { ascending: false })
      .limit(100)
    wrap(error, 'カルテ改訂履歴の取得')
    return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      revisionNo: r.revision_no as number,
      changedAt: r.changed_at as string,
      changedBy: (r.changed_by as string | null) ?? null,
      changedByRole: (r.changed_by_role as string | null) ?? null,
      changeType: r.change_type as string,
      snapshot: r.snapshot as MedicalRecordRow,
    }))
  },
}
