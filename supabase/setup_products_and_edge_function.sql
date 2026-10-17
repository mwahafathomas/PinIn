-- ==============================================================================
-- PinIn PRODUCTS TABLE & SYNC-DUMMYJSON EDGE FUNCTION SETUP
-- Project: ygkyxxrrfcvypcvmnzke
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

-- 1. Ensure `products` table exists with all required columns
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_sku text UNIQUE,
    title text NOT NULL,
    description text,
    cost_price numeric,
    selling_price numeric NOT NULL,
    stock_quantity integer NOT NULL DEFAULT 0,
    image_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Ensure UNIQUE constraint exists on supplier_sku for upsert (onConflict)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_supplier_sku_key'
    ) THEN
        ALTER TABLE public.products ADD CONSTRAINT products_supplier_sku_key UNIQUE (supplier_sku);
    END IF;
END $$;

-- 3. Row Level Security (RLS) configuration
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all products in inventory
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products"
ON public.products
FOR SELECT
USING (true);

-- Allow service role and functions to insert/update/upsert products
DROP POLICY IF EXISTS "Allow sync functions upsert products" ON public.products;
CREATE POLICY "Allow sync functions upsert products"
ON public.products
FOR ALL
USING (true)
WITH CHECK (true);
