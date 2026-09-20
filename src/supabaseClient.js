import { createClient } from '@supabase/supabase-js';

const rawUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://ygkyxxrrfcvypcvmnzke.supabase.co';

const rawKey =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_ANON_KEY ||
      import.meta.env?.VITE_SUPABASE_PUBLIC_KEY ||
      import.meta.env?.VITE_SUPABASE_KEY)) ||
  'sb_publishable__TcJkIYGsFBbmJ66gUcmzA_hJGn38yE';

// Normalize URL to project root for auth endpoints if trailing /rest/v1/ is provided
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

export const SUPABASE_URL = cleanUrl || rawUrl;
export const SUPABASE_PUBLIC_KEY = rawKey;

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLIC_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export default supabase;

