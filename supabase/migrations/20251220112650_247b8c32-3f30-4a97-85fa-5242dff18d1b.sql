-- Fix reviews INSERT policy to require authentication
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;

CREATE POLICY "Authenticated users can create reviews" 
ON public.reviews 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);