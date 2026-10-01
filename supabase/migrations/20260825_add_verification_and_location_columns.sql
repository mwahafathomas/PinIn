-- Run this SQL in your Supabase SQL Editor to add the safety, verification, and image check columns
-- This adds the columns safely (IF NOT EXISTS) to both `listings` and `products` tables.

-- 1. Ensure `listings` table has all image verification & collection columns
DO $$
BEGIN
    -- Image check status (clean / stolen / suspicious / pending)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'listings') THEN
        ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_check_status text DEFAULT 'clean';
        ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_check_confidence numeric DEFAULT 0;
        ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS image_check_details jsonb DEFAULT '{}'::jsonb;
        
        -- Video verification (15s to 30s)
        ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS video_url text;
        ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS video_duration numeric;

        -- Meetup & Collection Location Pin
        ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS collection_lat numeric;
        ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS collection_lng numeric;
        ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS collection_suburb text;
        ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS collection_surburb text;
        ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS collection_address text;
    END IF;

    -- 2. Also ensure `products` table has the columns if you are using products
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_check_status text DEFAULT 'clean';
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_check_confidence numeric DEFAULT 0;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_check_details jsonb DEFAULT '{}'::jsonb;
        
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url text;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_duration numeric;

        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS collection_lat numeric;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS collection_lng numeric;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS collection_suburb text;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS collection_surburb text;
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS collection_address text;
    END IF;
END $$;
