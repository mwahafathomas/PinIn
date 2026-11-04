-- ==============================================================================
-- PinIn: SUPABASE SQL SCRIPT FOR INVOICES & BUSINESS INFO
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase project dashboard (https://supabase.com/dashboard)
-- 2. Click "SQL Editor" in the left navigation sidebar
-- 3. Click "New query", paste this entire script and click "Run"
-- ==============================================================================

-- 1. CREATE `business_info` TABLE (For App Icon, Business Name, Address, Tel, VAT No, REG No, Website)
CREATE TABLE IF NOT EXISTS public.business_info (
    id text PRIMARY KEY DEFAULT 'default',
    app_icon_url text DEFAULT '/PinIn-app-icon.png',
    business_name text DEFAULT 'PinIn (Pty) Ltd',
    address text DEFAULT '100 West Street, Sandton, Johannesburg, 2196',
    telephone_number text DEFAULT '+27 (0) 11 883 0000',
    vat_no text DEFAULT '4920192834',
    reg_no text DEFAULT '2023/123456/07',
    website text DEFAULT 'www.pinin.co.za',
    updated_at timestamp with time zone DEFAULT now()
);

-- Ensure all columns exist if table was already created
DO $$
BEGIN
    ALTER TABLE public.business_info ADD COLUMN IF NOT EXISTS app_icon_url text DEFAULT '/PinIn-app-icon.png';
    ALTER TABLE public.business_info ADD COLUMN IF NOT EXISTS business_name text DEFAULT 'PinIn (Pty) Ltd';
    ALTER TABLE public.business_info ADD COLUMN IF NOT EXISTS address text DEFAULT '100 West Street, Sandton, Johannesburg, 2196';
    ALTER TABLE public.business_info ADD COLUMN IF NOT EXISTS telephone_number text DEFAULT '+27 (0) 11 883 0000';
    ALTER TABLE public.business_info ADD COLUMN IF NOT EXISTS vat_no text DEFAULT '4920192834';
    ALTER TABLE public.business_info ADD COLUMN IF NOT EXISTS reg_no text DEFAULT '2023/123456/07';
    ALTER TABLE public.business_info ADD COLUMN IF NOT EXISTS website text DEFAULT 'www.pinin.co.za';
    ALTER TABLE public.business_info ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
END $$;

-- Seed default initial row if not already present
INSERT INTO public.business_info (id, app_icon_url, business_name, address, telephone_number, vat_no, reg_no, website)
VALUES (
    'default',
    '/PinIn-app-icon.png',
    'PinIn (Pty) Ltd',
    '100 West Street, Sandton, Johannesburg, 2196',
    '+27 (0) 11 883 0000',
    '4920192834',
    '2023/123456/07',
    'www.pinin.co.za'
)
ON CONFLICT (id) DO NOTHING;

-- 2. ADD `invoice_number` AND `order_number` TO `listings` TABLE
ALTER TABLE IF EXISTS public.listings 
ADD COLUMN IF NOT EXISTS invoice_number text;

ALTER TABLE IF EXISTS public.listings 
ADD COLUMN IF NOT EXISTS order_number text;

-- 3. ENSURE `invoice_number` EXISTS IN `orders` TABLE TOO
ALTER TABLE IF EXISTS public.orders 
ADD COLUMN IF NOT EXISTS invoice_number text;

-- 4. CONFIGURE ROW LEVEL SECURITY (RLS) FOR `business_info`
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view business_info" ON public.business_info;
CREATE POLICY "Public can view business_info" ON public.business_info 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update business_info" ON public.business_info;
CREATE POLICY "Public can update business_info" ON public.business_info 
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can insert business_info" ON public.business_info;
CREATE POLICY "Public can insert business_info" ON public.business_info 
FOR INSERT WITH CHECK (true);

-- 5. GRANT PERMISSIONS
GRANT ALL ON TABLE public.business_info TO anon, authenticated, service_role;

-- ==============================================================================
-- HOW TO UPDATE YOUR APP ICON & BUSINESS DETAILS FOR ALL INVOICES:
-- ==============================================================================
-- You can run this simple UPDATE statement anytime to change what appears on your invoices:
--
-- UPDATE public.business_info
-- SET
--   app_icon_url = 'https://your-image-url-here.png',
--   business_name = 'PinIn (Pty) Ltd',
--   address = '100 West Street, Sandton, Johannesburg, 2196',
--   telephone_number = '+27 (0) 11 883 0000',
--   vat_no = '4920192834',
--   reg_no = '2023/123456/07',
--   website = 'www.pinin.co.za',
--   updated_at = now()
-- WHERE id = 'default';
