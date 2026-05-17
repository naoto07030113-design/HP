import { useMemo } from 'react'
import { ReservationBoard } from '@/components/ReservationBoard'
import { useCalendarStore } from '@/store/useCalendarStore'
import type { Reservation, Staff } from '@/types'

const staffs: Staff[] = [
  { id: 's1', name: '田中先生' },
  { id: 's2', name: '佐藤先生' },
  { id: 's3', name: '鈴木先生' },
]

const demoReservations: Reservation[] = [
  { id: 'r1', patientName: '山田 花子', menuName: '美容鍼 75分', staffId: 's1', startAt: '2026-05-16T09:30:00+09:00', endAt: '2026-05-16T10:45:00+09:00', status: 'booked', rank: 'Gold' },
  { id: 'r2', patientName: '高橋 一郎', menuName: '整体 45分', staffId: 's2', startAt: '2026-05-16T10:00:00+09:00', endAt: '2026-05-16T10:45:00+09:00', status: 'visited', rank: 'Silver' },
  { id: 'r3', patientName: '休憩', menuName: 'ブロック時間', staffId: 's3', startAt: '2026-05-16T12:00:00+09:00', endAt: '2026-05-16T13:30:00+09:00', status: 'block', rank: 'Bronze' }
]

export default function AdminDashboard() {
  const { view, setView } = useCalendarStore()
  const kpis = useMemo(() => [
    ['来院数', '142'], ['新患数', '26'], ['リピート率', '78%'], ['売上', '¥1,982,000']
  ], [])

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      <header className="rounded-3xl bg-gradient-to-r from-forest to-moss p-6 text-white">
        <h1 className="text-2xl font-bold">予約管理CRM</h1>
        <div className="mt-3 flex gap-2">
          {(['day','week','month','list'] as const).map(v => <button key={v} onClick={() => setView(v)} className={`rounded-full px-4 py-1 text-sm ${view===v?'bg-white text-forest':'bg-white/20'}`}>{v}</button>)}
        </div>
      </header>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(([k,v]) => <article key={k} className="rounded-2xl border bg-white p-4"><p className="text-xs text-slate-500">{k}</p><p className="text-xl font-semibold text-forest">{v}</p></article>)}
      </section>
      <ReservationBoard staffs={staffs} reservations={demoReservations} onDragEnd={() => {}} />
    </main>
  )
}
