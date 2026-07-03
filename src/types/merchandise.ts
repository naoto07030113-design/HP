export interface Merchandise {
  id: string
  clinic_id: string
  name: string
  description: string | null
  price: number
  stock: number | null  // null = unlimited
  image_url: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type MerchandiseBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'delivered'

export const MERCHANDISE_BOOKING_STATUS_LABELS: Record<MerchandiseBookingStatus, string> = {
  pending:   '受付済',
  confirmed: '確認済',
  cancelled: 'キャンセル',
  delivered: '渡し済',
}

export const MERCHANDISE_BOOKING_STATUS_COLORS: Record<MerchandiseBookingStatus, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
  delivered: 'bg-blue-50 text-blue-700 border-blue-200',
}

export interface MerchandiseBooking {
  id: string
  merchandise_id: string
  clinic_id: string
  patient_name: string
  patient_phone: string | null
  patient_id: string | null
  quantity: number
  status: MerchandiseBookingStatus
  notes: string | null
  booked_at: string
  created_at: string
  updated_at: string
  merchandise?: Merchandise
}

export type MerchandiseFormData = Omit<Merchandise, 'id' | 'created_at' | 'updated_at'>
export type MerchandiseBookingFormData = Omit<MerchandiseBooking, 'id' | 'created_at' | 'updated_at' | 'booked_at' | 'merchandise'>
