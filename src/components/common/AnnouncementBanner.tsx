'use client'

import { useState } from 'react'
import type { Announcement } from '@/types/announcement'
import { cn } from '@/lib/utils'
import { X, AlertTriangle, Megaphone, Calendar, Info, Paperclip, ExternalLink } from 'lucide-react'

const TYPE_ICONS = {
  normal: Info,
  important: AlertTriangle,
  campaign: Megaphone,
  closed: Calendar,
  warning: AlertTriangle,
}

const TYPE_PRIORITY: Record<string, number> = {
  important: 5, warning: 4, campaign: 3, closed: 2, normal: 1,
}

const BADGE_COLORS: Record<string, string> = {
  normal: 'bg-green-700 text-white',
  important: 'bg-red-600 text-white',
  campaign: 'bg-amber-500 text-white',
  closed: 'bg-gray-600 text-white',
  warning: 'bg-orange-500 text-white',
}

const STRIP_COLORS: Record<string, string> = {
  normal: 'bg-green-50 border-green-200 text-green-900',
  important: 'bg-red-50 border-red-200 text-red-900',
  campaign: 'bg-amber-50 border-amber-200 text-amber-900',
  closed: 'bg-gray-50 border-gray-200 text-gray-800',
  warning: 'bg-orange-50 border-orange-200 text-orange-900',
}

interface Props {
  announcements: Announcement[]
}

export function AnnouncementBanners({ announcements }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || announcements.length === 0) return null

  const sorted = [...announcements].sort(
    (a, b) => (TYPE_PRIORITY[b.type] ?? 0) - (TYPE_PRIORITY[a.type] ?? 0),
  )
  const topType = sorted[0].type
  const TopIcon = TYPE_ICONS[topType]

  // Build ticker text from all announcements
  const segments = sorted.map((a) => {
    const parts: string[] = [a.title]
    if (a.body) parts.push(a.body)
    if (a.attachment_name) parts.push(`[添付: ${a.attachment_name}]`)
    return parts.join(' ')
  })
  const tickerText = segments.join('　　|　　')

  // Speed: ~40px/s → duration in seconds
  const duration = Math.max(12, Math.round(tickerText.length * 0.38))

  return (
    <div className={cn('flex items-stretch border-b text-sm overflow-hidden', STRIP_COLORS[topType])}>
      {/* Left badge */}
      <div className={cn('flex items-center gap-1.5 px-3 py-2 flex-shrink-0 font-semibold text-xs leading-none', BADGE_COLORS[topType])}>
        <TopIcon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="hidden sm:inline">お知らせ</span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden py-2 px-2 cursor-default">
        <div
          className="marquee-track text-sm leading-tight"
          style={{ animationDuration: `${duration}s` }}
          title="ホバーで一時停止"
        >
          {/* Duplicate for seamless loop */}
          {[0, 1].map((i) => (
            <span key={i} className="inline-flex items-center gap-3">
              {sorted.map((a, idx) => (
                <span key={`${i}-${a.id}`} className="inline-flex items-center gap-1.5">
                  {idx > 0 && <span className="opacity-40 mx-2">｜</span>}
                  {a.attachment_name && <Paperclip className="w-3 h-3 opacity-60 flex-shrink-0" />}
                  <span>{a.title}</span>
                  {a.link_url && (
                    <a
                      href={a.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 underline opacity-70 hover:opacity-100 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {a.link_label ?? '詳細'}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  <span className="opacity-0 select-none">&emsp;&emsp;</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="px-3 py-2 hover:bg-black/10 transition-colors flex-shrink-0 flex items-center"
        aria-label="閉じる"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
