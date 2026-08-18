/**
 * 構造化ログ。
 *
 * 障害時に「どのリクエストで何が起きたか」を追えることを最優先にしている。
 * - 1行 = 1 JSON。Vercel のログ検索でそのまま絞り込める
 * - すべてのログに requestId が入り、ブラウザ → API → DB を横串で追跡できる
 * - 出力前に必ず伏字処理を通す（パスワード・トークン・患者氏名などを残さない）
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

function minLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? '').toLowerCase()
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

/** 値ごと落とすキー。トークン類は一部でも残すと危険なので完全に削除する */
const DROP_KEYS = [
  'password', 'passwd', 'secret', 'token', 'access_token', 'refresh_token',
  'apikey', 'api_key', 'authorization', 'cookie', 'service_role_key',
  'anon_key', 'session',
]

/** 個人情報。存在は追えるようにしつつ、中身は残さない */
const MASK_KEYS = [
  'patient_name', 'patientname', 'name', 'name_kana', 'phone', 'patient_phone',
  'email', 'address', 'postal_code', 'birth_date',
  'chief_complaint', 'medical_history', 'current_medications', 'allergies',
  'subjective', 'objective', 'assessment', 'plan', 'memo', 'notes',
]

function maskValue(v: unknown): string {
  if (v === null || v === undefined) return '[empty]'
  const s = String(v)
  if (s.length === 0) return '[empty]'
  return `[redacted:${s.length}]`
}

/** ログに載せる前に機密・個人情報を落とす */
export function redact(input: unknown, depth = 0): unknown {
  if (depth > 6) return '[too-deep]'
  if (input === null || typeof input !== 'object') return input
  if (Array.isArray(input)) {
    if (input.length > 20) {
      return [...input.slice(0, 20).map((v) => redact(v, depth + 1)), `[+${input.length - 20} more]`]
    }
    return input.map((v) => redact(v, depth + 1))
  }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const key = k.toLowerCase()
    if (DROP_KEYS.some((d) => key.includes(d))) continue
    if (MASK_KEYS.includes(key)) { out[k] = maskValue(v); continue }
    out[k] = redact(v, depth + 1)
  }
  return out
}

export type LogContext = {
  requestId?: string
  userId?: string
  role?: string
  clinicId?: string
  route?: string
  method?: string
  durationMs?: number
  status?: number
  errorCode?: string
  [key: string]: unknown
}

function emit(level: LogLevel, message: string, context: LogContext = {}) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel()]) return
  const line = {
    ts: new Date().toISOString(),
    level,
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'local',
    message,
    ...(redact(context) as Record<string, unknown>),
  }
  const serialized = JSON.stringify(line)
  if (level === 'error') console.error(serialized)
  else if (level === 'warn') console.warn(serialized)
  else console.log(serialized)
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),

  /** context を固定した子ロガー。リクエスト単位で使う */
  child(base: LogContext) {
    return {
      debug: (m: string, c?: LogContext) => emit('debug', m, { ...base, ...c }),
      info: (m: string, c?: LogContext) => emit('info', m, { ...base, ...c }),
      warn: (m: string, c?: LogContext) => emit('warn', m, { ...base, ...c }),
      error: (m: string, c?: LogContext) => emit('error', m, { ...base, ...c }),
    }
  },
}

export type RequestLogger = ReturnType<typeof logger.child>
