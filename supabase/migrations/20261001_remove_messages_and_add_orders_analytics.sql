-- ==============================================================================
-- PinIn: REMOVE MESSAGES, ADD ORDERS & ANALYTICS TABLES
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

-- 1. DROP MESSAGES & CONVERSATIONS TABLES AS REQUESTED
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- 2. ADD BUYER & ORDER TRACKING COLUMNS TO `listings` TABLE
-- (Allows adding buyer/user name, buyer/user email, delivery, order number, date bought, item bought directly into a listing)
DO $$
BEGIN
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS buyer_name text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS buyer_email text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS delivery text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS order_number text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS date_bought text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS item_bought text;
END $$;

-- 3. CREATE DEDICATED `orders` TABLE
-- Holds buyer name, buyer email, seller name, delivery, order number, date bought, item bought, price
CREATE TABLE IF NOT EXISTS public.orders (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_number text NOT NULL UNIQUE,
    listing_id text REFERENCES public.listings(id) ON DELETE SET NULL,
    buyer_name text NOT NULL,
    buyer_email text NOT NULL,
    buyer_id text,
    seller_name text NOT NULL,
    seller_id text,
    delivery text NOT NULL,
    item_bought text NOT NULL,
    price numeric NOT NULL DEFAULT 0,
    date_bought timestamp with time zone DEFAULT now(),
    status text DEFAULT 'Completed',
    created_at timestamp with time zone DEFAULT now()
);

-- Index for fast order lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON public.orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON public.orders(listing_id);

-- 4. CREATE `most_searched_items` TABLE
CREATE TABLE IF NOT EXISTS public.most_searched_items (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    query text NOT NULL UNIQUE,
    search_count integer NOT NULL DEFAULT 1,
    category text,
    last_searched_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_most_searched_count ON public.most_searched_items(search_count DESC);

-- 5. CREATE `most_bought_items` TABLE
CREATE TABLE IF NOT EXISTS public.most_bought_items (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    item_title text NOT NULL UNIQUE,
    listing_id text,
    total_sold integer NOT NULL DEFAULT 1,
    total_revenue numeric NOT NULL DEFAULT 0,
    last_bought_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_most_bought_total_sold ON public.most_bought_items(total_sold DESC);

-- 6. CONFIGURE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.most_searched_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.most_bought_items ENABLE ROW LEVEL SECURITY;

-- Orders policies: public can read and insert
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Public can view orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update orders" ON public.orders;
CREATE POLICY "Public can update orders" ON public.orders FOR UPDATE USING (true);

-- Most searched items policies
DROP POLICY IF EXISTS "Public can view most_searched_items" ON public.most_searched_items;
CREATE POLICY "Public can view most_searched_items" ON public.most_searched_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert/update most_searched_items" ON public.most_searched_items;
CREATE POLICY "Public can insert/update most_searched_items" ON public.most_searched_items FOR ALL USING (true);

-- Most bought items policies
DROP POLICY IF EXISTS "Public can view most_bought_items" ON public.most_bought_items;
CREATE POLICY "Public can view most_bought_items" ON public.most_bought_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert/update most_bought_items" ON public.most_bought_items;
CREATE POLICY "Public can insert/update most_bought_items" ON public.most_bought_items FOR ALL USING (true);

-- 7. GRANT PERMISSIONS
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.most_searched_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.most_bought_items TO anon, authenticated, service_role;

-- 8. CONVENIENCE VIEWS FOR SUPABASE DASHBOARD
CREATE OR REPLACE VIEW public.view_orders_summary AS
SELECT 
    order_number,
    item_bought,
    price,
    buyer_name,
    buyer_email,
    seller_name,
    delivery,
    date_bought,
    status
FROM public.orders
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW public.view_popular_items_analytics AS
SELECT 
    'Search' as activity_type,
    query as item_or_query,
    search_count as metric_count,
    last_searched_at as last_activity
FROM public.most_searched_items
UNION ALL
SELECT 
    'Purchase' as activity_type,
    item_title as item_or_query,
    total_sold as metric_count,
    last_bought_at as last_activity
FROM public.most_bought_items
ORDER BY metric_count DESC;

GRANT SELECT ON TABLE public.view_orders_summary TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.view_popular_items_analytics TO anon, authenticated, service_role;
