-- Create payment_transactions table for API Nepal payments
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  
  -- API Nepal identifiers
  identifier TEXT UNIQUE NOT NULL,
  api_transaction_id TEXT,
  
  -- Payment details
  amount NUMERIC NOT NULL,
  credits NUMERIC NOT NULL,
  currency TEXT DEFAULT 'NPR',
  
  -- Status tracking
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'pending', 'completed', 'failed', 'cancelled')),
  payment_gateway TEXT,
  
  -- API response data
  api_response JSONB,
  redirect_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for fast lookups
CREATE INDEX idx_payment_transactions_identifier ON public.payment_transactions(identifier);
CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.payment_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own transactions (for initiation)
CREATE POLICY "Users can insert own transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role can update all (for IPN webhook)
CREATE POLICY "Service role can update all transactions"
ON public.payment_transactions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.payment_transactions
FOR SELECT
USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to process completed payment (atomic credit addition)
CREATE OR REPLACE FUNCTION public.process_payment_completion(
  p_identifier TEXT,
  p_transaction_id TEXT,
  p_gateway TEXT,
  p_api_response JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_transaction payment_transactions%ROWTYPE;
  v_old_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Lock and get the transaction
  SELECT * INTO v_transaction
  FROM payment_transactions
  WHERE identifier = p_identifier
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Transaction not found');
  END IF;
  
  -- Check if already processed (idempotency)
  IF v_transaction.status = 'completed' THEN
    RETURN json_build_object('success', true, 'message', 'Already processed', 'already_processed', true);
  END IF;
  
  -- Get current balance
  SELECT balance INTO v_old_balance
  FROM profiles
  WHERE id = v_transaction.user_id;
  
  -- Add credits to user balance
  UPDATE profiles
  SET balance = COALESCE(balance, 0) + v_transaction.credits
  WHERE id = v_transaction.user_id
  RETURNING balance INTO v_new_balance;
  
  -- Update transaction status
  UPDATE payment_transactions
  SET 
    status = 'completed',
    api_transaction_id = p_transaction_id,
    payment_gateway = p_gateway,
    api_response = p_api_response,
    completed_at = now(),
    updated_at = now()
  WHERE identifier = p_identifier;
  
  -- Log activity
  INSERT INTO activity_logs (
    actor_id, actor_email, activity_type, action, description, target_type, target_id, metadata
  ) VALUES (
    v_transaction.user_id,
    v_transaction.user_email,
    'credit_added',
    'Online Payment Completed',
    FORMAT('Online payment of Rs.%s completed. %s credits added.', v_transaction.amount, v_transaction.credits),
    'payment_transaction',
    v_transaction.id,
    jsonb_build_object(
      'identifier', p_identifier,
      'amount', v_transaction.amount,
      'credits', v_transaction.credits,
      'gateway', p_gateway,
      'old_balance', v_old_balance,
      'new_balance', v_new_balance
    )
  );
  
  -- Create notification for user
  PERFORM create_user_notification(
    v_transaction.user_id,
    'Payment Successful',
    FORMAT('Your payment of Rs.%s has been received. %s credits added to your wallet.', v_transaction.amount, v_transaction.credits),
    'payment'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Payment processed successfully',
    'credits_added', v_transaction.credits,
    'new_balance', v_new_balance
  );
END;
$$;

-- Function to mark payment as failed/cancelled
CREATE OR REPLACE FUNCTION public.process_payment_failure(
  p_identifier TEXT,
  p_status TEXT,
  p_api_response JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_transaction payment_transactions%ROWTYPE;
BEGIN
  -- Get the transaction
  SELECT * INTO v_transaction
  FROM payment_transactions
  WHERE identifier = p_identifier
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Transaction not found');
  END IF;
  
  -- Check if already processed
  IF v_transaction.status IN ('completed', 'failed', 'cancelled') THEN
    RETURN json_build_object('success', true, 'message', 'Already processed');
  END IF;
  
  -- Update transaction status
  UPDATE payment_transactions
  SET 
    status = p_status,
    api_response = p_api_response,
    updated_at = now()
  WHERE identifier = p_identifier;
  
  -- Create notification for user
  PERFORM create_user_notification(
    v_transaction.user_id,
    'Payment Update',
    CASE 
      WHEN p_status = 'cancelled' THEN 'Your payment was cancelled. No credits were deducted.'
      ELSE 'Your payment could not be processed. Please try again.'
    END,
    'payment'
  );
  
  RETURN json_build_object('success', true, 'message', 'Payment status updated');
END;
$$;