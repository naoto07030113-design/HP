import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatScore(score: number | null): string {
  if (score === null || score === undefined) return '-'
  return (score * 100).toFixed(0)
}

export function getPriorityLabel(score: number | null): {
  label: string
  color: string
} {
  if (score === null) return { label: '未評価', color: 'gray' }
  const s = score * 100
  if (s >= 80) return { label: '最優先', color: 'red' }
  if (s >= 60) return { label: '優先', color: 'orange' }
  if (s >= 40) return { label: '保留', color: 'yellow' }
  return { label: '対象外', color: 'gray' }
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    new: '新規',
    contacted: '連絡済',
    negotiating: '商談中',
    contracted: '契約済',
    lost: '失注',
  }
  return map[status] ?? status
}

export function getEventTypeLabel(eventType: string): string {
  const map: Record<string, string> = {
    sent: '送信',
    opened: '開封',
    replied: '返信',
    meeting: '商談',
    estimate: '見積',
    contracted: '契約',
    lost: '失注',
  }
  return map[eventType] ?? eventType
}
