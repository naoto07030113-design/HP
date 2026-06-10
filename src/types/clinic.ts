export interface Clinic {
  id: string
  name: string
  address: string | null
  phone: string | null
  open_time: string   // "09:00"
  close_time: string  // "18:00"
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Staff {
  id: string
  clinic_id: string
  name: string
  role: string | null
  is_bookable: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  clinic?: Clinic
}

export interface Menu {
  id: string
  clinic_id: string
  name: string
  duration_min: number
  price: number
  visit_type: 'first' | 'return' | 'both'
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type ShiftType = 'work' | 'off' | 'paid' | 'sick' | 'special'

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  work:    '出勤',
  off:     '公休',
  paid:    '有給',
  sick:    '病欠',
  special: '特別休暇',
}

export const SHIFT_TYPE_SHORT: Record<ShiftType, string> = {
  work:    '出',
  off:     '休',
  paid:    '有',
  sick:    '病',
  special: '特',
}

export const SHIFT_TYPE_COLORS: Record<ShiftType, string> = {
  work:    'bg-green-100 text-green-800',
  off:     'bg-gray-100  text-gray-600',
  paid:    'bg-blue-100  text-blue-800',
  sick:    'bg-red-100   text-red-700',
  special: 'bg-purple-100 text-purple-800',
}

export interface Shift {
  id: string
  staff_id: string
  clinic_id: string
  work_date: string
  shift_type: ShiftType
  start_time: string
  end_time: string
  break_start: string | null
  break_end: string | null
  created_at: string
  updated_at: string
  staff?: Staff
}

export interface ShiftBlock {
  id: string
  staff_id: string
  block_date: string
  start_time: string
  end_time: string
  reason: string | null
  created_at: string
  staff?: Staff
}

export type ReservationStatus = 'confirmed' | 'visited' | 'cancelled' | 'no_show'

export interface Reservation {
  id: string
  clinic_id: string
  staff_id: string | null
  menu_id: string | null
  patient_id: string | null  // 将来: patients テーブルへの外部キー
  patient_name: string
  patient_phone: string | null
  referral_name: string | null  // 紹介者氏名
  start_at: string  // ISO datetime
  end_at: string
  status: ReservationStatus
  memo: string | null
  created_at: string
  updated_at: string
  staff?: Staff
  menu?: Menu
}

// フォーム用
export type ClinicFormData = Omit<Clinic, 'id' | 'created_at' | 'updated_at'>
export type StaffFormData = Omit<Staff, 'id' | 'created_at' | 'updated_at' | 'clinic'>
export type MenuFormData = Omit<Menu, 'id' | 'created_at' | 'updated_at'>
export type ShiftFormData = Omit<Shift, 'id' | 'created_at' | 'updated_at' | 'staff'>
export type ShiftBlockFormData = Omit<ShiftBlock, 'id' | 'created_at' | 'staff'>
export type ReservationFormData = Omit<Reservation, 'id' | 'created_at' | 'updated_at' | 'staff' | 'menu'>

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  confirmed: '予約確定',
  visited: '来院済',
  cancelled: 'キャンセル',
  no_show: '無断キャンセル',
}

export const VISIT_TYPE_LABELS = {
  first: '初診',
  return: '再来',
  both: '両方',
} as const

export const STAFF_ROLES = [
  '柔道整復師',
  '鍼師',
  '灸師',
  'あん摩師',
] as const

export interface ClosedDay {
  id: string
  clinic_id: string
  closed_date: string  // 'YYYY-MM-DD'
  reason: string | null
  created_at: string
  updated_at: string
}

export type ClosedDayFormData = Omit<ClosedDay, 'id' | 'created_at' | 'updated_at'>
