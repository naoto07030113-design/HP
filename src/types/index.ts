export type BusinessStatus = 'new' | 'contacted' | 'negotiating' | 'contracted' | 'lost'

export interface Business {
  id: string
  name: string
  industry: string | null
  address: string | null
  phone: string | null
  email: string | null
  website_url: string | null
  google_map_url: string | null
  source_name: string | null
  status: BusinessStatus
  created_at: string
  updated_at: string
}

export interface WebPresenceScore {
  id: string
  business_id: string
  has_official_website: boolean | null
  website_reachable: boolean | null
  website_quality_score: number | null
  sns_presence_score: number | null
  review_volume_score: number | null
  competitor_gap_score: number | null
  no_hp_probability: number | null
  web_presence_score: number | null
  confidence_score: number | null
  reasoning: string | null
  created_at: string
}

export interface Competitor {
  id: string
  business_id: string
  name: string | null
  website_url: string | null
  review_count: number | null
  rating: number | null
  strengths: string | null
  weaknesses: string | null
  created_at: string
}

export interface Review {
  id: string
  business_id: string
  source_name: string | null
  rating: number | null
  review_text: string | null
  sentiment_score: number | null
  extracted_topics: Record<string, unknown> | null
  created_at: string
}

export interface Prediction {
  id: string
  business_id: string
  contract_probability: number | null
  expected_revenue_uplift: number | null
  priority_score: number | null
  confidence_score: number | null
  reasoning: string | null
  created_at: string
}

export interface LpSection {
  type: 'hero' | 'reasons' | 'services' | 'strengths' | 'faq' | 'cta'
  title: string
  content: string | string[]
}

export interface LpVariant {
  id: string
  business_id: string
  title: string | null
  target_persona: string | null
  main_copy: string | null
  page_structure: LpSection[] | null
  generated_html: string | null
  status: 'draft' | 'active' | 'archived'
  created_at: string
}

export interface OutreachMessage {
  id: string
  business_id: string
  channel: string
  subject: string | null
  body: string | null
  status: 'draft' | 'sent' | 'opened' | 'replied'
  created_at: string
}

export interface OutreachEvent {
  id: string
  business_id: string
  event_type: string
  event_note: string | null
  occurred_at: string
}

export interface DashboardStats {
  total_businesses: number
  high_priority_count: number
  lp_generated_count: number
  email_generated_count: number
  negotiation_count: number
  contracted_count: number
}

export type EventType =
  | 'sent'
  | 'opened'
  | 'replied'
  | 'meeting'
  | 'estimate'
  | 'contracted'
  | 'lost'
