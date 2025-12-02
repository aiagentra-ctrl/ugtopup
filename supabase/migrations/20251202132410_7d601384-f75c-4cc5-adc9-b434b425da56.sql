-- Table to store game product pricing (admin-editable)
CREATE TABLE public.game_product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game TEXT NOT NULL,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT '₹',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game, package_id)
);

-- Enable RLS
ALTER TABLE public.game_product_prices ENABLE ROW LEVEL SECURITY;

-- Anyone can read active prices (for frontend)
CREATE POLICY "Anyone can view active game prices" ON public.game_product_prices
  FOR SELECT USING (is_active = true);

-- Admins can manage all prices
CREATE POLICY "Admins can manage game prices" ON public.game_product_prices
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Enable real-time
ALTER TABLE public.game_product_prices REPLICA IDENTITY FULL;

-- Trigger for updated_at
CREATE TRIGGER update_game_product_prices_updated_at
  BEFORE UPDATE ON public.game_product_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed Free Fire Top-Up Packages
INSERT INTO public.game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order) VALUES
  ('freefire', 'ff_tu1', '25 Diamonds', 'topup', 25, 29, '₹', 1),
  ('freefire', 'ff_tu2', '50 Diamonds', 'topup', 50, 48, '₹', 2),
  ('freefire', 'ff_tu3', '115 Diamonds', 'topup', 115, 93, '₹', 3),
  ('freefire', 'ff_tu4', '240 Diamonds', 'topup', 240, 186, '₹', 4),
  ('freefire', 'ff_tu5', '355 Diamonds', 'topup', 355, 279, '₹', 5),
  ('freefire', 'ff_tu6', '610 Diamonds', 'topup', 610, 465, '₹', 6),
  ('freefire', 'ff_tu7', '610+61 Diamonds', 'topup', 671, 465, '₹', 7),
  ('freefire', 'ff_tu8', '1240 Diamonds', 'topup', 1240, 930, '₹', 8),
  ('freefire', 'ff_tu9', '2530 Diamonds', 'topup', 2530, 1860, '₹', 9),
  ('freefire', 'ff_tu10', '5100 Diamonds', 'topup', 5100, 3720, '₹', 10),
  ('freefire', 'ff_tu11', '5200 Diamonds', 'topup', 5200, 3720, '₹', 11),
  ('freefire', 'ff_tu12', '10400 Diamonds', 'topup', 10400, 7440, '₹', 12),
  ('freefire', 'ff_tu13', '15600 Diamonds', 'topup', 15600, 11160, '₹', 13),
  ('freefire', 'ff_tu14', '20800 Diamonds', 'topup', 20800, 14880, '₹', 14),
  ('freefire', 'ff_tu15', '26000 Diamonds', 'topup', 26000, 18600, '₹', 15),
  ('freefire', 'ff_tu16', '31200 Diamonds', 'topup', 31200, 22320, '₹', 16),
  ('freefire', 'ff_tu17', '36400 Diamonds', 'topup', 36400, 26040, '₹', 17);

-- Seed Free Fire Special Deals
INSERT INTO public.game_product_prices (game, package_id, package_name, package_type, quantity, price, currency, display_order) VALUES
  ('freefire', 'ff_sd1', 'Weekly Membership', 'special', 420, 187, '₹', 100),
  ('freefire', 'ff_sd2', 'Monthly Membership', 'special', 2100, 936, '₹', 101),
  ('freefire', 'ff_sd3', 'Level Up Pass Full', 'special', 0, 538, '₹', 102),
  ('freefire', 'ff_sd4', 'Weekly Lite Membership', 'special', 140, 63, '₹', 103);