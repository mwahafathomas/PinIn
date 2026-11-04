-- SQL query to create 'refunds' column in 'profiles' table at Supabase
-- Paste and run this in your Supabase SQL Editor:

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS refunds NUMERIC(10, 2) DEFAULT 0.00;

-- Optional: Comments & documentation
COMMENT ON COLUMN public.profiles.refunds IS 'Stores user wallet/refunds balance in Rands';
