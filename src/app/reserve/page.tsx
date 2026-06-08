'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Clock, ChevronRight } from 'lucide-react'
import { useClinicStore } from '@/lib/clinic-store'
import { useAnnouncementsStore, announcementsStore } from '@/lib/announcement-store'
import { AnnouncementBanners } from '@/components/common/AnnouncementBanner'

export default function ReservePage() {
  const store = useClinicStore()
  const announcements = useAnnouncementsStore()
  const activeClinics = store.clinics.filter((c) => c.is_active)
  const companyAnnouncements = announcementsStore.getActive('company')

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* ヘッダー */}
      <header className="bg-green-900 text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold tracking-tight">オンライン予約</h1>
          <p className="text-green-200 text-sm mt-0.5">24時間いつでもご予約いただけます</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* 全社お知らせ */}
        {companyAnnouncements.length > 0 && (
          <AnnouncementBanners announcements={companyAnnouncements} />
        )}

        <div>
          <h2 className="text-lg font-bold text-green-900 mb-3">院を選んでください</h2>
          <div className="space-y-3">
            {activeClinics.map((clinic) => {
              const clinicAnnouncements = announcementsStore.getActive('clinic', clinic.id)
                .filter((a) => a.scope === 'clinic')
              return (
                <Link
                  key={clinic.id}
                  href={`/reserve/${clinic.id}`}
                  className="block bg-white rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-all hover:border-green-300 active:scale-[0.99] p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-xs tracking-tight">IMC</span>
                      </div>
                      <div>
                        <p className="font-bold text-green-900">{clinic.name}</p>
                        <p className="text-xs text-green-600 mt-0.5">
                          {clinic.open_time} - {clinic.close_time}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {clinic.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="line-clamp-1">{clinic.address}</span>
                      </div>
                    )}
                    {clinic.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{clinic.phone}</span>
                      </div>
                    )}
                  </div>
                  {/* 院別お知らせプレビュー */}
                  {clinicAnnouncements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-50">
                      <p className="text-xs text-amber-700 font-medium line-clamp-1">
                        {clinicAnnouncements[0].title}
                      </p>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
