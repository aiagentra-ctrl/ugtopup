
-- ============================================
-- Phase 1: Dynamic Products, Categories, Offers
-- ============================================

-- 1. Product Categories table
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON public.product_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.product_categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 2. Dynamic Products table
CREATE TABLE public.dynamic_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  link text,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  price numeric DEFAULT 0,
  discount_price numeric,
  features jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}',
  plans jsonb DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dynamic_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.dynamic_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage dynamic products" ON public.dynamic_products
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 3. Offers table
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  image_url text,
  offer_type text NOT NULL DEFAULT 'flash_sale',
  timer_enabled boolean NOT NULL DEFAULT false,
  timer_type text DEFAULT 'none',
  timer_end_date timestamptz,
  product_link text,
  custom_icon_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  show_on_homepage boolean NOT NULL DEFAULT true,
  show_on_product_page boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active offers" ON public.offers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage offers" ON public.offers
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 4. Updated_at triggers
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_dynamic_products_updated_at
  BEFORE UPDATE ON public.dynamic_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.dynamic_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;

-- 6. Product images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND public.is_admin());

-- 7. Seed categories from current hardcoded tabs
INSERT INTO public.product_categories (name, slug, display_order) VALUES
  ('TOPUP', 'topup', 1),
  ('VOUCHER', 'voucher', 2),
  ('SUBSCRIPTION', 'subscription', 3),
  ('DESIGN', 'design', 4);

-- 8. Seed products from current hardcoded ProductTabs data
INSERT INTO public.dynamic_products (title, image_url, link, category_id, display_order) VALUES
  ('Free Fire Diamond', 'https://i.ibb.co/C5spS0zQ/SAVE-20251108-163350.jpg', '/product/freefire-diamond', (SELECT id FROM product_categories WHERE slug='topup'), 1),
  ('Mobile Legends Diamond', 'https://i.ibb.co/KjW0Ptdt/SAVE-20251108-180521.jpg', '/product/mobile-legends', (SELECT id FROM product_categories WHERE slug='topup'), 2),
  ('TikTok Coins', 'https://i.ibb.co/H0FwhXn/SAVE-20251108-180527.jpg', '/product/tiktok-coins', (SELECT id FROM product_categories WHERE slug='topup'), 3),
  ('Roblox Robux', 'https://i.ibb.co/0pYYFxyL/SAVE-20251108-163423.jpg', '/product/roblox-topup', (SELECT id FROM product_categories WHERE slug='topup'), 4),
  ('PUBG Mobile UC', 'https://i.ibb.co/SDDFYS1T/SAVE-20251108-163359.jpg', '/product/pubg-mobile', (SELECT id FROM product_categories WHERE slug='topup'), 5),
  ('Unipin UC', '/assets/product-unipin.jpg', '/product/unipin-uc', (SELECT id FROM product_categories WHERE slug='voucher'), 1),
  ('Smile Coin', '/assets/product-smile.jpg', '/product/smile-coin', (SELECT id FROM product_categories WHERE slug='voucher'), 2),
  ('Garena Shell', '/assets/product-garena.jpg', '/product/garena-shell', (SELECT id FROM product_categories WHERE slug='voucher'), 3),
  ('ChatGPT Plus', '/assets/product-chatgpt.jpg', '/product/chatgpt-plus', (SELECT id FROM product_categories WHERE slug='subscription'), 1),
  ('YouTube Premium', '/assets/product-youtube.jpg', '/product/youtube-premium', (SELECT id FROM product_categories WHERE slug='subscription'), 2),
  ('Netflix Subscription', '/assets/product-netflix.jpg', '/product/netflix', (SELECT id FROM product_categories WHERE slug='subscription'), 3),
  ('Logo Design', 'https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg', '/product/logo-design', (SELECT id FROM product_categories WHERE slug='design'), 1),
  ('Post Design', 'https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg', '/product/post-design', (SELECT id FROM product_categories WHERE slug='design'), 2),
  ('Banner Design', 'https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg', '/product/banner-design', (SELECT id FROM product_categories WHERE slug='design'), 3),
  ('Thumbnail Design', 'https://i.ibb.co/MxC1sGxQ/SAVE-20251108-163259.jpg', '/product/thumbnail-design', (SELECT id FROM product_categories WHERE slug='design'), 4);
