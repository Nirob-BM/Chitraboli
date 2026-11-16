DROP POLICY IF EXISTS "Media is publicly readable" ON public.media_library;
DROP POLICY IF EXISTS "Admins can manage media" ON public.media_library;
CREATE POLICY "Admins can manage media"
ON public.media_library
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
REVOKE ALL ON public.media_library FROM anon;
GRANT ALL ON public.media_library TO authenticated;
GRANT ALL ON public.media_library TO service_role;

DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
DROP POLICY IF EXISTS "Customers can read public review fields" ON public.reviews;
DROP POLICY IF EXISTS "Admins can read all reviews" ON public.reviews;
CREATE POLICY "Customers can read public review fields"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (user_id IS NOT NULL);
CREATE POLICY "Admins can read all reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
REVOKE ALL ON public.reviews FROM anon;
GRANT SELECT (id, reviewer_name, rating, review_text, images, product_id, created_at) ON public.reviews TO anon;
GRANT ALL ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;