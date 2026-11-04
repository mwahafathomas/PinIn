-- ==============================================================================
-- PinIn: ADD SOUTH AFRICAN PROVINCES SCRIPT FOR SUPABASE
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase project dashboard (https://supabase.com/dashboard)
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New query", paste this entire script and click "Run"
-- ==============================================================================

-- 1. Ensure `orders` table has `province` column
ALTER TABLE IF EXISTS public.orders 
ADD COLUMN IF NOT EXISTS province text DEFAULT 'Gauteng';

-- 2. Ensure `profiles` table has `province` column
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS province text DEFAULT 'Gauteng';

-- 3. Create `provinces` reference table with all 9 South African provinces
CREATE TABLE IF NOT EXISTS public.provinces (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL
);

-- 4. Insert all requested provinces
INSERT INTO public.provinces (name) VALUES
  ('Eastern Cape'),
  ('Free State'),
  ('Gauteng'),
  ('KwaZulu-Natal'),
  ('Limpopo'),
  ('Mpumalanga'),
  ('North West'),
  ('Northern Cape'),
  ('Western Cape')
ON CONFLICT (name) DO NOTHING;
