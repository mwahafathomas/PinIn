-- ============================================================================
-- PININ: SUPABASE & ONESIGNAL PUSH NOTIFICATIONS SETUP SCRIPT
-- ============================================================================
-- This script creates the `notifications` table in Supabase and sets up
-- Realtime and automated OneSignal mobile push notification delivery.
-- ============================================================================

-- 1. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT, -- Target user ID (or NULL / 'all' / 'broadcast' for broadcast)
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system', -- 'listing_submitted', 'listing_approved', 'listing_rejected', 'system'
    target_item_id TEXT,
    rejection_reason TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow read access for user or broadcast notifications
CREATE POLICY "Users can read own and broadcast notifications"
ON public.notifications FOR SELECT
USING (
    user_id IS NULL 
    OR user_id = 'all' 
    OR user_id = 'broadcast' 
    OR user_id = auth.uid()::text 
    OR true -- Set to true for marketplace prototype read access
);

-- Allow authenticated or service users to insert notifications
CREATE POLICY "Allow notification creation"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Allow users to update their read status
CREATE POLICY "Allow notification update read status"
ON public.notifications FOR UPDATE
USING (true)
WITH CHECK (true);

-- Enable Supabase Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================================
-- AUTOMATIC ONESIGNAL PUSH NOTIFICATION WEBHOOK (OPTIONAL DATABASE TRIGGER)
-- ============================================================================
-- If you want Supabase itself to trigger OneSignal REST API on every insert,
-- you can enable the `pg_net` extension in Supabase SQL editor:
--
-- 1. Enable pg_net extension:
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- 2. Create the OneSignal Webhook trigger function (replace YOUR_ONESIGNAL_APP_ID and YOUR_ONESIGNAL_REST_KEY):
/*
CREATE OR REPLACE FUNCTION public.send_onesignal_push_trigger()
RETURNS TRIGGER AS $$
DECLARE
    app_id TEXT := 'YOUR_ONESIGNAL_APP_ID';
    rest_key TEXT := 'YOUR_ONESIGNAL_REST_API_KEY';
    request_body JSONB;
BEGIN
    IF NEW.user_id IS NOT NULL AND NEW.user_id <> 'all' AND NEW.user_id <> 'broadcast' THEN
        request_body := jsonb_build_object(
            'app_id', app_id,
            'include_aliases', jsonb_build_object('external_id', jsonb_build_array(NEW.user_id)),
            'target_channel', 'push',
            'headings', jsonb_build_object('en', NEW.title),
            'contents', jsonb_build_object('en', NEW.message)
        );
    ELSE
        request_body := jsonb_build_object(
            'app_id', app_id,
            'included_segments', jsonb_build_array('Total Subscriptions'),
            'headings', jsonb_build_object('en', NEW.title),
            'contents', jsonb_build_object('en', NEW.message)
        );
    END IF;

    PERFORM net.http_post(
        url := 'https://onesignal.com/api/v1/notifications',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Basic ' || rest_key
        ),
        body := request_body
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_notification_created_send_onesignal_push
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.send_onesignal_push_trigger();
*/
