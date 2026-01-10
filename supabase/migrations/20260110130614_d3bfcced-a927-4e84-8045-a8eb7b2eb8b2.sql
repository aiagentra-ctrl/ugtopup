-- Fix RLS policy for payment_transactions updates (service role bypass happens automatically)
-- Drop the overly permissive policy and create a proper one
DROP POLICY IF EXISTS "Service role can update all transactions" ON public.payment_transactions;

-- Only allow updates via the database functions (which use SECURITY DEFINER)
-- Regular users cannot update transactions directly
CREATE POLICY "Users cannot update transactions directly"
ON public.payment_transactions
FOR UPDATE
USING (false)
WITH CHECK (false);