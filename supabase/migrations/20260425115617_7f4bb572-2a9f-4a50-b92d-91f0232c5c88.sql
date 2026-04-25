
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.game_page_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL UNIQUE,
  title text,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.game_page_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active game page descriptions"
  ON public.game_page_descriptions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage game page descriptions"
  ON public.game_page_descriptions
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'sub_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'sub_admin'::app_role)
  );

CREATE TRIGGER trg_game_page_descriptions_set_updated_at
  BEFORE UPDATE ON public.game_page_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

INSERT INTO public.game_page_descriptions (page_slug, title, description) VALUES
  ('freefire', 'Free Fire Diamonds', ''),
  ('mobile-legends', 'Mobile Legends Diamonds', ''),
  ('pubg-mobile', 'PUBG Mobile UC', ''),
  ('roblox', 'Roblox Robux', ''),
  ('tiktok', 'TikTok Coins', ''),
  ('youtube', 'YouTube Premium', ''),
  ('netflix', 'Netflix Subscriptions', ''),
  ('chatgpt', 'ChatGPT Plus', ''),
  ('garena-shell', 'Garena Shells', ''),
  ('smile-coin', 'Smile Coin', ''),
  ('unipin-uc', 'Unipin UC', ''),
  ('logo-design', 'Logo Design', ''),
  ('banner-design', 'Banner Design', ''),
  ('thumbnail-design', 'Thumbnail Design', ''),
  ('post-design', 'Post Design', '')
ON CONFLICT (page_slug) DO NOTHING;
