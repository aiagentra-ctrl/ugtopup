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

CREATE TABLE public.tournament_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  message TEXT NOT NULL,
  image_url TEXT,
  variant TEXT NOT NULL DEFAULT 'warning',
  cta_text TEXT,
  cta_link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tournament_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tournament banners"
  ON public.tournament_banners FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert tournament banners"
  ON public.tournament_banners FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update tournament banners"
  ON public.tournament_banners FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete tournament banners"
  ON public.tournament_banners FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER tournament_banners_set_updated_at
  BEFORE UPDATE ON public.tournament_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_timestamp();

INSERT INTO public.tournament_banners (title, message, variant, is_active, display_order)
VALUES ('Beta Notice', 'Tournament feature is still in development phase. Use at your own risk.', 'warning', true, 0);