-- ==============================================================================
-- PinIn: LISTING FEATURES & REPORT CONTENTS UPDATE FOR SUPABASE
-- ==============================================================================
-- Paste this script into your Supabase SQL Editor and click "RUN":
-- (Supabase Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. UPDATE / RECREATE `reports` TABLE WITH THE NEW REPORT REASONS
--    - description doesn't match product
--    - wrong product image
--    - blurry product image
--    - high price
--    - duplicate product
--    - other
CREATE TABLE IF NOT EXISTS public.reports (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    listing_id text NOT NULL,
    listing_title text,
    listing_price numeric DEFAULT 0,
    listing_image text,
    seller_id text,
    seller_name text,
    reporter_id text,
    reporter_name text,
    reporter_email text,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending',
    action_taken text,
    created_at timestamp with time zone DEFAULT now()
);

-- Ensure all columns exist in `reports`
DO $$
BEGIN
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS listing_id text;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS listing_title text;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS listing_price numeric DEFAULT 0;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS listing_image text;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS seller_id text;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS seller_name text;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reporter_id text;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reporter_name text;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reporter_email text;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reason text;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS details text;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS action_taken text;
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
END $$;

-- 2. ADD NEW MARKETPLACE COLUMNS TO `listings` TABLE:
--    - sold_by: Name or store displayed under "Sold by"
--    - delivery_estimation: Delivery estimate (e.g. '2 to 5 days')
--    - in_stock: 'yes' or 'no'
--    - warranty: 'yes' or 'no' (if marked 'yes', appears in listing)
--    - returns: 'yes' or 'no' (if marked 'yes', appears in listing)
--    - pay_in_person: 'yes' or 'no' (if marked 'yes', appears in listing)
--    - product_information: Info text written at Supabase appears in the app
--    - reviews: Optional custom JSON reviews array
DO $$
BEGIN
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS sold_by text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS delivery_estimation text DEFAULT '2 to 5 days';
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS in_stock text DEFAULT 'yes';
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS warranty text DEFAULT 'no';
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS returns text DEFAULT 'no';
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS pay_in_person text DEFAULT 'no';
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS product_information text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS reviews jsonb DEFAULT '[]'::jsonb;
END $$;

-- 3. ENABLE ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert reports" ON public.reports;
CREATE POLICY "Public can insert reports" ON public.reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view reports" ON public.reports;
CREATE POLICY "Public can view reports" ON public.reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read listings" ON public.listings;
CREATE POLICY "Public can read listings" ON public.listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update listings" ON public.listings;
CREATE POLICY "Public can update listings" ON public.listings FOR UPDATE USING (true);

-- 4. GRANT ACCESS
GRANT ALL ON TABLE public.reports TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.listings TO anon, authenticated, service_role;
