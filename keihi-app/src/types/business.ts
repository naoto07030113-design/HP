// 事業所（店舗・拠点・部門など、経費を分けて集計する単位）
export interface Business {
  id: string
  name: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type BusinessFormData = Pick<Business, 'name' | 'is_active' | 'sort_order'>
