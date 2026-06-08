export type BannerMode = 'text' | 'image'
export type AnnouncementScope = 'company' | 'clinic'
export type AnnouncementType = 'normal' | 'important' | 'campaign' | 'closed' | 'warning'

export interface Announcement {
  id: string
  banner_mode: BannerMode
  title: string
  body: string | null
  image_url: string | null
  image_path: string | null
  image_alt: string | null
  scope: AnnouncementScope
  clinic_id: string | null  // scope='clinic' のとき使用
  type: AnnouncementType
  start_date: string   // "yyyy-MM-dd"
  end_date: string     // "yyyy-MM-dd"
  is_active: boolean
  display_order: number
  link_url: string | null
  link_label: string | null
  created_at: string
  updated_at: string
}

export type AnnouncementFormData = Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'image_url' | 'image_path'>

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  normal: '通常',
  important: '重要',
  campaign: 'キャンペーン',
  closed: '休診',
  warning: '注意',
}

export const ANNOUNCEMENT_TYPE_COLORS: Record<AnnouncementType, string> = {
  normal: 'bg-green-50 border-green-200 text-green-800',
  important: 'bg-red-50 border-red-200 text-red-800',
  campaign: 'bg-gold-50 border-gold-200 text-gold-800',
  closed: 'bg-gray-50 border-gray-200 text-gray-700',
  warning: 'bg-orange-50 border-orange-200 text-orange-800',
}
