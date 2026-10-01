-- ==============================================================================
-- PinIn CLEAN SUPABASE LISTINGS TABLE & CLEANUP SETUP
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

-- 1. Remove unwanted video & auto image check columns (CLEANUP)
ALTER TABLE public.listings DROP COLUMN IF EXISTS video_url;
ALTER TABLE public.listings DROP COLUMN IF EXISTS video_duration;
ALTER TABLE public.listings DROP COLUMN IF EXISTS image_check_status;
ALTER TABLE public.listings DROP COLUMN IF EXISTS image_check_confidence;
ALTER TABLE public.listings DROP COLUMN IF EXISTS image_check_details;
ALTER TABLE public.listings DROP COLUMN IF EXISTS collection_surburb;

-- 2. Create or verify the clean `listings` table
CREATE TABLE IF NOT EXISTS public.listings (
    id text PRIMARY KEY,
    title text NOT NULL,
    location text,
    price numeric NOT NULL DEFAULT 0,
    original_price numeric,
    category text NOT NULL,
    condition text NOT NULL DEFAULT 'Good',
    image_url text NOT NULL,
    additional_images text[] DEFAULT ARRAY[]::text[],
    seller_id text NOT NULL,
    seller_name text NOT NULL,
    seller_avatar text,
    seller_rating numeric DEFAULT 5.0,
    seller_review_count integer DEFAULT 0,
    seller_joined_date text,
    seller_response_rate text,
    description text NOT NULL,
    dimensions text,
    material text,
    brand text,
    posted_at text,
    status text DEFAULT 'pending',
    is_approved boolean DEFAULT false,
    rejection_reason text,
    latitude numeric,
    longitude numeric,
    lat numeric,
    lng numeric,
    collection_lat numeric,
    collection_lng numeric,
    collection_suburb text,
    collection_address text,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Add standard columns safely if the table already exists
DO $$
BEGIN
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS id text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS title text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS location text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS original_price numeric;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS category text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS condition text DEFAULT 'Good';
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_url text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS additional_images text[] DEFAULT ARRAY[]::text[];
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS seller_id text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS seller_name text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS seller_avatar text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS seller_rating numeric DEFAULT 5.0;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS seller_review_count integer DEFAULT 0;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS seller_joined_date text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS seller_response_rate text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS description text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS dimensions text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS material text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS brand text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS posted_at text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS rejection_reason text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS latitude numeric;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS longitude numeric;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS lat numeric;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS lng numeric;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS collection_lat numeric;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS collection_lng numeric;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS collection_suburb text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS collection_address text;
    ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
END $$;

-- 4. Configure Row Level Security (RLS) policies
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view listings" ON public.listings;
CREATE POLICY "Public can view listings"
ON public.listings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert listings" ON public.listings;
CREATE POLICY "Users can insert listings"
ON public.listings FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their listings" ON public.listings;
CREATE POLICY "Users can update their listings"
ON public.listings FOR UPDATE
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their listings" ON public.listings;
CREATE POLICY "Users can delete their listings"
ON public.listings FOR DELETE
USING (true);

GRANT ALL ON TABLE public.listings TO anon;
GRANT ALL ON TABLE public.listings TO authenticated;
GRANT ALL ON TABLE public.listings TO service_role;
