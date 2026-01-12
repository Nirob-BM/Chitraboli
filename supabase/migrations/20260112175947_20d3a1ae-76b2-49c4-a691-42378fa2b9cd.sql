-- Fix the has_role function to allow admins to check other users' roles
-- while still preventing non-admins from enumerating roles

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (
        _user_id = auth.uid()  -- Users can check their own role
        OR EXISTS (  -- Admins can check any user's role
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
  )
$$;

-- Drop the overly permissive RLS policy for contact_messages INSERT
-- Since we now use an edge function with service role key, direct inserts are blocked
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON contact_messages;

-- Create a new policy that only allows service role (edge function) to insert
-- For public table access, the edge function uses service role key which bypasses RLS
-- Regular users cannot insert directly - they must use the edge function