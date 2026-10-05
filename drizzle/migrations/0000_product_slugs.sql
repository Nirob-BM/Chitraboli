ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.slugify(_text text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(_text,'')), '[^a-z0-9]+', '-', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.set_product_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE base text; candidate text; n int := 1;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND NEW.name IS DISTINCT FROM OLD.name AND NEW.slug = OLD.slug) THEN
    base := public.slugify(NEW.name);
  ELSE
    base := public.slugify(NEW.slug);
  END IF;
  IF base = '' THEN base := 'product'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = candidate AND id <> NEW.id) LOOP
    n := n + 1; candidate := base || '-' || n;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS set_product_slug_trg ON public.products;
CREATE TRIGGER set_product_slug_trg BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_product_slug();

UPDATE public.products SET slug = NULL WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products(slug);