'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from './supabase'

export interface CurrentUser {
  id: string
  email: string | undefined
  displayName: string
}

function toUser(u: { id: string; email?: string; user_metadata?: Record<string, unknown> }): CurrentUser {
  const name = (u.user_metadata?.name as string) ?? (u.user_metadata?.full_name as string) ?? u.email ?? ''
  return { id: u.id, email: u.email, displayName: name }
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(toUser(session.user))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toUser(session.user) : null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return user
}
