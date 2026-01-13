-- Fix the permissive RLS policy on profile_audit_logs
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.profile_audit_logs;

-- Create a more secure policy that allows authenticated users to create audit logs for themselves
-- or admins to create for anyone
CREATE POLICY "Users can create their own audit logs"
  ON public.profile_audit_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));