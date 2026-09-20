import { supabase } from '../supabaseClient';
import { UserAccount } from '../types/furniture';
import { formatDisplayName } from '../utils/formatUtils';

export interface SupabaseProfileRow {
  id: string;
  name: string | null;
  surname: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_PROFILE_PREFIX = 'pinin_user_profile_';

export function getLocalUserProfile(userId: string): Partial<UserAccount> | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_PROFILE_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setLocalUserProfile(userId: string, profile: Partial<UserAccount>) {
  if (!userId) return;
  try {
    localStorage.setItem(`${LOCAL_PROFILE_PREFIX}${userId}`, JSON.stringify(profile));
  } catch {}
}

// Fetch user profile from Supabase 'profiles' table
export async function fetchUserProfile(userId: string): Promise<Partial<UserAccount> | null> {
  if (!userId) return null;
  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), 5000);
    });

    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const res = await Promise.race([fetchPromise, timeoutPromise]);
    if (timer) clearTimeout(timer);

    if (!res || res.error || !res.data) {
      return getLocalUserProfile(userId);
    }

    const row = res.data as SupabaseProfileRow;
    const cleanSurname = (row.surname || '').trim();
    let firstName = (row.name || '').trim();

    if (cleanSurname && firstName.toLowerCase().endsWith(cleanSurname.toLowerCase())) {
      firstName = firstName.slice(0, firstName.length - cleanSurname.length).trim();
    }

    if (!firstName && row.full_name) {
      const fn = row.full_name.trim();
      if (cleanSurname && fn.toLowerCase().endsWith(cleanSurname.toLowerCase())) {
        firstName = fn.slice(0, fn.length - cleanSurname.length).trim();
      } else {
        const parts = fn.split(/\s+/);
        firstName = parts[0] || '';
      }
    }

    if (!firstName) {
      firstName = row.email?.split('@')[0] || 'Member';
    }

    const result: Partial<UserAccount> = {
      id: row.id,
      name: firstName,
      surname: cleanSurname,
      email: row.email || '',
      avatar: row.avatar_url || '',
      phone: row.phone || '',
      location: row.location || '',
      bio: row.bio || '',
    };

    setLocalUserProfile(userId, result);
    return result;
  } catch (err) {
    console.warn('fetchUserProfile exception:', err);
    return getLocalUserProfile(userId);
  }
}

// Upsert (insert or update) profile to Supabase 'profiles' table with strictly valid columns
export async function upsertUserProfile(profile: {
  id: string;
  name?: string;
  surname?: string;
  email?: string;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
}): Promise<boolean> {
  try {
    let cleanName = (profile.name || '').trim();
    const cleanSurname = (profile.surname || '').trim();

    if (cleanSurname && cleanName.toLowerCase().endsWith(cleanSurname.toLowerCase())) {
      cleanName = cleanName.slice(0, cleanName.length - cleanSurname.length).trim();
    }

    const fullName = cleanName && cleanSurname
      ? `${cleanName} ${cleanSurname}`.trim()
      : (cleanName || '');

    // Cache local profile with all fields including bio and surname
    setLocalUserProfile(profile.id, {
      id: profile.id,
      name: cleanName,
      surname: cleanSurname,
      email: profile.email,
      avatar: profile.avatar,
      phone: profile.phone,
      location: profile.location,
      bio: profile.bio,
    });

    // Supabase 'profiles' table columns
    const payload: Record<string, unknown> = {
      id: profile.id,
      updated_at: new Date().toISOString(),
    };

    if (fullName) payload.full_name = fullName;
    if (cleanName) payload.name = cleanName;
    if (cleanSurname) payload.surname = cleanSurname;
    if (profile.bio !== undefined) payload.bio = profile.bio;
    if (profile.email !== undefined) payload.email = profile.email.trim();
    if (profile.avatar !== undefined) payload.avatar_url = profile.avatar;
    if (profile.phone !== undefined) payload.phone = profile.phone;
    if (profile.location !== undefined) payload.location = profile.location;

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('upsertUserProfile error (handled):', error.message);
      return false;
    }

    // Also record in known users list for search
    recordKnownUser({
      id: profile.id,
      name: fullName || profile.email?.split('@')[0] || 'User',
      avatar: profile.avatar || '',
      email: profile.email,
      location: profile.location,
    });

    return true;
  } catch (err) {
    console.warn('upsertUserProfile exception:', err);
    return false;
  }
}

export interface AppUserOption {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  location?: string;
  role?: string;
}

const KNOWN_USERS_KEY = 'pinin_known_users_v2';

export function recordKnownUser(user: { id: string; name: string; avatar?: string; email?: string; location?: string; role?: string }) {
  if (!user || !user.id || !user.name) return;
  try {
    const raw = localStorage.getItem(KNOWN_USERS_KEY);
    const existing: AppUserOption[] = raw ? JSON.parse(raw) : [];
    const index = existing.findIndex((u) => u.id === user.id || u.name.toLowerCase() === user.name.toLowerCase());
    const entry: AppUserOption = {
      id: user.id,
      name: user.name,
      avatar: user.avatar || '',
      email: user.email,
      location: user.location,
      role: user.role || 'Member',
    };
    if (index >= 0) {
      existing[index] = { ...existing[index], ...entry };
    } else {
      existing.push(entry);
    }
    localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(existing));
  } catch {}
}

// Fetch all registered users strictly from Supabase profiles table
export async function fetchAllRegisteredUsers(): Promise<AppUserOption[]> {
  const userMap = new Map<string, AppUserOption>();

  // 1. Fetch from Supabase 'profiles' table (the authoritative source for registered users)
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, name, surname, email, avatar_url, phone, location');

    if (!error && Array.isArray(profiles)) {
      profiles.forEach((p) => {
        if (p.id) {
          const rawName = p.full_name || (p.name ? `${p.name} ${p.surname || ''}`.trim() : p.email?.split('@')[0] || 'Member');
          const displayName = formatDisplayName(rawName);
          const lower = displayName.toLowerCase();
          if (!lower.includes('marcus') && !lower.includes('gray')) {
            userMap.set(p.id, {
              id: p.id,
              name: displayName,
              avatar: p.avatar_url || '',
              email: p.email || undefined,
              location: p.location || undefined,
              role: 'Member',
            });
          }
        }
      });
    }
  } catch (err) {
    console.warn('Could not fetch profiles for user search:', err);
  }

  // 2. If Supabase request had an issue, fallback to cached registered users (filtering any mock accounts)
  if (userMap.size === 0) {
    try {
      const raw = localStorage.getItem(KNOWN_USERS_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as AppUserOption[];
        if (Array.isArray(cached)) {
          cached.forEach((u) => {
            if (u && u.id && u.name) {
              const lower = u.name.toLowerCase();
              if (!lower.includes('marcus') && !lower.includes('gray') && !u.id.startsWith('mock-') && !u.id.startsWith('seller-')) {
                userMap.set(u.id, {
                  ...u,
                  name: formatDisplayName(u.name),
                });
              }
            }
          });
        }
      }
    } catch {}
  }

  const allUsers = Array.from(userMap.values());
  try {
    localStorage.setItem(KNOWN_USERS_KEY, JSON.stringify(allUsers));
  } catch {}

  return allUsers;
}

