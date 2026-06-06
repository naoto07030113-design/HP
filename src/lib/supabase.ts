import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Client-side singleton (lazy init)
let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }
    _client = createClient(url, key)
  }
  return _client
}

// Named export for client components (lazy)
export const supabase = {
  get auth() { return getSupabaseClient().auth },
  get from() { return getSupabaseClient().from.bind(getSupabaseClient()) },
  get storage() { return getSupabaseClient().storage },
  get functions() { return getSupabaseClient().functions },
  get channel() { return getSupabaseClient().channel.bind(getSupabaseClient()) },
  get removeChannel() { return getSupabaseClient().removeChannel.bind(getSupabaseClient()) },
}

export function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role environment variables')
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
