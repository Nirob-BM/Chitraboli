DROP POLICY IF EXISTS "Customers can read public review fields" ON public.reviews;
CREATE OR REPLACE VIEW public.public_reviews WITH (security_barrier = true) AS
SELECT id, reviewer_name, rating, review_text, images, product_id, created_at
FROM public.reviews
WHERE is_public IS TRUE;
GRANT SELECT ON public.public_reviews TO anon, authenticated;
REVOKE ALL ON public.public_reviews FROM public;
GRANT SELECT ON public.public_reviews TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;