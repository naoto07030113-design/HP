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

// 電話番号の正規化（ハイフン・空白・全角ハイフン除去）。
// 予約の保存時と検索時の両方で使い、表記ゆれによる不一致を防ぐ。
export function normalizePhone(p: string): string {
  return p.replace(/[-‐−ー\s]/g, '')
}
