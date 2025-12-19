-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Orders readable by session or user" ON public.orders;

-- Create a proper SELECT policy that restricts access to order owners and admins
CREATE POLICY "Orders readable by owner or admin" 
ON public.orders 
FOR SELECT 
USING (
  -- Allow if session_id matches (for anonymous users tracking their order)
  session_id = current_setting('request.headers', true)::json->>'x-session-id'
  -- Or if user_id matches the authenticated user
  OR user_id = auth.uid()
  -- Or if the user is an admin
  OR has_role(auth.uid(), 'admin')
);