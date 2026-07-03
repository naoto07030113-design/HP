-- 休診日テーブルの拡張: リピート機能・時間帯指定

-- closed_date を NULL 許容に変更（週次定休日は日付不要）
ALTER TABLE closed_days ALTER COLUMN closed_date DROP NOT NULL;

-- 新カラム追加
ALTER TABLE closed_days
  ADD COLUMN IF NOT EXISTS repeat_type TEXT NOT NULL DEFAULT 'none'
    CHECK (repeat_type IN ('none', 'weekly')),
  ADD COLUMN IF NOT EXISTS day_of_week SMALLINT
    CHECK (day_of_week BETWEEN 0 AND 6),
  ADD COLUMN IF NOT EXISTS close_type  TEXT NOT NULL DEFAULT 'all_day'
    CHECK (close_type IN ('all_day', 'morning', 'afternoon', 'time_range')),
  ADD COLUMN IF NOT EXISTS close_from  TIME,
  ADD COLUMN IF NOT EXISTS close_to    TIME;

-- 週次定休日用インデックス
CREATE INDEX IF NOT EXISTS idx_closed_days_repeat ON closed_days(repeat_type, day_of_week)
  WHERE repeat_type = 'weekly';
