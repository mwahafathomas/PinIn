-- ==============================================================================
-- PinIn: CONTACT MESSAGES TABLE & VIEW SETUP
-- ==============================================================================
-- Run this script in the Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create table `contact_messages`
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow all users (public / anon / authenticated) to insert contact inquiries
DROP POLICY IF EXISTS "Allow public to insert contact messages" ON public.contact_messages;
CREATE POLICY "Allow public to insert contact messages"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 4. Policy: Allow reading contact messages
DROP POLICY IF EXISTS "Allow select contact messages" ON public.contact_messages;
CREATE POLICY "Allow select contact messages"
ON public.contact_messages FOR SELECT
TO anon, authenticated, service_role
USING (true);

-- 5. Policy: Allow updating status (e.g. mark replied)
DROP POLICY IF EXISTS "Allow update contact messages" ON public.contact_messages;
CREATE POLICY "Allow update contact messages"
ON public.contact_messages FOR UPDATE
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- 6. Create View in Supabase Dashboard so you can easily see and query all messages
CREATE OR REPLACE VIEW public.view_contact_messages AS
SELECT
    id,
    name,
    email,
    subject,
    message,
    status,
    created_at
FROM public.contact_messages
ORDER BY created_at DESC;

-- 7. Grant access permissions
GRANT ALL ON TABLE public.contact_messages TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.view_contact_messages TO anon, authenticated, service_role;
