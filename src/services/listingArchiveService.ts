import { supabase } from '../supabaseClient';

const ARCHIVE_CACHE_KEY = 'pinin_listing_images_archive_v1';

export interface ArchivedListingImage {
  listingId: string;
  imageUrl: string;
  additionalImages?: string[];
  title?: string;
  updatedAt?: string;
}

// In-memory cache for ultra-fast synchronous lookup
const memoryArchive: Record<string, string> = {};

// Initialize from localStorage
try {
  const raw = localStorage.getItem(ARCHIVE_CACHE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      Object.assign(memoryArchive, parsed);
    }
  }
} catch {}

/**
 * Permanently archive a listing's image in Supabase and local cache
 */
export async function archiveListingImage(
  listingId: string,
  imageUrl: string,
  title?: string,
  additionalImages?: string[]
): Promise<void> {
  if (!listingId || !imageUrl) return;

  const cleanId = String(listingId).trim();
  const cleanUrl = String(imageUrl).trim();
  if (!cleanId || !cleanUrl) return;

  // 1. Update in-memory & local cache immediately
  memoryArchive[cleanId] = cleanUrl;
  try {
    localStorage.setItem(ARCHIVE_CACHE_KEY, JSON.stringify(memoryArchive));
  } catch {}

  // 2. Persist to Supabase `listing_images_archive` table
  try {
    await supabase.from('listing_images_archive').upsert(
      [
        {
          listing_id: cleanId,
          image_url: cleanUrl,
          additional_images: additionalImages || [],
          title: title || '',
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'listing_id' }
    );
  } catch (err) {
    console.warn('[Archive] listing_images_archive upsert notice:', err);
  }
}

/**
 * Synchronous lookup of an archived listing image from cache
 */
export function getCachedArchivedImage(listingId?: string): string | null {
  if (!listingId) return null;
  const cleanId = String(listingId).trim();
  return memoryArchive[cleanId] || null;
}

/**
 * Asynchronous retrieval of an archived listing image (checks memory, localStorage, then Supabase table)
 */
export async function getArchivedListingImage(listingId?: string): Promise<string | null> {
  if (!listingId) return null;
  const cleanId = String(listingId).trim();

  // 1. Check in-memory
  if (memoryArchive[cleanId]) {
    return memoryArchive[cleanId];
  }

  // 2. Check Supabase `listing_images_archive` table
  try {
    const { data, error } = await supabase
      .from('listing_images_archive')
      .select('image_url')
      .eq('listing_id', cleanId)
      .maybeSingle();

    if (!error && data?.image_url) {
      const img = data.image_url.trim();
      memoryArchive[cleanId] = img;
      try {
        localStorage.setItem(ARCHIVE_CACHE_KEY, JSON.stringify(memoryArchive));
      } catch {}
      return img;
    }
  } catch (err) {
    console.warn('[Archive] listing_images_archive query notice:', err);
  }

  return null;
}
