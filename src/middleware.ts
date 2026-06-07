import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api')

  if (isAuthRoute || isApiRoute) {
    return NextResponse.next({ request })
  }

  // sb- で始まるCookieがあればセッションあり（ログイン済み）とみなす
  const hasSessionCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.value.length > 10
  )

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
