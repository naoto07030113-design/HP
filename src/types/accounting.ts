export type PaymentMethod = 'cash' | 'card' | 'paypay' | 'line_pay' | 'insurance' | 'other'
export type InsuranceType = 'none' | 'health_insurance' | 'workers_comp' | 'auto_accident'
export type InvoiceStatus = 'unpaid' | 'paid' | 'cancelled'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash:        '現金',
  card:        'クレジットカード',
  paypay:      'PayPay',
  line_pay:    'LINE Pay',
  insurance:   '保険',
  other:       'その他',
}

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  none:             '自費',
  health_insurance: '健康保険',
  workers_comp:     '労災',
  auto_accident:    '交通事故',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  unpaid:    '未払い',
  paid:      '支払済',
  cancelled: 'キャンセル',
}

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  unpaid:    'bg-amber-50 border-amber-200 text-amber-800',
  paid:      'bg-green-50 border-green-200 text-green-800',
  cancelled: 'bg-gray-100 border-gray-200 text-gray-500',
}

export interface InvoiceItem {
  id: string
  menu_id: string | null
  name: string
  unit_price: number
  quantity: number
  discount: number
  subtotal: number
}

export interface Invoice {
  id: string
  invoice_number: string
  reservation_id: string | null
  patient_id: string | null
  patient_name: string
  clinic_id: string
  staff_id: string | null
  visit_date: string
  items: InvoiceItem[]
  subtotal: number
  discount_total: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  insurance_type: InsuranceType
  insurance_copay: number
  payment_method: PaymentMethod
  payment_amount: number
  change_amount: number
  status: InvoiceStatus
  memo: string | null
  created_at: string
  updated_at: string
}

export type InvoiceFormData = Omit<Invoice, 'id' | 'invoice_number' | 'created_at' | 'updated_at'>
