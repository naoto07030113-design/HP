import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// クリニック統合業務システム用 Supabase プロジェクト
// Vercel には NEXT_PUBLIC_CLINIC_SUPABASE_URL / NEXT_PUBLIC_CLINIC_SUPABASE_ANON_KEY を設定
const CLINIC_URL = process.env.NEXT_PUBLIC_CLINIC_SUPABASE_URL || 'https://fupfwpyvejzwrubomhov.supabase.co'
const CLINIC_ANON_KEY = process.env.NEXT_PUBLIC_CLINIC_SUPABASE_ANON_KEY || 'sb_publishable_jIbUWn3vDXHZtGF_DJ8a1A_kpMt-NcE'

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(CLINIC_URL, CLINIC_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'imc-auth',
      },
    })
  }
  return _client
}

// サーバーサイド用クライアント。CLINIC_SERVICE_ROLE_KEY があれば RLS をバイパス、
// 無ければ anon キーで動作（anon の INSERT ポリシーに依存）。
export function createServiceClient(): SupabaseClient {
  const serviceKey = process.env.CLINIC_SERVICE_ROLE_KEY ?? CLINIC_ANON_KEY
  return createClient(CLINIC_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
