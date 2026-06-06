-- Pre-Site Sales AI Engine: Initial Schema
-- Run this migration in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  google_map_url TEXT,
  source_name TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'negotiating', 'contracted', 'lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Web presence scores table
CREATE TABLE IF NOT EXISTS web_presence_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  has_official_website BOOLEAN,
  website_reachable BOOLEAN,
  website_quality_score NUMERIC(4,3),
  sns_presence_score NUMERIC(4,3),
  review_volume_score NUMERIC(4,3),
  competitor_gap_score NUMERIC(4,3),
  no_hp_probability NUMERIC(4,3),
  web_presence_score NUMERIC(4,3),
  confidence_score NUMERIC(4,3),
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  website_url TEXT,
  review_count INTEGER,
  rating NUMERIC(3,2),
  strengths TEXT,
  weaknesses TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  source_name TEXT,
  rating NUMERIC(3,2),
  review_text TEXT,
  sentiment_score NUMERIC(4,3),
  extracted_topics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contract_probability NUMERIC(4,3),
  expected_revenue_uplift NUMERIC(12,2),
  priority_score NUMERIC(4,3),
  confidence_score NUMERIC(4,3),
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LP variants table
CREATE TABLE IF NOT EXISTS lp_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT,
  target_persona TEXT,
  main_copy TEXT,
  page_structure JSONB,
  generated_html TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outreach messages table
CREATE TABLE IF NOT EXISTS outreach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'opened', 'replied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outreach events table
CREATE TABLE IF NOT EXISTS outreach_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_note TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_presence_scores_business_id ON web_presence_scores(business_id);
CREATE INDEX IF NOT EXISTS idx_predictions_business_id ON predictions(business_id);
CREATE INDEX IF NOT EXISTS idx_predictions_priority_score ON predictions(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_lp_variants_business_id ON lp_variants(business_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_business_id ON outreach_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_outreach_events_business_id ON outreach_events(business_id);
CREATE INDEX IF NOT EXISTS idx_outreach_events_occurred_at ON outreach_events(occurred_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_presence_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to access all data (service role bypasses RLS)
CREATE POLICY "Allow authenticated read" ON businesses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON businesses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON businesses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON businesses FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON web_presence_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON web_presence_scores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON web_presence_scores FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON predictions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON predictions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON lp_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON lp_variants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON lp_variants FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON outreach_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON outreach_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON outreach_messages FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON outreach_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON outreach_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON competitors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON competitors FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON reviews FOR INSERT TO authenticated WITH CHECK (true);
