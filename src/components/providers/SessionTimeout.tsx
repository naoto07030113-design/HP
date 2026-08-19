'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase'

/**
 * 一定時間なにも操作がなければ自動でログアウトする。
 *
 * 受付や施術室の共有端末は開きっぱなしになりやすく、
 * 離席中に別のスタッフや患者がカルテを見られる状態が残る。
 * 操作が止まってから既定30分でセッションを切る。
 *
 * 期限は環境変数 NEXT_PUBLIC_SESSION_IDLE_MINUTES で変更できる。
 */

const DEFAULT_IDLE_MINUTES = 30
const WARN_BEFORE_MS = 60_000

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'focus'] as const

function idleMs(): number {
  const raw = Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES)
  const minutes = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_IDLE_MINUTES
  return minutes * 60 * 1000
}

export function SessionTimeout() {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const limit = idleMs()

    function clear() {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warnRef.current) clearTimeout(warnRef.current)
    }

    async function signOut() {
      clear()
      try {
        await getSupabaseClient().auth.signOut()
      } catch {
        // 失敗しても画面はログインへ戻す（残しておく方が危険なため）
      }
      router.replace('/admin/login')
      toast.info('操作がないため自動的にログアウトしました')
    }

    function reset() {
      clear()
      if (limit > WARN_BEFORE_MS) {
        warnRef.current = setTimeout(() => {
          toast.warning('まもなく自動ログアウトします。画面を操作すると継続します')
        }, limit - WARN_BEFORE_MS)
      }
      timerRef.current = setTimeout(() => { void signOut() }, limit)
    }

    reset()
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    return () => {
      clear()
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [router])

  return null
}
