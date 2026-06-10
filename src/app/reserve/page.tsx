'use client'

import Link from 'next/link'
import { MapPin, Phone, Clock, ChevronRight } from 'lucide-react'
import { useClinicStore } from '@/lib/clinic-store'
import { useAnnouncementsStore, announcementsStore } from '@/lib/announcement-store'
import { AnnouncementBanners } from '@/components/common/AnnouncementBanner'

export default function ReservePage() {
  const store = useClinicStore()
  useAnnouncementsStore()
  const activeClinics = store.clinics.filter((c) => c.is_active)
  const companyAnnouncements = announcementsStore.getActive('company')

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ヒーローヘッダー */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white">
        <div className="max-w-lg mx-auto px-5 pt-10 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <span className="text-white font-black text-xs tracking-tight">IMC</span>
            </div>
            <span className="text-emerald-200 text-sm font-medium tracking-wide">統合メディカルケア</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-tight mb-2">
            オンライン予約
          </h1>
          <p className="text-emerald-200 text-sm">
            24時間いつでも、かんたんにご予約いただけます
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-3 pb-10 space-y-5">
        {/* お知らせ */}
        {companyAnnouncements.length > 0 && (
          <div className="pt-5">
            <AnnouncementBanners announcements={companyAnnouncements} />
          </div>
        )}

        {/* 院選択 */}
        <div className="pt-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3 px-1">
            院を選択
          </p>
          <div className="space-y-3">
            {activeClinics.map((clinic) => {
              const clinicAnnouncements = announcementsStore.getActive('clinic', clinic.id)
                .filter((a) => a.scope === 'clinic')
              return (
                <Link
                  key={clinic.id}
                  href={`/reserve/${clinic.id}`}
                  className="group block bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md hover:border-emerald-200 active:scale-[0.99] transition-all duration-200 overflow-hidden"
                >
                  <div className="h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-emerald-950 text-base leading-snug">{clinic.name}</p>
                        <div className="mt-2.5 space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-stone-500">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{clinic.open_time} 〜 {clinic.close_time}</span>
                          </div>
                          {clinic.address && (
                            <div className="flex items-start gap-2 text-xs text-stone-500">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{clinic.address}</span>
                            </div>
                          )}
                          {clinic.phone && (
                            <div className="flex items-center gap-2 text-xs text-stone-500">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>{clinic.phone}</span>
                            </div>
                          )}
                        </div>
                        {clinicAnnouncements.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-stone-100">
                            <p className="text-xs text-amber-600 font-medium line-clamp-1">
                              {clinicAnnouncements[0].title}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center flex-shrink-0 transition-colors">
                        <ChevronRight className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* フッターリンク */}
        <div className="text-center pt-4">
          <Link
            href="/reserve/cancel"
            className="text-xs text-stone-400 hover:text-emerald-700 transition-colors underline underline-offset-2"
          >
            予約の確認・変更・キャンセルはこちら
          </Link>
        </div>
      </div>
    </div>
  )
}
