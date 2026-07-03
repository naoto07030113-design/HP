'use client'

import Link from 'next/link'
import { MapPin, Phone, ChevronRight, ShoppingBag, CalendarX2 } from 'lucide-react'
import { useClinicStore } from '@/lib/clinic-store'
import { useAnnouncementsStore, announcementsStore } from '@/lib/announcement-store'
import { useMerchandiseStore } from '@/lib/merchandise-store'
import { AnnouncementBanners } from '@/components/common/AnnouncementBanner'

export default function ReservePage() {
  const store = useClinicStore()
  useAnnouncementsStore()
  const merchandise = useMerchandiseStore()
  const activeClinics = store.clinics.filter((c) => c.is_active)
  const companyAnnouncements = announcementsStore.getActive('company')

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--surface))] to-white">
      {/* ヘッダー */}
      <header className="relative bg-gradient-to-br from-green-950 via-green-900 to-[#16382a] text-white px-4 pt-8 pb-9 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(500px circle at 90% 0%, rgba(207,166,79,0.1), transparent 55%)',
          }}
        />
        <div className="relative max-w-lg mx-auto">
          <p className="text-[10px] text-gold-300/80 tracking-[0.3em] mb-2">ITO MEDICAL CARE</p>
          <h1 className="text-2xl font-bold tracking-tight">オンライン予約</h1>
          <p className="text-green-200/80 text-sm mt-1.5">24時間いつでもご予約いただけます</p>
        </div>
        {/* ゴールドの罫線 */}
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-7 space-y-6 animate-fade-up">
        {/* 全社お知らせ */}
        {companyAnnouncements.length > 0 && (
          <AnnouncementBanners announcements={companyAnnouncements} />
        )}

        <div>
          <h2 className="text-lg font-bold text-green-950 mb-1">院を選んでください</h2>
          <p className="text-xs text-muted-foreground mb-4">ご希望の院を選択すると予約画面に進みます</p>
          <div className="space-y-3">
            {activeClinics.map((clinic) => {
              const clinicAnnouncements = announcementsStore.getActive('clinic', clinic.id)
                .filter((a) => a.scope === 'clinic')
              const hasMerchandise = merchandise.merchandise.some(
                (m) => m.clinic_id === clinic.id && m.is_active,
              )
              return (
                <div
                  key={clinic.id}
                  className="bg-white rounded-2xl border border-green-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-300 overflow-hidden"
                >
                  <Link
                    href={`/reserve/${clinic.id}`}
                    className="group block p-5 active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-700 to-green-900 ring-1 ring-gold-400/30 shadow-sm flex items-center justify-center flex-shrink-0">
                          <span className="text-gold-200 font-bold text-xs tracking-widest">IMC</span>
                        </div>
                        <div>
                          <p className="font-bold text-green-950 text-[15px]">{clinic.name}</p>
                          <p className="text-xs text-green-600 mt-0.5 tracking-wide">
                            診療時間 {clinic.open_time} - {clinic.close_time}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-50 group-hover:bg-green-700 flex items-center justify-center transition-colors duration-300">
                        <ChevronRight className="w-4 h-4 text-green-700 group-hover:text-white transition-colors duration-300" />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      {clinic.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
                          <span className="line-clamp-1">{clinic.address}</span>
                        </div>
                      )}
                      {clinic.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
                          <span>{clinic.phone}</span>
                        </div>
                      )}
                    </div>
                    {/* 院別お知らせプレビュー */}
                    {clinicAnnouncements.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-green-50">
                        <p className="text-xs text-amber-700 font-medium line-clamp-1">
                          {clinicAnnouncements[0].title}
                        </p>
                      </div>
                    )}
                  </Link>
                  {/* 物販予約 */}
                  {hasMerchandise && (
                    <Link
                      href={`/reserve/${clinic.id}/merchandise`}
                      className="flex items-center justify-between px-5 py-3 border-t border-green-50 bg-pink-50/40 hover:bg-pink-50 transition-colors group/merc"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-pink-600" />
                        <span className="text-sm font-medium text-green-950">物販を予約する</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-pink-300 group-hover/merc:text-pink-600 transition-colors" />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 予約の確認・変更・キャンセル */}
        <Link
          href="/reserve/cancel"
          className="flex items-center justify-between bg-white rounded-2xl border border-stone-200 shadow-sm p-4 hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
              <CalendarX2 className="w-5 h-5 text-stone-500" />
            </div>
            <div>
              <p className="font-semibold text-green-950 text-sm">予約の確認・変更・キャンセル</p>
              <p className="text-xs text-muted-foreground mt-0.5">電話番号でご予約を検索できます</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-emerald-600 transition-colors" />
        </Link>
      </div>
    </div>
  )
}
