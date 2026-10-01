-- ==============================================================================
-- PinIn: FIX & MAKE ALL SUPABASE LISTINGS VISIBLE IN THE APP
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run)
-- ==============================================================================

-- 1. Safely add the columns first so Postgres knows they exist
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';

-- 2. Now that the columns exist, mark all listings as approved
UPDATE public.listings SET is_approved = true, status = 'approved';

-- 3. Ensure Row Level Security allows public read access for all listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view listings" ON public.listings;
CREATE POLICY "Public can view listings"
ON public.listings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public can insert listings" ON public.listings;
CREATE POLICY "Public can insert listings"
ON public.listings FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update listings" ON public.listings;
CREATE POLICY "Public can update listings"
ON public.listings FOR UPDATE
USING (true);

GRANT ALL ON TABLE public.listings TO anon, authenticated, service_role;
