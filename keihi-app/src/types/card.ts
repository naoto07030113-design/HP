// クレジットカード（下4桁 → 事業所の対応）
export interface Card {
  id: string
  last4: string
  business_id: string | null
  label: string
  created_at: string
  updated_at: string
}

export type CardFormData = Pick<Card, 'last4' | 'business_id' | 'label'>
