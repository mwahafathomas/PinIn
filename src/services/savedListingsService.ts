import { supabase } from '../supabaseClient';

const LOCAL_SAVED_KEY_PREFIX = 'pinin_saved_posts_';

// Get local saved item IDs for fallback
export function getLocalSavedItemIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_SAVED_KEY_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Store local saved item IDs
export function setLocalSavedItemIds(userId: string, itemIds: string[]) {
  try {
    localStorage.setItem(`${LOCAL_SAVED_KEY_PREFIX}${userId}`, JSON.stringify(itemIds));
  } catch {}
}

// Helper for fast non-blocking fetch with timeout
async function withTimeout<T>(promise: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    const result = await Promise.race([Promise.resolve(promise), timeoutPromise]);
    if (timer) clearTimeout(timer);
    return result;
  } catch {
    if (timer) clearTimeout(timer);
    return fallback;
  }
}

// Fetch all saved listing IDs for a user from Supabase
export async function fetchUserSavedListingIds(userId: string): Promise<string[]> {
  if (!userId) return [];

  try {
    const query = supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', userId);

    const { data, error } = await withTimeout(query, 6000, { data: null, error: null } as any);

    if (error || !data || !Array.isArray(data)) {
      return getLocalSavedItemIds(userId);
    }

    const ids = data.map((row: { listing_id: string }) => row.listing_id);
    setLocalSavedItemIds(userId, ids);
    return ids;
  } catch {
    return getLocalSavedItemIds(userId);
  }
}

// Save a post for a user in Supabase
export async function saveListingForUser(userId: string, listingId: string): Promise<boolean> {
  if (!userId || !listingId) return false;

  // 1. Update local cache
  const current = getLocalSavedItemIds(userId);
  if (!current.includes(listingId)) {
    setLocalSavedItemIds(userId, [listingId, ...current]);
  }

  // 2. Insert into Supabase `saved_listings` table
  try {
    const { error } = await supabase.from('saved_listings').upsert([
      {
        id: `${userId}_${listingId}`,
        user_id: userId,
        listing_id: listingId,
        created_at: new Date().toISOString(),
      },
    ]);

    return !error;
  } catch {
    return false;
  }
}

// Remove a saved post for a user in Supabase
export async function removeSavedListingForUser(userId: string, listingId: string): Promise<boolean> {
  if (!userId || !listingId) return false;

  // 1. Update local cache
  const current = getLocalSavedItemIds(userId).filter((id) => id !== listingId);
  setLocalSavedItemIds(userId, current);

  // 2. Delete from Supabase `saved_listings` table
  try {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    return !error;
  } catch {
    return false;
  }
}
