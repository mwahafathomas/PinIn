-- =========================================================================
-- PININ: CONTACT US TOPICS & LISTING STOCK TYPE MIGRATION
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Create table for Contact Us topics
CREATE TABLE IF NOT EXISTS public.contact_topics (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Populate Contact Us topics
INSERT INTO public.contact_topics (name)
VALUES
    ('where is my order/ i want return'),
    ('item damaged'),
    ('wrong item received'),
    ('refund not received'),
    ('payment failed but money deducted'),
    ('can i change my order address'),
    ('size guide'),
    ('delete my account'),
    ('other')
ON CONFLICT (name) DO NOTHING;

-- 3. Enable Public Read Access for contact_topics
ALTER TABLE public.contact_topics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contact_topics' AND policyname = 'Allow public read access to contact topics'
    ) THEN
        CREATE POLICY "Allow public read access to contact topics"
            ON public.contact_topics FOR SELECT
            USING (true);
    END IF;
END $$;

-- 4. Add stock_type column to listings table
-- Write 'made to order' or 'in stock' in this column
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS stock_type TEXT DEFAULT 'in stock';

-- (Optional) If you also have products table:
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_type TEXT DEFAULT 'in stock';
