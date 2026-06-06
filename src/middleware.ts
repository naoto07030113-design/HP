import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api')

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://unbfufnqajavptbsrsfc.supabase.co'
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYmZ1Zm5xYWphdnB0YnNyc2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzQ4NDYsImV4cCI6MjA5NjMxMDg0Nn0.wGKf5-81xc6pqB38UKt4vXl4DntwZ4pajkF8f_XwAp8'

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof supabaseResponse.cookies.set>[2]
            )
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    if (!user && !isAuthRoute && !isApiRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user && pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch {
    // 認証チェックに失敗した場合、ログインページへ（ループしないようにauth routeはスキップ）
    if (!isAuthRoute && !isApiRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
