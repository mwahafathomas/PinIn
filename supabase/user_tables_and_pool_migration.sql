-- ==============================================================================
-- PinIn Marketplace: Orders, Tracking Pool, Refunds, Returns & Activity Tables
-- Run this in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. ORDER & TRACKING NUMBERS POOL TABLE
-- Admin writes order numbers and tracking numbers here.
-- The app automatically claims available numbers when an order is created.
CREATE TABLE IF NOT EXISTS public.order_tracking_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_index TEXT,                 -- e.g. 'order 1', 'order 2', 'order 3'
    order_number TEXT NOT NULL UNIQUE, -- e.g. 'PIN-100234'
    tracking_number TEXT NOT NULL UNIQUE, -- e.g. 'TRK-984210'
    status TEXT NOT NULL DEFAULT 'available', -- 'available' or 'used'
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant fetching of available pool items
CREATE INDEX IF NOT EXISTS idx_order_tracking_pool_status 
ON public.order_tracking_pool(status);

-- Sample starter pool entries (feel free to edit or add your own)
INSERT INTO public.order_tracking_pool (order_index, order_number, tracking_number, status)
VALUES 
    ('order 1', 'PIN-800101', 'TRK-ZA-9011', 'available'),
    ('order 2', 'PIN-800102', 'TRK-ZA-9012', 'available'),
    ('order 3', 'PIN-800103', 'TRK-ZA-9013', 'available'),
    ('order 4', 'PIN-800104', 'TRK-ZA-9014', 'available'),
    ('order 5', 'PIN-800105', 'TRK-ZA-9015', 'available')
ON CONFLICT (order_number) DO NOTHING;


-- 2. GENDER COLUMN IN LISTINGS AND PRODUCTS
-- Write 'men' or 'women' (or 'unisex') here to show items under Women's or Men's in the app.
ALTER TABLE IF EXISTS public.listings 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'women';

ALTER TABLE IF EXISTS public.products 
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'women';


-- 3. REFUNDS HISTORY TABLE
-- Logs all user withdrawal requests and refund records
CREATE TABLE IF NOT EXISTS public.refunds_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_number TEXT,
    order_number TEXT,
    user_email TEXT,
    user_id TEXT,
    user_name TEXT,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Requested',
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_history_user_email 
ON public.refunds_history(user_email);


-- 4. RETURN REASONS TABLE
-- Captures user return reasons: Wrong size, Item looks different from pictures, 
-- Wrong item received, Damaged, Other (with custom reason text).
CREATE TABLE IF NOT EXISTS public.return_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT,
    user_email TEXT,
    user_name TEXT,
    item_bought TEXT,
    reason TEXT NOT NULL,
    other_reason_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. USER CART ITEMS TABLE
-- Stores items currently placed in user carts
CREATE TABLE IF NOT EXISTS public.user_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    user_email TEXT,
    listing_id TEXT NOT NULL,
    title TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 1,
    image_url TEXT,
    size TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_cart_items_user_id 
ON public.user_cart_items(user_id);


-- 6. USER SAVED ITEMS TABLE
-- Tracks items saved/favorited by users
CREATE TABLE IF NOT EXISTS public.user_saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    user_email TEXT,
    listing_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_saved_items_user_id 
ON public.user_saved_items(user_id);


-- 7. ORDERS HISTORY TABLE
-- Preserves full order history records
CREATE TABLE IF NOT EXISTS public.orders_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL,
    user_email TEXT,
    user_id TEXT,
    buyer_name TEXT,
    item_bought TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Order placed',
    delivery TEXT,
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_history_email 
ON public.orders_history(user_email);


-- 8. LISTINGS USER VIEWS TABLE
-- Tracks listings viewed by users
CREATE TABLE IF NOT EXISTS public.listing_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    user_email TEXT,
    listing_id TEXT NOT NULL,
    listing_title TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id 
ON public.listing_views(listing_id);


-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.order_tracking_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- Allow public read & claim on order tracking pool
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow access to order_tracking_pool') THEN
        CREATE POLICY "Allow access to order_tracking_pool" ON public.order_tracking_pool
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Allow public read & write on refunds_history
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow access to refunds_history') THEN
        CREATE POLICY "Allow access to refunds_history" ON public.refunds_history
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Allow public read & write on return_reasons
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow access to return_reasons') THEN
        CREATE POLICY "Allow access to return_reasons" ON public.return_reasons
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Allow public read & write on user_cart_items
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow access to user_cart_items') THEN
        CREATE POLICY "Allow access to user_cart_items" ON public.user_cart_items
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Allow public read & write on user_saved_items
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow access to user_saved_items') THEN
        CREATE POLICY "Allow access to user_saved_items" ON public.user_saved_items
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Allow public read & write on orders_history
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow access to orders_history') THEN
        CREATE POLICY "Allow access to orders_history" ON public.orders_history
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Allow public read & write on listing_views
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow access to listing_views') THEN
        CREATE POLICY "Allow access to listing_views" ON public.listing_views
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;


-- ==============================================================================
-- 9. DELIVERY METHODS TABLE
-- Update how much each delivery method costs (Door to door & PAXI)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,          -- 'Door to door', 'PAXI'
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial prices
INSERT INTO public.delivery_methods (name, price)
VALUES 
    ('Door to door', 60.00),
    ('PAXI', 40.00)
ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price;

ALTER TABLE public.delivery_methods ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow access to delivery_methods') THEN
        CREATE POLICY "Allow access to delivery_methods" ON public.delivery_methods
            FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

