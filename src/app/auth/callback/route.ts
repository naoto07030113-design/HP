import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://unbfufnqajavptbsrsfc.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuYmZ1Zm5xYWphdnB0YnNyc2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzQ4NDYsImV4cCI6MjA5NjMxMDg0Nn0.wGKf5-81xc6pqB38UKt4vXl4DntwZ4pajkF8f_XwAp8'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const response = NextResponse.redirect(`${origin}/dashboard`)

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          })
        },
      },
    })

    await supabase.auth.exchangeCodeForSession(code)
    return response
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
