-- Add RLS policies for reviews table - allow authenticated users to create reviews
-- and admins to manage them

-- Allow authenticated users to create reviews
CREATE POLICY "Users can create reviews" 
ON public.reviews 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow admins to update reviews
CREATE POLICY "Admins can update reviews" 
ON public.reviews 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete reviews
CREATE POLICY "Admins can delete reviews" 
ON public.reviews 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'));