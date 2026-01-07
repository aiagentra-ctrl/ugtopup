-- Create banner_slides table
CREATE TABLE public.banner_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text,
  subtitle text,
  cta_text text,
  display_order integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banner_slides ENABLE ROW LEVEL SECURITY;

-- Public users can view active slides
CREATE POLICY "Anyone can view active banner slides"
ON public.banner_slides
FOR SELECT
USING (is_active = true);

-- Admins can manage all banner slides
CREATE POLICY "Admins can manage banner slides"
ON public.banner_slides
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_banner_slides_updated_at
BEFORE UPDATE ON public.banner_slides
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Enable real-time
ALTER TABLE public.banner_slides REPLICA IDENTITY FULL;

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banner-images',
  'banner-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Storage policies for banner images
CREATE POLICY "Anyone can view banner images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banner-images');

CREATE POLICY "Admins can upload banner images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'banner-images' AND is_admin());

CREATE POLICY "Admins can update banner images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'banner-images' AND is_admin());

CREATE POLICY "Admins can delete banner images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'banner-images' AND is_admin());

-- Insert default slides from current hardcoded data
INSERT INTO public.banner_slides (image_url, title, subtitle, cta_text, display_order, is_active)
VALUES 
  ('https://i.ibb.co/8g6kkFqj/SAVE-20251108-163252.jpg', 'UG GAMING STORE', 'Best Price • 100% Trusted • Instant Delivery', 'Order Now', 1, true),
  ('https://i.ibb.co/JW63HtJt/SAVE-20251108-163202.jpg', 'TOP-UP YOUR FAVORITE GAMES', 'Fast & Secure • Best Prices • 24/7 Support', 'Shop Now', 2, true),
  ('https://i.ibb.co/tp2RLMF0/SAVE-20251108-163211.jpg', 'INSTANT DELIVERY', 'Get your game credits instantly', 'Order Now', 3, true);