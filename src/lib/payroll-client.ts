import { getSupabaseClient } from './supabase'

// 給与労務APIへのfetchラッパー。ログインセッションのaccess_tokenをAuthorizationヘッダに付与し、
// サーバー側 (payroll-auth.ts) でロール判定・院長のクリニック絞り込みができるようにする。
export async function payrollFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await getSupabaseClient().auth.getSession()

  const headers = new Headers(init.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  return fetch(input, { ...init, headers })
}
