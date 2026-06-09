-- お知らせ・バナー管理テーブル
-- 将来: トップページ・採用・LP・ブログ告知・LINE誘導にも流用可能

CREATE TABLE IF NOT EXISTS announcements (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  banner_mode    text NOT NULL DEFAULT 'text' CHECK (banner_mode IN ('text','image')),
  title          text NOT NULL,
  body           text,
  image_url      text,          -- Supabase Storage 公開URL
  image_path     text,          -- Supabase Storage パス
  image_alt      text,
  scope          text NOT NULL DEFAULT 'company' CHECK (scope IN ('company','clinic')),
  clinic_id      uuid REFERENCES clinics(id) ON DELETE CASCADE,
  type           text NOT NULL DEFAULT 'normal'
                 CHECK (type IN ('normal','important','campaign','closed','warning')),
  start_date     date NOT NULL,
  end_date       date NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  display_order  integer NOT NULL DEFAULT 0,
  link_url       text,
  link_label     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_scope ON announcements(scope);
CREATE INDEX IF NOT EXISTS idx_announcements_clinic_id ON announcements(clinic_id);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_order ON announcements(display_order);

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_announcements"  ON announcements FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all_announcements"   ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Supabase Storage バケット（SQL Editorで別途実行）
-- INSERT INTO storage.buckets (id, name, public) VALUES ('announcement-banners', 'announcement-banners', true);
