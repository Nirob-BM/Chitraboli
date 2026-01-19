-- Drop the existing SELECT policy that contains unreachable session code
DROP POLICY IF EXISTS "Cart items readable by owner or session" ON public.cart_items;

-- Create simplified SELECT policy without unused session header check
CREATE POLICY "Cart items readable by owner or session" 
ON public.cart_items 
FOR SELECT 
USING (
  (user_id = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Also clean up any INSERT/UPDATE/DELETE policies that might have similar session logic
DROP POLICY IF EXISTS "Cart items writable by owner or session" ON public.cart_items;

-- Create simplified INSERT policy
CREATE POLICY "Cart items insertable by owner" 
ON public.cart_items 
FOR INSERT 
WITH CHECK (
  (user_id = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create simplified UPDATE policy
DROP POLICY IF EXISTS "Cart items updatable by owner" ON public.cart_items;
CREATE POLICY "Cart items updatable by owner" 
ON public.cart_items 
FOR UPDATE 
USING (
  (user_id = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create simplified DELETE policy
DROP POLICY IF EXISTS "Cart items deletable by owner" ON public.cart_items;
CREATE POLICY "Cart items deletable by owner" 
ON public.cart_items 
FOR DELETE 
USING (
  (user_id = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);