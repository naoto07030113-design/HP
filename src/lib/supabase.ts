import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase クライアント。
 *
 * 以前は環境変数が未設定のとき本番プロジェクトのURLとキーへ暗黙にフォールバックしていた。
 * そのため設定漏れに気づかないまま検証環境が本番DBを向く事故が起こり得たので、
 * 未設定なら明確に失敗させる。
 */

const CLINIC_URL = process.env.NEXT_PUBLIC_CLINIC_SUPABASE_URL
const CLINIC_ANON_KEY = process.env.NEXT_PUBLIC_CLINIC_SUPABASE_ANON_KEY

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `${name} が設定されていません。接続先が定まらないため処理を中止します。` +
        '.env.local（ローカル）または Vercel の環境変数を確認してください。',
    )
  }
  return value
}

let _client: SupabaseClient | null = null

/** ブラウザ用。RLS が効いた状態で動く */
export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      required(CLINIC_URL, 'NEXT_PUBLIC_CLINIC_SUPABASE_URL'),
      required(CLINIC_ANON_KEY, 'NEXT_PUBLIC_CLINIC_SUPABASE_ANON_KEY'),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: 'imc-auth',
        },
      },
    )
  }
  return _client
}

/**
 * サーバー専用。RLS をバイパスするため、必ず API 側で
 * 認証・認可・入力検証を済ませてから使うこと（src/server/http/handler.ts）。
 *
 * 以前はキー未設定時に anon キーへ静かに降格していたが、
 * 「サービスクライアントのつもりで anon 権限で動く」状態は事故のもとなので、
 * 未設定なら失敗させる。
 */
export function createServiceClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('createServiceClient() はサーバー側でのみ使用できます')
  }
  const serviceKey = required(
    process.env.CLINIC_SERVICE_ROLE_KEY,
    'CLINIC_SERVICE_ROLE_KEY',
  )
  return createClient(required(CLINIC_URL, 'NEXT_PUBLIC_CLINIC_SUPABASE_URL'), serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
