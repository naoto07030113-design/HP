import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Presales AI system — uses NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (existing keys)
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://unbfufnqajavptbsrsfc.supabase.co'
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYmZ1Zm5xYWphdnB0YnNyc2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzQ4NDYsImV4cCI6MjA5NjMxMDg0Nn0.wGKf5-81xc6pqB38UKt4vXl4DntwZ4pajkF8f_XwAp8'

// Clinic system — uses NEXT_PUBLIC_CLINIC_SUPABASE_URL / NEXT_PUBLIC_CLINIC_SUPABASE_ANON_KEY (add these 2 in Vercel)
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

export function createServiceClient(): SupabaseClient {
  const serviceKey = process.env.CLINIC_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
