-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Orders insertable" ON public.orders;

-- Create a more restrictive INSERT policy
-- Orders can only be inserted by authenticated users for themselves OR by edge functions (using service role)
-- Since our edge function uses SUPABASE_SERVICE_ROLE_KEY, it bypasses RLS
-- This policy restricts direct client inserts to only allow authenticated users to create orders for themselves
CREATE POLICY "Authenticated users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  -- Allow authenticated users to create orders for themselves
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  -- OR allow anonymous orders that have session_id (must be null user_id)
  OR (auth.uid() IS NULL AND user_id IS NULL AND session_id IS NOT NULL)
);

-- Note: The edge function uses service role key which bypasses RLS entirely,
-- so all orders will be created through the secure edge function