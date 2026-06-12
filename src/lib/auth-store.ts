'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabase'

export type UserRole = 'admin' | 'staff' | 'receptionist'

export interface CurrentUser {
  id: string
  email: string | undefined
  role: UserRole
  clinic_id?: string  // set for clinic-specific staff; absent for admin
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

function clinicIdFromUser(user: User): string | undefined {
  return user.user_metadata?.clinic_id ?? user.app_metadata?.clinic_id ?? undefined
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
          clinic_id: clinicIdFromUser(session.user),
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
          clinic_id: clinicIdFromUser(session.user),
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
  canAccessSettings:       (r: UserRole) => r === 'admin',
  canAccessAnalytics:      (r: UserRole) => r === 'admin' || r === 'staff',
  canAccessCommunications: (r: UserRole) => r === 'admin' || r === 'staff',
  canAccessExports:        (r: UserRole) => r === 'admin',
  canAccessDashboard:      (r: UserRole) => r === 'admin' || r === 'staff',
  canAccessReports:        (r: UserRole) => r === 'admin',
  canManageClinics:        (r: UserRole) => r === 'admin',
  canManageStaff:          (r: UserRole) => r === 'admin',
  canManageMenus:          (r: UserRole) => r === 'admin',
  canManageShifts:         (r: UserRole) => r === 'admin' || r === 'staff',
  canManageAnnouncements:  (r: UserRole) => r === 'admin',
  canDeleteRecords:        (r: UserRole) => r === 'admin',
  canViewAccounting:       (r: UserRole) => r === 'admin' || r === 'staff',
  canManageMerchandise:    (r: UserRole) => r === 'admin' || r === 'staff',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理者',
  staff: 'スタッフ',
  receptionist: '受付',
}

/**
 * Returns the clinic_id restriction for the current user.
 * Admin users return null (no restriction, can see all clinics).
 * Clinic-specific staff return their clinic_id.
 */
export function useClinicFilter(): string | null {
  const user = useCurrentUser()
  if (!user || user.role === 'admin') return null
  return user.clinic_id ?? null
}
