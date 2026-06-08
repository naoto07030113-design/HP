'use client'

import { useState } from 'react'
import type { Announcement } from '@/types/announcement'
import { ANNOUNCEMENT_TYPE_COLORS } from '@/types/announcement'
import { cn } from '@/lib/utils'
import { X, ExternalLink, AlertTriangle, Megaphone, Calendar, Info } from 'lucide-react'

const TYPE_ICONS = {
  normal: Info,
  important: AlertTriangle,
  campaign: Megaphone,
  closed: Calendar,
  warning: AlertTriangle,
}

interface Props {
  announcements: Announcement[]
}

export function AnnouncementBanners({ announcements }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = announcements.filter((a) => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      {visible.map((a) => {
        const Icon = TYPE_ICONS[a.type]
        return (
          <div
            key={a.id}
            className={cn(
              'relative rounded-lg border px-4 py-3 pr-10',
              ANNOUNCEMENT_TYPE_COLORS[a.type],
            )}
          >
            <div className="flex items-start gap-2.5">
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">{a.title}</p>
                {a.body && <p className="text-sm mt-0.5 opacity-90">{a.body}</p>}
                {a.link_url && (
                  <a
                    href={a.link_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium mt-1.5 underline opacity-90 hover:opacity-100"
                  >
                    {a.link_label ?? 'もっと見る'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={() => setDismissed((s) => { const n = new Set(Array.from(s)); n.add(a.id); return n })}
              className="absolute top-2 right-2 p-1 rounded hover:bg-black/10 transition-colors"
              aria-label="閉じる"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
