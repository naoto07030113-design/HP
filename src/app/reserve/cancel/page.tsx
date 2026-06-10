'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Phone, CalendarCheck, X } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { Reservation } from '@/types/clinic'

export default function CancelPage() {
  const [phone, setPhone] = useState('')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch() {
    if (!phone.trim()) return
    setLoading(true)
    setError('')
    setSearched(false)
    try {
      const supabase = getSupabaseClient()
      const { data, error: err } = await supabase
        .from('reservations')
        .select('*')
        .eq('patient_phone', phone.replace(/-/g, '').trim())
        .eq('status', 'confirmed')
        .gte('start_at', new Date().toISOString())
        .order('start_at')
      if (err) throw err
      setReservations(data ?? [])
      setSearched(true)
    } catch {
      setError('検索に失敗しました。しばらくしてから再試行してください。')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!cancelId) return
    setCancelling(true)
    try {
      const supabase = getSupabaseClient()
      const { error: err } = await supabase
        .from('reservations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', cancelId)
      if (err) throw err
      setReservations((prev) => prev.filter((r) => r.id !== cancelId))
      setCancelId(null)
    } catch {
      setError('キャンセルに失敗しました。院に直接ご連絡ください。')
      setCancelId(null)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="bg-green-900 text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/reserve" className="text-green-200 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">予約のキャンセル</h1>
            <p className="text-green-200 text-sm mt-0.5">電話番号で予約を検索できます</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-green-900">
            <Phone className="w-4 h-4" />
            <span>電話番号で予約を検索</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例: 090-1234-5678"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading || !phone.trim()}>
              {loading ? '検索中...' : '検索'}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {searched && (
          <div className="space-y-3">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-xl border border-border shadow-sm p-6 text-center">
                <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-green-300" />
                <p className="text-sm text-muted-foreground">
                  この電話番号でキャンセル可能な予約は見つかりませんでした
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  電話番号を確認するか、院に直接お問い合わせください
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{reservations.length}件の予約が見つかりました</p>
                {reservations.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl border border-border shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-green-900">
                          {format(parseISO(r.start_at), 'M月d日（E） HH:mm', { locale: ja })}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">{r.patient_name}</p>
                      </div>
                      <Button
                        variant="outline" size="sm"
                        className="text-destructive border-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => setCancelId(r.id)}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          ご不明な点は院に直接お電話ください
        </p>
      </div>

      <ConfirmDialog
        open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}
        title="予約をキャンセルしますか？"
        description="キャンセル後は元に戻せません。急ぎの場合は院に直接お電話ください。"
        confirmLabel={cancelling ? 'キャンセル中...' : 'キャンセルする'}
        variant="destructive"
        onConfirm={handleCancel}
      />
    </div>
  )
}
