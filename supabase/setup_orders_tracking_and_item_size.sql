-- ==============================================================================
-- PinIn: COMPLETE SUPABASE SQL SCRIPT FOR ORDERS, TRACKING & ITEM SIZE
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase project dashboard (https://supabase.com/dashboard)
-- 2. Click "SQL Editor" in the left navigation menu
-- 3. Click "New query", paste this entire script and click "Run"
-- ==============================================================================

-- 1. CREATE `orders` TABLE IF NOT ALREADY CREATED
CREATE TABLE IF NOT EXISTS public.orders (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_number text NOT NULL,
    username text NOT NULL DEFAULT 'PinIn Customer',
    user_email text NOT NULL DEFAULT 'customer@pinin.co.za',
    buyer_name text DEFAULT 'PinIn Customer',
    buyer_email text DEFAULT 'customer@pinin.co.za',
    buyer_id text,
    seller_name text NOT NULL DEFAULT 'PinIn Verified Seller',
    seller_id text,
    listing_id text,
    item_bought text NOT NULL DEFAULT 'Item',
    item_price numeric NOT NULL DEFAULT 0,
    price numeric NOT NULL DEFAULT 0,
    quantity integer NOT NULL DEFAULT 1,
    delivery text DEFAULT 'Standard Delivery',
    delivery_estimation text NOT NULL DEFAULT '2 to 5 days from order date',
    status text DEFAULT 'Being processed',
    delivery_status text DEFAULT 'Being processed',
    shipping_status text DEFAULT 'order_paid',
    package_info text DEFAULT 'Standard parcel',
    courier text DEFAULT 'PinIn Express',
    tracking_number text,
    latest_update text DEFAULT 'Order confirmed and being prepared',
    latest_update_time timestamp with time zone DEFAULT now(),
    recipient_name text,
    recipient_phone text,
    street_address_line1 text,
    street_address_line2 text,
    street_address_line3 text,
    city_town text,
    province text DEFAULT 'Gauteng',
    postal_code text,
    delivery_instructions text,
    date_bought text,
    items jsonb,
    images text[],
    created_at timestamp with time zone DEFAULT now()
);

-- 2. ENSURE ALL TRACKING & ORDER COLUMNS EXIST (If table already exists)
DO $$
BEGIN
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'Being processed';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'Being processed';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS package_info text DEFAULT 'Standard parcel';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier text DEFAULT 'PinIn Express';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_status text DEFAULT 'order_paid';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS latest_update text DEFAULT 'Order confirmed and being prepared';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS latest_update_time timestamp with time zone DEFAULT now();
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items jsonb;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS images text[];
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS username text DEFAULT 'PinIn Customer';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_email text DEFAULT 'customer@pinin.co.za';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_name text DEFAULT 'PinIn Customer';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_email text DEFAULT 'customer@pinin.co.za';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_id text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_name text DEFAULT 'PinIn Verified Seller';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS listing_id text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS item_bought text DEFAULT 'Item';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS item_price numeric DEFAULT 0;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_estimation text DEFAULT '2 to 5 days from order date';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS date_bought text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_name text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_phone text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS street_address_line1 text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS street_address_line2 text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS street_address_line3 text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS city_town text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS province text DEFAULT 'Gauteng';
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS postal_code text;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_instructions text;
END $$;

-- 3. ADD "item_size" COLUMN TO listings TABLE
ALTER TABLE IF EXISTS public.listings 
ADD COLUMN IF NOT EXISTS item_size text;

-- 4. CONFIGURE ROW LEVEL SECURITY (RLS) FOR orders
-- (Allows buyers to place orders and view orders without being blocked by RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Public can view orders" ON public.orders 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update orders" ON public.orders;
CREATE POLICY "Public can update orders" ON public.orders 
FOR UPDATE USING (true);

-- 5. GRANT PERMISSIONS TO ANON AND AUTHENTICATED ROLES
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;

-- ==============================================================================
-- HOW TO UPDATE AN ORDER'S TRACKING AND STATUS IN SUPABASE:
-- ==============================================================================
-- To update an order's status, package size, courier, tracking number, or notes:
--
-- UPDATE public.orders
-- SET
--   status = 'Out for delivery',             -- e.g. 'Being processed', 'Out for delivery', 'Delivered'
--   shipping_status = 'shipped',             -- 'order_paid', 'shipped', or 'delivered'
--   courier = 'The Courier Guy',             -- Courier company name
--   tracking_number = 'TCG94821039',         -- Tracking number
--   package_info = 'Medium box (1.5 kg)',     -- Packaging size
--   latest_update = 'Parcel picked up by courier and on its way to your address',
--   latest_update_time = now()
-- WHERE order_number = 'PIN-XXXXXX';
