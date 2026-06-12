'use client'

import { useState, useCallback } from 'react'
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, addMonths, subMonths, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react'
import { DayCalendar } from '@/features/reservations/components/calendar/DayCalendar'
import { WeekCalendar } from '@/features/reservations/components/calendar/WeekCalendar'
import { MonthCalendar } from '@/features/reservations/components/calendar/MonthCalendar'
import { ReservationForm } from '@/features/reservations/components/ReservationForm'
import { useClinicStore } from '@/lib/clinic-store'
import { reservationsStore, clinicsStore } from '@/lib/clinic-store'
import type { Reservation } from '@/types/clinic'
import { StatusBadge } from '@/components/common/StatusBadge'
import { RESERVATION_STATUS_LABELS } from '@/types/clinic'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select as Select2, SelectContent as SC2, SelectItem as SI2, SelectTrigger as ST2, SelectValue as SV2 } from '@/components/ui/select'

type View = 'day' | 'week' | 'month'

export default function CalendarPage() {
  const store = useClinicStore()
  const [view, setView] = useState<View>('day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedClinicId, setSelectedClinicId] = useState(store.clinics[0]?.id ?? '')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Reservation | null>(null)
  const [defaultDate, setDefaultDate] = useState<string>()
  const [defaultTime, setDefaultTime] = useState<string>()
  const [defaultStaffId, setDefaultStaffId] = useState<string>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRes, setDetailRes] = useState<Reservation | null>(null)

  const clinic = store.clinics.find((c) => c.id === selectedClinicId)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })

  function goBack() {
    if (view === 'day') setCurrentDate((d) => subDays(d, 1))
    else if (view === 'week') setCurrentDate((d) => subWeeks(d, 1))
    else setCurrentDate((d) => subMonths(d, 1))
  }
  function goForward() {
    if (view === 'day') setCurrentDate((d) => addDays(d, 1))
    else if (view === 'week') setCurrentDate((d) => addWeeks(d, 1))
    else setCurrentDate((d) => addMonths(d, 1))
  }
  function goToday() { setCurrentDate(new Date()) }

  function openAddForm(staffId?: string, time?: string, date?: string) {
    setEditTarget(null)
    setDefaultDate(date ?? format(currentDate, 'yyyy-MM-dd'))
    setDefaultTime(time)
    setDefaultStaffId(staffId)
    setFormOpen(true)
  }

  function openEditForm(r: Reservation) {
    setDetailRes(r)
    setDetailOpen(true)
  }

  function handleMoveReservation(id: string, staffId: string, start: string, end: string) {
    reservationsStore.update(id, { staff_id: staffId, start_at: start, end_at: end }).catch(() => {})
  }

  function handleFormSubmit(data: Parameters<typeof reservationsStore.create>[0]) {
    if (editTarget) {
      reservationsStore.update(editTarget.id, data).catch(() => {})
    } else {
      reservationsStore.create(data).catch(() => {})
    }
  }

  function handleStatusChange(id: string, status: Reservation['status']) {
    reservationsStore.update(id, { status }).catch(() => {})
    setDetailOpen(false)
  }

  function handleDelete(id: string) {
    reservationsStore.delete(id).catch(() => {})
    setDetailOpen(false)
  }

  const activeClinics = store.clinics.filter((c) => c.is_active)

  const dateLabel = view === 'day'
    ? format(currentDate, 'yyyy年M月d日（E）', { locale: ja })
    : view === 'week'
      ? `${format(weekStart, 'yyyy年M月d日', { locale: ja })} 〜 ${format(addDays(weekStart, 6), 'M月d日', { locale: ja })}`
      : format(currentDate, 'yyyy年M月', { locale: ja })

  return (
    <div className="flex flex-col h-full">
      {/* ツールバー */}
      <div className="bg-white border-b border-green-100 px-4 py-3 flex flex-wrap items-center gap-3 flex-shrink-0">
        {/* 院選択 */}
        <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="院を選択" />
          </SelectTrigger>
          <SelectContent>
            {activeClinics.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ナビ */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={goToday}>
            今日
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={goForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 日付ラベル */}
        <span className="text-sm font-semibold text-green-900 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {dateLabel}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* 表示切替 */}
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList className="h-8">
              <TabsTrigger value="month" className="text-xs px-3 h-7">月別</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-3 h-7">週別</TabsTrigger>
              <TabsTrigger value="day" className="text-xs px-3 h-7">日別</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" className="h-8 gap-1.5" onClick={() => openAddForm()}>
            <Plus className="w-3.5 h-3.5" />
            予約追加
          </Button>
        </div>
      </div>

      {/* カレンダー本体 */}
      <div className="flex-1 overflow-hidden bg-white">
        {view === 'month' && (
          <MonthCalendar
            month={currentDate}
            clinicId={selectedClinicId}
            reservations={store.reservations}
            onDateClick={(date) => { setCurrentDate(new Date(date + 'T00:00:00')); setView('day') }}
            onPrevMonth={goBack}
            onNextMonth={goForward}
            onToday={goToday}
          />
        )}
        {clinic && view === 'day' && (
          <DayCalendar
            date={format(currentDate, 'yyyy-MM-dd')}
            clinic={clinic}
            staff={store.staff}
            reservations={store.reservations}
            menus={store.menus}
            onReservationClick={openEditForm}
            onSlotClick={(staffId, time) => openAddForm(staffId, time)}
            onReservationMove={handleMoveReservation}
            onAddClick={() => openAddForm()}
          />
        )}
        {clinic && view === 'week' && (
          <WeekCalendar
            weekStart={weekStart}
            clinic={clinic}
            staff={store.staff}
            reservations={store.reservations}
            menus={store.menus}
            onDateClick={(date) => { setCurrentDate(new Date(date)); setView('day') }}
            onReservationClick={openEditForm}
          />
        )}
      </div>

      {/* 予約フォーム */}
      <ReservationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editTarget}
        clinics={store.clinics}
        staff={store.staff}
        menus={store.menus}
        defaultDate={defaultDate}
        defaultStartTime={defaultTime}
        defaultStaffId={defaultStaffId}
        defaultClinicId={selectedClinicId}
        onSubmit={handleFormSubmit}
      />

      {/* 予約詳細モーダル */}
      {detailRes && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>予約詳細</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-900 text-base">{detailRes.patient_name}</span>
                <StatusBadge status={detailRes.status} />
              </div>
              {detailRes.patient_phone && (
                <div className="text-muted-foreground">{detailRes.patient_phone}</div>
              )}
              <div className="bg-green-50 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">日時</span>
                  <span className="font-medium">
                    {format(parseISO(detailRes.start_at), 'M月d日 HH:mm')} - {format(parseISO(detailRes.end_at), 'HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">担当</span>
                  <span>{store.staff.find((s) => s.id === detailRes.staff_id)?.name ?? '未指定'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">メニュー</span>
                  <span>{store.menus.find((m) => m.id === detailRes.menu_id)?.name ?? '未指定'}</span>
                </div>
              </div>
              {detailRes.memo && (
                <div className="text-muted-foreground bg-amber-50 rounded-lg p-3">{detailRes.memo}</div>
              )}
              {/* ステータス変更 */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">ステータス変更</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(RESERVATION_STATUS_LABELS) as [Reservation['status'], string][]).map(([k, v]) => (
                    <Button
                      key={k} size="sm" variant={detailRes.status === k ? 'default' : 'outline'}
                      className="h-7 text-xs"
                      onClick={() => handleStatusChange(detailRes.id, k)}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleDelete(detailRes.id)}
              >
                削除
              </Button>
              <Button size="sm" onClick={() => { setDetailOpen(false); setEditTarget(detailRes); setFormOpen(true) }}>
                編集
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
