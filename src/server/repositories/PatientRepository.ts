/**
 * 患者テーブルへのアクセス。
 *
 * ここは service_role で動くため RLS を迂回する。
 * したがって「どの院のデータを見せるか」は必ず引数の clinicScope で絞る。
 * 呼び出し元（Service）が permissions/policy.ts で判定した結果を渡してくる前提。
 *
 * 論理削除に対応済み。deleted_at が入った行は既定で返さない。
 */

import { createServiceClient } from '@/lib/supabase'
import { AppError, ERROR_CODES } from '../errors/AppError'

export type PatientRow = {
  id: string
  clinic_id: string | null
  name: string
  name_kana: string
  gender: 'male' | 'female' | 'other' | 'unknown'
  birth_date: string | null
  phone: string | null
  email: string | null
  postal_code: string | null
  address: string | null
  first_visit_date: string | null
  primary_staff_id: string | null
  insurance_type: 'national' | 'employee' | 'other' | 'none'
  referral_source: string | null
  chief_complaint: string | null
  medical_history: string | null
  current_medications: string | null
  allergies: string | null
  notes: string | null
  is_active: boolean
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

export type PatientListQuery = {
  /** null なら全院（admin のみ）。値があればその院に限定する */
  clinicScope: string | null
  /** 画面から指定された院での追加絞り込み */
  clinicFilter?: string | null
  search?: string
  includeInactive?: boolean
  page: number
  perPage: number
}

/**
 * 一覧と件数で同じ絞り込みを使うためのヘルパー。
 * ここが二重定義になると「件数と中身が食い違う」ため、必ず1箇所にまとめる。
 */
function applyPatientFilters<T extends { eq: Function; is: Function; or: Function }>(
  builder: T,
  query: PatientListQuery,
): T {
  let q = builder.is('deleted_at', null) as T
  if (query.clinicScope) q = q.eq('clinic_id', query.clinicScope) as T
  else if (query.clinicFilter) q = q.eq('clinic_id', query.clinicFilter) as T
  if (!query.includeInactive) q = q.eq('is_active', true) as T
  if (query.search && query.search.length > 0) {
    // % と _ は検索文字として無害化する
    const safe = query.search.replace(/[%_]/g, (c) => `\\${c}`)
    q = q.or(`name.ilike.%${safe}%,name_kana.ilike.%${safe}%,phone.ilike.%${safe}%`) as T
  }
  return q
}

export const patientRepository = {
  async list(query: PatientListQuery): Promise<{ rows: PatientRow[]; total: number }> {
    const from = (query.page - 1) * query.perPage

    // 件数は専用の問い合わせで取る。
    // 一覧の戻り値から件数を推測すると、ページサイズをそのまま総数と誤認する事故が起きる。
    const countQuery = applyPatientFilters(
      db().from('patients').select('id', { count: 'exact', head: true }) as never,
      query,
    ) as unknown as PromiseLike<{ count: number | null; error: { message: string } | null }>

    const rowsQuery = applyPatientFilters(
      db().from('patients').select('*') as never,
      query,
    ) as unknown as { order: Function }

    const [countRes, rowsRes] = await Promise.all([
      countQuery,
      (rowsQuery.order('name_kana') as { range: Function }).range(from, from + query.perPage - 1),
    ])

    wrap(countRes.error, '患者件数の取得')
    wrap((rowsRes as { error: { message: string } | null }).error, '患者一覧の取得')

    return {
      rows: ((rowsRes as { data: PatientRow[] | null }).data ?? []) as PatientRow[],
      total: countRes.count ?? 0,
    }
  },

  /**
   * 画面上部の集計。一覧をページングするため、全件を読まずに数える。
   * 以前は全患者をブラウザに載せて数えていたため、件数が増えると壊れた。
   */
  async stats(scope: { clinicScope: string | null; clinicFilter: string | null }): Promise<{
    total: number; active: number; newThisMonth: number
  }> {
    const clinic = scope.clinicScope ?? scope.clinicFilter
    const monthStart = new Date()
    monthStart.setDate(1)
    const monthFrom = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}-01`

    const base = () => {
      let q = db().from('patients').select('id', { count: 'exact', head: true }).is('deleted_at', null)
      if (clinic) q = q.eq('clinic_id', clinic)
      return q
    }

    const [totalRes, activeRes, newRes] = await Promise.all([
      base(),
      base().eq('is_active', true),
      base().gte('first_visit_date', monthFrom),
    ])
    wrap(totalRes.error, '患者総数の取得')
    wrap(activeRes.error, '有効患者数の取得')
    wrap(newRes.error, '新患数の取得')

    return {
      total: totalRes.count ?? 0,
      active: activeRes.count ?? 0,
      newThisMonth: newRes.count ?? 0,
    }
  },

  async findById(id: string): Promise<PatientRow | null> {
    const { data, error } = await db()
      .from('patients')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle()
    wrap(error, '患者の取得')
    return (data as PatientRow | null) ?? null
  },

  async insert(values: Record<string, unknown>, actorId: string): Promise<PatientRow> {
    const now = new Date().toISOString()
    const { data, error } = await db()
      .from('patients')
      .insert({ ...values, created_by: actorId, updated_by: actorId, created_at: now, updated_at: now })
      .select('*')
      .single()
    wrap(error, '患者の登録')
    return data as PatientRow
  },

  async update(id: string, values: Record<string, unknown>, actorId: string): Promise<PatientRow> {
    const { data, error } = await db()
      .from('patients')
      .update({ ...values, updated_by: actorId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    wrap(error, '患者の更新')
    return data as PatientRow
  },

  /**
   * 論理削除。物理削除はしない。
   * 以前は物理削除で、しかもカルテが ON DELETE CASCADE で道連れになっていた。
   */
  async softDelete(id: string, actorId: string): Promise<void> {
    const { error } = await db()
      .from('patients')
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorId, is_active: false })
      .eq('id', id)
    wrap(error, '患者の削除')
  },
}
