import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const FALLBACK_URL = 'https://unbfufnqajavptbsrsfc.supabase.co'
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYmZ1Zm5xYWphdnB0YnNyc2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzQ4NDYsImV4cCI6MjA5NjMxMDg0Nn0.wGKf5-81xc6pqB38UKt4vXl4DntwZ4pajkF8f_XwAp8'
const FALLBACK_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYmZ1Zm5xYWphdnB0YnNyc2ZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDczNDg0NiwiZXhwIjoyMDk2MzEwODQ2fQ.QqH4wnNyNVKasUFaLz4Ymobx-V2oxBwe1ISxjiWUeVU'

// Validate the URL — if the env var is missing, empty, or lacks https://, use the fallback
function resolveSupabaseUrl(env: string | undefined): string {
  if (!env) return FALLBACK_URL
  try {
    const u = new URL(env)
    if (u.protocol === 'https:' || u.protocol === 'http:') return env
  } catch {}
  return FALLBACK_URL
}

const SUPABASE_URL = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY

export { SUPABASE_URL, SUPABASE_ANON_KEY }

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return _client
}

export const supabase = {
  get auth() { return getSupabaseClient().auth },
  get from() { return getSupabaseClient().from.bind(getSupabaseClient()) },
  get storage() { return getSupabaseClient().storage },
  get functions() { return getSupabaseClient().functions },
  get channel() { return getSupabaseClient().channel.bind(getSupabaseClient()) },
  get removeChannel() { return getSupabaseClient().removeChannel.bind(getSupabaseClient()) },
}

export function createServiceClient(): SupabaseClient {
  const url = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_KEY
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
