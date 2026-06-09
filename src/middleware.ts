import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Clinic system routes + root — auth handled by admin/layout.tsx and reserve pages themselves
  if (
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/reserve') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login')
  ) {
    return NextResponse.next({ request })
  }

  // Presales AI engine routes (/businesses, /dashboard, /settings) — protect with cookie check
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
