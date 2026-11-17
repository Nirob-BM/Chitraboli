ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;
DROP POLICY IF EXISTS "Customers can read public review fields" ON public.reviews;
CREATE POLICY "Customers can read public review fields"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (is_public IS TRUE);
REVOKE SELECT ON public.reviews FROM anon;
GRANT SELECT (id, reviewer_name, rating, review_text, images, product_id, created_at, is_public) ON public.reviews TO anon;
REVOKE SELECT (user_id) ON public.reviews FROM authenticated;
COMMENT ON COLUMN public.reviews.is_public IS 'Controls whether a customer review appears on public pages.';