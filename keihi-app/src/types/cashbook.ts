export type EntryType = 'income' | 'expense'
export type EntrySource = 'manual' | 'receipt' | 'bankbook'

export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'payroll'
  | 'supplies'
  | 'medical_supplies'
  | 'advertising'
  | 'communication'
  | 'travel'
  | 'repairs'
  | 'fees'
  | 'misc'
  | 'other'

export type IncomeCategory = 'sales' | 'misc_income' | 'other_income'

export type CashbookCategory = ExpenseCategory | IncomeCategory

export type CashbookPaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'direct_debit' | 'other'

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  income:  '入金',
  expense: '出金',
}

export const ENTRY_SOURCE_LABELS: Record<EntrySource, string> = {
  manual:   '手入力',
  receipt:  'レシート',
  bankbook: '通帳',
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent:             '地代家賃',
  utilities:        '水道光熱費',
  payroll:          '人件費',
  supplies:         '消耗品費',
  medical_supplies: '医療材料費',
  advertising:      '広告宣伝費',
  communication:    '通信費',
  travel:           '旅費交通費',
  repairs:          '修繕費',
  fees:             '支払手数料',
  misc:             '雑費',
  other:            'その他',
}

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  sales:        '売上入金',
  misc_income:  '雑収入',
  other_income: 'その他収入',
}

export const CATEGORY_LABELS: Record<CashbookCategory, string> = {
  ...EXPENSE_CATEGORY_LABELS,
  ...INCOME_CATEGORY_LABELS,
}

export const CATEGORY_BAR_COLORS: Record<ExpenseCategory, string> = {
  rent:             'bg-indigo-400',
  utilities:        'bg-sky-400',
  payroll:          'bg-rose-400',
  supplies:         'bg-amber-400',
  medical_supplies: 'bg-teal-400',
  advertising:      'bg-fuchsia-400',
  communication:    'bg-cyan-400',
  travel:           'bg-lime-400',
  repairs:          'bg-orange-400',
  fees:             'bg-violet-400',
  misc:             'bg-gray-400',
  other:            'bg-gray-300',
}

export const PAYMENT_METHOD_LABELS: Record<CashbookPaymentMethod, string> = {
  cash:          '現金',
  card:          'クレジットカード',
  bank_transfer: '銀行振込',
  direct_debit:  '口座引落',
  other:         'その他',
}

export interface CashbookEntry {
  id: string
  business_id: string | null
  entry_date: string
  entry_type: EntryType
  category: CashbookCategory
  vendor: string
  description: string
  amount: number
  payment_method: CashbookPaymentMethod
  source: EntrySource
  memo: string | null
  created_at: string
  updated_at: string
}

export type CashbookEntryFormData = Omit<CashbookEntry, 'id' | 'created_at' | 'updated_at'>

// ---------------------------------------------------------------------------
// 支払予定（請求書・見積書など振込期日がある書類）
// ---------------------------------------------------------------------------

export type DocumentType = 'invoice' | 'quote' | 'other'
export type ScheduledPaymentStatus = 'pending' | 'paid' | 'cancelled'

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: '請求書',
  quote:   '見積書',
  other:   'その他',
}

export const SCHEDULED_PAYMENT_STATUS_LABELS: Record<ScheduledPaymentStatus, string> = {
  pending:   '未払い',
  paid:      '支払済',
  cancelled: '取消',
}

export interface ScheduledPayment {
  id: string
  business_id: string | null
  document_type: DocumentType
  vendor: string
  description: string
  amount: number
  due_date: string
  status: ScheduledPaymentStatus
  memo: string | null
  created_at: string
  updated_at: string
}

export type ScheduledPaymentFormData = Omit<ScheduledPayment, 'id' | 'created_at' | 'updated_at'>

// ---------------------------------------------------------------------------
// 書類OCR（1つの窓口でAIが書類種別を判定して振り分ける）
// ---------------------------------------------------------------------------

export type DocumentKind = 'receipt' | 'bankbook' | 'payment_due' | 'unknown'

// OCR結果（レシート読取）
export interface ReceiptOcrResult {
  entry_date: string
  vendor: string
  description: string
  amount: number
  category: ExpenseCategory
}

// OCR結果（通帳読取・1行分）
export interface BankbookOcrRow {
  entry_date: string
  entry_type: EntryType
  description: string
  amount: number
}

// OCR結果（請求書・見積書読取）
export interface PaymentDueOcrResult {
  document_type: DocumentType
  vendor: string
  description: string
  amount: number
  due_date: string // 読み取れなかった場合は空文字
}

export interface DocumentOcrResult {
  kind: DocumentKind
  receipt?: ReceiptOcrResult
  entries?: BankbookOcrRow[]
  payment?: PaymentDueOcrResult
}
