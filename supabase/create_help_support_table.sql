-- =========================================================================
-- PinIn Marketplace - Help & Support Questions and Answers Table
-- Run this in your Supabase SQL Editor (SQL Editor > New query > Run):
-- =========================================================================

-- 1. Create the help_support table for categories 3 to 9
CREATE TABLE IF NOT EXISTS public.help_support (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, 
    -- Allowed / Expected Categories:
    -- 'Help & Support'       (Category 3)
    -- 'Ordering'             (Category 4)
    -- 'Payments'             (Category 5)
    -- 'Delivery'             (Category 6)
    -- 'Cancellations'        (Category 7)
    -- 'Returns & Exchanges'  (Category 8)
    -- 'Sizing help'          (Category 9)
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_num INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.help_support ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow anyone (app users and visitors) to read the questions and answers
CREATE POLICY "Allow public read access to help_support"
ON public.help_support FOR SELECT
TO anon, authenticated
USING (true);

-- 4. Policy: Allow authenticated / service_role users full insert/update/delete access
CREATE POLICY "Allow write access to help_support"
ON public.help_support FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- 5. Helpful index for fast category filtering
CREATE INDEX IF NOT EXISTS idx_help_support_category ON public.help_support (category);

-- =========================================================================
-- How to add Questions & Answers in Supabase:
-- You can use the Supabase Table Editor (Table Editor > help_support > Insert row)
-- Or run SQL queries like:
--
-- INSERT INTO public.help_support (category, question, answer, order_num)
-- VALUES ('Ordering', 'Your question here', 'Your answer here', 1);
-- =========================================================================
