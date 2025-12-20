-- Fix has_role function to prevent privilege escalation by requiring caller to only check their own roles
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
      AND _user_id = auth.uid()  -- Only allow checking own roles
  )
$$;

-- Update cart_items RLS policy for anonymous carts - protect by session_id
-- Drop existing policies first
DROP POLICY IF EXISTS "Cart items readable by owner" ON public.cart_items;
DROP POLICY IF EXISTS "Cart items insertable by owner" ON public.cart_items;
DROP POLICY IF EXISTS "Cart items updatable by owner" ON public.cart_items;
DROP POLICY IF EXISTS "Cart items deletable by owner" ON public.cart_items;

-- Recreate with better anonymous cart protection
CREATE POLICY "Cart items readable by owner or session" 
ON public.cart_items 
FOR SELECT 
USING (
  (user_id = auth.uid()) 
  OR (user_id IS NULL AND session_id = current_setting('request.headers', true)::json->>'x-session-id')
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Cart items insertable" 
ON public.cart_items 
FOR INSERT 
WITH CHECK (
  (user_id = auth.uid()) 
  OR (user_id IS NULL)
);

CREATE POLICY "Cart items updatable by owner" 
ON public.cart_items 
FOR UPDATE 
USING (
  (user_id = auth.uid()) 
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Cart items deletable by owner" 
ON public.cart_items 
FOR DELETE 
USING (
  (user_id = auth.uid()) 
  OR has_role(auth.uid(), 'admin')
);