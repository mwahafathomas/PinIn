-- =========================================================================
-- PinIn Marketplace - Refunds & Order Cancellation Migration
-- Run this in your Supabase SQL Editor (SQL Editor > New query > Run):
-- =========================================================================

-- 1. Create the `refund_requests` table to store order cancellation details
CREATE TABLE IF NOT EXISTS public.refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL,
    order_id TEXT,
    user_email TEXT NOT NULL,
    user_name TEXT,
    item_bought TEXT,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'Processing',
    reason TEXT DEFAULT 'Order cancelled by user',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) on refund_requests
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to refund_requests"
ON public.refund_requests FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert to refund_requests"
ON public.refund_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow update to refund_requests"
ON public.refund_requests FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_refund_requests_order_number ON public.refund_requests (order_number);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_email ON public.refund_requests (user_email);


-- 2. Create the `order_cancellation_info` table where you write the message explaining what happens when you cancel an order
CREATE TABLE IF NOT EXISTS public.order_cancellation_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT DEFAULT 'What happens when you cancel an order',
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.order_cancellation_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to order_cancellation_info"
ON public.order_cancellation_info FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow write access to order_cancellation_info"
ON public.order_cancellation_info FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- 3. Insert initial explanation message (You can edit this anytime in Supabase Table Editor > order_cancellation_info)
INSERT INTO public.order_cancellation_info (title, message)
VALUES (
    'What happens when you cancel an order',
    'When you cancel an order, your purchase will immediately stop processing and will not be prepared or shipped.

A full refund will appear in your PinIn wallet in less than 24 hours.

When you withdraw your wallet balance, the money will be sent directly to the bank account that made the purchase (funds take 2 - 5 business days to reflect).

Once confirmed, this cancellation cannot be undone.'
);
