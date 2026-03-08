
-- Add new columns to offers table for advanced offer management
ALTER TABLE offers ADD COLUMN IF NOT EXISTS design_template text NOT NULL DEFAULT 'badge';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS badge_text text;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS badge_color text DEFAULT '#ef4444';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS badge_text_color text DEFAULT '#ffffff';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS animation_type text DEFAULT 'none';
ALTER TABLE offers ADD COLUMN IF NOT EXISTS seasonal_theme text;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS background_gradient text;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS timer_start_date timestamptz;

-- Add offer columns to dynamic_products table
ALTER TABLE dynamic_products ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES offers(id) ON DELETE SET NULL;
ALTER TABLE dynamic_products ADD COLUMN IF NOT EXISTS offer_badge_text text;
ALTER TABLE dynamic_products ADD COLUMN IF NOT EXISTS offer_badge_color text;
