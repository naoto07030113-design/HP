export const STATUS_LIST = ['未接触', '営業中', '返信あり', '商談', '成約', '失注']

export const INDUSTRY_LIST = ['整骨院', '鍼灸院', '整体院', '美容室', '飲食店', '学習塾']

export const STATUS_COLORS = {
  '未接触': { bg: 'bg-gray-800', text: 'text-gray-300', border: 'border-gray-700' },
  '営業中': { bg: 'bg-blue-900/40', text: 'text-blue-300', border: 'border-blue-800' },
  '返信あり': { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-800' },
  '商談': { bg: 'bg-yellow-900/40', text: 'text-yellow-300', border: 'border-yellow-800' },
  '成約': { bg: 'bg-green-900/40', text: 'text-green-300', border: 'border-green-800' },
  '失注': { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-900' },
}

export const STATUS_DOT = {
  '未接触': '#6B7280',
  '営業中': '#60A5FA',
  '返信あり': '#A78BFA',
  '商談': '#FCD34D',
  '成約': '#34D399',
  '失注': '#F87171',
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export function formatCurrency(amount) {
  if (!amount) return '—'
  return `¥${Number(amount).toLocaleString('ja-JP')}`
}

export function getScoreColor(score) {
  if (score >= 80) return '#34D399'
  if (score >= 60) return '#C9A84C'
  if (score >= 40) return '#FB923C'
  return '#6B7280'
}

export function getScoreLabel(score) {
  if (score >= 80) return '優先度: 高'
  if (score >= 60) return '優先度: 中'
  if (score >= 40) return '優先度: 低'
  return '優先度: 最低'
}

export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}
