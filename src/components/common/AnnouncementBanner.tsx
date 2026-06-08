'use client'

import { useState } from 'react'
import type { Announcement, AnnouncementType } from '@/types/announcement'
import { ANNOUNCEMENT_TYPE_LABELS } from '@/types/announcement'
import { cn } from '@/lib/utils'
import { X, AlertTriangle, Megaphone, Calendar, Info, Paperclip, ExternalLink } from 'lucide-react'

const TYPE_ICONS: Record<AnnouncementType, React.ElementType> = {
  normal: Info,
  important: AlertTriangle,
  campaign: Megaphone,
  closed: Calendar,
  warning: AlertTriangle,
}

const BADGE_COLORS: Record<AnnouncementType, string> = {
  normal:    'bg-green-700 text-white',
  important: 'bg-red-600   text-white',
  campaign:  'bg-amber-500 text-white',
  closed:    'bg-gray-600  text-white',
  warning:   'bg-orange-500 text-white',
}

const STRIP_COLORS: Record<AnnouncementType, string> = {
  normal:    'bg-green-50  border-green-200  text-green-900',
  important: 'bg-red-50    border-red-200    text-red-900',
  campaign:  'bg-amber-50  border-amber-200  text-amber-900',
  closed:    'bg-gray-50   border-gray-200   text-gray-800',
  warning:   'bg-orange-50 border-orange-200 text-orange-900',
}

// 優先度順（上から表示）
const TYPE_ORDER: AnnouncementType[] = ['important', 'warning', 'closed', 'campaign', 'normal']

interface Props {
  announcements: Announcement[]
}

function TickerStrip({
  type, items, onDismiss,
}: {
  type: AnnouncementType
  items: Announcement[]
  onDismiss: () => void
}) {
  const Icon = TYPE_ICONS[type]

  // テキスト全体の長さでスクロール速度を調整
  const totalLen = items.reduce(
    (acc, a) => acc + a.title.length + (a.body?.length ?? 0),
    0,
  )
  const duration = Math.max(14, Math.round(totalLen * 0.4))

  return (
    <div className={cn('flex items-stretch border-b overflow-hidden', STRIP_COLORS[type])}>
      {/* 左バッジ */}
      <div className={cn(
        'flex items-center justify-center gap-2 px-5 py-4 flex-shrink-0 font-bold text-sm leading-none w-28',
        BADGE_COLORS[type],
      )}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{ANNOUNCEMENT_TYPE_LABELS[type]}</span>
      </div>

      {/* スクロールテキスト */}
      <div className="flex-1 overflow-hidden flex items-center px-3 py-4 cursor-default">
        <div
          className="marquee-track text-sm font-medium"
          style={{ animationDuration: `${duration}s` }}
          title="ホバーで一時停止"
        >
          {/* シームレスループのため 2 回複製 */}
          {[0, 1].map((copy) => (
            <span key={copy} className="inline-flex items-center">
              {items.map((a, idx) => (
                <span key={`${copy}-${a.id}`} className="inline-flex items-center gap-2">
                  {idx > 0 && <span className="opacity-30 mx-4 text-base">｜</span>}
                  {a.attachment_name && (
                    <Paperclip className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                  )}
                  <span>{a.title}</span>
                  {a.body && (
                    <span className="opacity-70 text-xs ml-1">{a.body}</span>
                  )}
                  {a.link_url && (
                    <a
                      href={a.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 underline opacity-70 hover:opacity-100 text-xs ml-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {a.link_label ?? '詳細'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {/* ループ間のスペーサー */}
                  <span className="inline-block w-16" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* 閉じるボタン */}
      <button
        onClick={onDismiss}
        className="px-4 py-4 hover:bg-black/10 transition-colors flex-shrink-0 flex items-center"
        aria-label="閉じる"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function AnnouncementBanners({ announcements }: Props) {
  const [dismissed, setDismissed] = useState<Set<AnnouncementType>>(new Set())

  if (announcements.length === 0) return null

  // タイプ別にグループ化
  const byType = TYPE_ORDER.reduce<Record<AnnouncementType, Announcement[]>>(
    (acc, t) => { acc[t] = announcements.filter((a) => a.type === t); return acc },
    { important: [], warning: [], closed: [], campaign: [], normal: [] },
  )

  const visibleTypes = TYPE_ORDER.filter(
    (t) => byType[t].length > 0 && !dismissed.has(t),
  )

  if (visibleTypes.length === 0) return null

  return (
    <div className="flex flex-col">
      {visibleTypes.map((type) => (
        <TickerStrip
          key={type}
          type={type}
          items={byType[type]}
          onDismiss={() => setDismissed((prev) => new Set([...Array.from(prev), type]))}
        />
      ))}
    </div>
  )
}
