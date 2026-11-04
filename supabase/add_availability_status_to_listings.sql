-- =========================================================================
-- PinIn Marketplace - Listings Availability Migration
-- Run this in your Supabase SQL Editor:
-- =========================================================================

-- 1. Add availability_status column to public.listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available';

-- 2. Optional: Add available_date column if you want to set custom restock dates
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS available_date TEXT;

-- 3. Set existing listings to 'available'
UPDATE public.listings
SET availability_status = 'available'
WHERE availability_status IS NULL;

-- How to use:
-- • To make an item available again in the app:
--   UPDATE public.listings SET availability_status = 'available' WHERE id = '<item_id>';
-- • To manually mark an item out of stock:
--   UPDATE public.listings SET availability_status = 'out of stock' WHERE id = '<item_id>';
