-- ==============================================================================
-- PinIn: SUPABASE SQL SCRIPT
-- ==============================================================================
-- Instructions:
-- 1. Go to your Supabase project dashboard (https://supabase.com/dashboard)
-- 2. Click "SQL Editor" in the left navigation sidebar
-- 3. Click "New query", paste this entire script and click "Run"
-- ==============================================================================

-- 1. DROP MESSAGES & CONVERSATIONS TABLES (As requested)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- 2. CREATE `orders` TABLE WITH EXACT DETAILS OF AN ITEM JUST BOUGHT:
--    - username
--    - user email
--    - order number
--    - date bought
--    - item bought
--    - item price
--    - seller name
--    - quantity
--    - delivery estimation (shows 2 days to 5 days from the order date)
CREATE TABLE IF NOT EXISTS public.orders (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username text NOT NULL,
    user_email text NOT NULL,
    order_number text NOT NULL,
    date_bought text NOT NULL,
    item_bought text NOT NULL,
    item_price numeric NOT NULL DEFAULT 0,
    seller_name text NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    delivery_estimation text NOT NULL DEFAULT '2 to 5 days from order date',
    delivery text,
    buyer_name text,
    buyer_email text,
    buyer_id text,
    seller_id text,
    price numeric DEFAULT 0,
    listing_id text,
    status text DEFAULT 'Completed',
    created_at timestamp with time zone DEFAULT now()
);

-- Ensure all columns exist if the table was previously created:
DO $$
BEGIN
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS username text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_email text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS date_bought text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS item_bought text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS item_price numeric DEFAULT 0;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_name text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_estimation text DEFAULT '2 to 5 days from order date';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_name text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_email text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_id text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS listing_id text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'Completed';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
END $$;

-- 3. ADD TRACKING COLUMNS TO `listings` TABLE:
--    (buyer/user name, buyer/user email, seller name, delivery, order number, date bought, item bought, price)
DO $$
BEGIN
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS buyer_name text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS buyer_email text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS seller_name text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS delivery text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS order_number text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS date_bought text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS item_bought text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS price numeric;
END $$;

-- 4. CREATE `most_searched_items` TABLE
CREATE TABLE IF NOT EXISTS public.most_searched_items (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    query text NOT NULL UNIQUE,
    search_count integer NOT NULL DEFAULT 1,
    category text,
    last_searched_at timestamp with time zone DEFAULT now()
);

-- 5. CREATE `most_bought_items` TABLE
CREATE TABLE IF NOT EXISTS public.most_bought_items (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    item_title text NOT NULL UNIQUE,
    listing_id text,
    total_sold integer NOT NULL DEFAULT 1,
    total_revenue numeric NOT NULL DEFAULT 0,
    last_bought_at timestamp with time zone DEFAULT now()
);

-- 6. CONFIGURE ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.most_searched_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.most_bought_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Public can view orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update orders" ON public.orders;
CREATE POLICY "Public can update orders" ON public.orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public access to most_searched_items" ON public.most_searched_items;
CREATE POLICY "Public access to most_searched_items" ON public.most_searched_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Public access to most_bought_items" ON public.most_bought_items;
CREATE POLICY "Public access to most_bought_items" ON public.most_bought_items FOR ALL USING (true);

-- 7. GRANT PERMISSIONS
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.most_searched_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.most_bought_items TO anon, authenticated, service_role;
