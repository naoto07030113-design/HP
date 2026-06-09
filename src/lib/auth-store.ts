'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabase'

export type UserRole = 'admin' | 'staff' | 'receptionist'

export interface CurrentUser {
  id: string
  email: string | undefined
  role: UserRole
  displayName: string
}

function roleFromUser(user: User): UserRole {
  const meta = user.user_metadata ?? {}
  const appMeta = user.app_metadata ?? {}
  const raw = meta.role ?? appMeta.role
  if (raw === 'staff') return 'staff'
  if (raw === 'receptionist') return 'receptionist'
  return 'admin'
}

function nameFromUser(user: User): string {
  return user.user_metadata?.name ?? user.user_metadata?.full_name ?? user.email ?? ''
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: roleFromUser(session.user),
          displayName: nameFromUser(session.user),
        })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: roleFromUser(session.user),
          displayName: nameFromUser(session.user),
        })
      } else {
        setUser(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return user
}

// Permission checks per role
export const PERMISSIONS = {
  // These pages/actions are restricted by role
  canAccessSettings:       (r: UserRole) => r === 'admin',
  canAccessAnalytics:      (r: UserRole) => r === 'admin' || r === 'staff',
  canAccessCommunications: (r: UserRole) => r === 'admin' || r === 'staff',
  canAccessExports:        (r: UserRole) => r === 'admin',
  canManageClinics:        (r: UserRole) => r === 'admin',
  canManageStaff:          (r: UserRole) => r === 'admin',
  canManageMenus:          (r: UserRole) => r === 'admin',
  canManageShifts:         (r: UserRole) => r === 'admin' || r === 'staff',
  canManageAnnouncements:  (r: UserRole) => r === 'admin',
  canDeleteRecords:        (r: UserRole) => r === 'admin',
  canViewAccounting:       (r: UserRole) => r === 'admin' || r === 'staff',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理者',
  staff: 'スタッフ',
  receptionist: '受付',
}
