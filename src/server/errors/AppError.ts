/**
 * アプリケーション全体で使う例外と、外部へ返すエラー形式。
 *
 * 方針:
 * - 利用者に見せる文言(message)と、開発者向けの詳細(detail)を分けて持つ
 * - detail はログにだけ出し、レスポンスには含めない（内部構造を漏らさないため）
 * - すべてのエラーに code を付け、ログとレスポンスの両方で同じ語彙を使う
 */

export const ERROR_CODES = {
  // 認証・認可
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  CLINIC_SCOPE_VIOLATION: 'CLINIC_SCOPE_VIOLATION',
  // 入力
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MALFORMED_JSON: 'MALFORMED_JSON',
  // 業務
  NOT_FOUND: 'NOT_FOUND',
  APPOINTMENT_CONFLICT: 'APPOINTMENT_CONFLICT',
  OUTSIDE_BUSINESS_HOURS: 'OUTSIDE_BUSINESS_HOURS',
  CLINIC_CLOSED: 'CLINIC_CLOSED',
  CANCELLATION_TOO_LATE: 'CANCELLATION_TOO_LATE',
  ALREADY_CANCELLED: 'ALREADY_CANCELLED',
  // 流量・基盤
  RATE_LIMITED: 'RATE_LIMITED',
  DEPENDENCY_UNAVAILABLE: 'DEPENDENCY_UNAVAILABLE',
  INTERNAL: 'INTERNAL',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/** code ごとの HTTP ステータス。ここを唯一の対応表にする */
const STATUS: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  FORBIDDEN: 403,
  CLINIC_SCOPE_VIOLATION: 403,
  VALIDATION_FAILED: 400,
  MALFORMED_JSON: 400,
  NOT_FOUND: 404,
  APPOINTMENT_CONFLICT: 409,
  OUTSIDE_BUSINESS_HOURS: 422,
  CLINIC_CLOSED: 422,
  CANCELLATION_TOO_LATE: 422,
  ALREADY_CANCELLED: 409,
  RATE_LIMITED: 429,
  DEPENDENCY_UNAVAILABLE: 503,
  INTERNAL: 500,
}

/** 利用者にそのまま見せてよい既定の文言 */
const DEFAULT_MESSAGE: Record<ErrorCode, string> = {
  UNAUTHENTICATED: 'ログインが必要です。',
  SESSION_EXPIRED: 'ログインの有効期限が切れました。もう一度ログインしてください。',
  FORBIDDEN: 'この操作を行う権限がありません。',
  CLINIC_SCOPE_VIOLATION: '他院のデータにはアクセスできません。',
  VALIDATION_FAILED: '入力内容に誤りがあります。',
  MALFORMED_JSON: 'リクエストの形式が正しくありません。',
  NOT_FOUND: '対象が見つかりませんでした。',
  APPOINTMENT_CONFLICT: 'この時間帯には既に予約があります。',
  OUTSIDE_BUSINESS_HOURS: '診療時間外の予約はお受けできません。',
  CLINIC_CLOSED: 'その日は休診のため予約をお受けできません。',
  CANCELLATION_TOO_LATE: 'キャンセル可能な期限を過ぎています。お電話でご連絡ください。',
  ALREADY_CANCELLED: 'この予約は既にキャンセルされています。',
  RATE_LIMITED: 'リクエストが集中しています。しばらく時間をおいてからお試しください。',
  DEPENDENCY_UNAVAILABLE: '一時的に処理できませんでした。しばらくしてからお試しください。',
  INTERNAL: '処理中にエラーが発生しました。時間をおいて再度お試しください。',
}

export type FieldError = { field: string; message: string }

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  /** 開発者向け。ログにのみ出力し、レスポンスには含めない */
  readonly detail?: string
  /** 入力エラー時の項目別メッセージ。これはレスポンスに含めてよい */
  readonly fields?: FieldError[]
  /** 想定内の業務エラーか（true ならエラーログではなく警告として扱う） */
  readonly expected: boolean

  constructor(
    code: ErrorCode,
    options: { message?: string; detail?: string; fields?: FieldError[]; cause?: unknown } = {},
  ) {
    super(options.message ?? DEFAULT_MESSAGE[code])
    this.name = 'AppError'
    this.code = code
    this.status = STATUS[code]
    this.detail = options.detail
    this.fields = options.fields
    this.expected = STATUS[code] < 500
    if (options.cause !== undefined) this.cause = options.cause
  }

  static from(err: unknown): AppError {
    if (err instanceof AppError) return err
    return new AppError(ERROR_CODES.INTERNAL, {
      detail: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      cause: err,
    })
  }
}

/** API が返す共通のエラー形式 */
export type ApiErrorBody = {
  success: false
  error: {
    code: ErrorCode
    message: string
    fields?: FieldError[]
    requestId: string
  }
}

export function toErrorBody(err: AppError, requestId: string): ApiErrorBody {
  return {
    success: false,
    error: {
      code: err.code,
      message: err.message,
      ...(err.fields ? { fields: err.fields } : {}),
      requestId,
    },
  }
}
