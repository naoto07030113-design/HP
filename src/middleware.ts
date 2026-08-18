import { NextResponse, type NextRequest } from 'next/server'

/**
 * 全リクエストの入口。
 *
 * ここでは重い処理をせず、次の2点だけを担う。
 * 1. リクエストIDの付与 — ブラウザ・API・DB のログを1本の線で追えるようにする
 * 2. セキュリティヘッダの付与 — 医療情報を扱う画面をクリックジャッキング等から守る
 *
 * 認証・認可の強制は API 側（src/server/http/handler.ts）で行う。
 * middleware での認可判定は Next.js の既知の迂回手法があるため、
 * ここを最後の砦にはしない。
 */

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

export function middleware(request: NextRequest) {
  const requestId =
    request.headers.get('x-request-id') ??
    `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`

  // 後段（API ルート）が同じ ID を使えるよう、リクエストヘッダにも載せ直す
  const forwarded = new Headers(request.headers)
  forwarded.set('x-request-id', requestId)

  const response = NextResponse.next({ request: { headers: forwarded } })

  response.headers.set('x-request-id', requestId)
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  return response
}

export const config = {
  // 静的アセットには適用しない
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
