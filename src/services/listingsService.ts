import { FurnitureItem } from '../types/furniture';
import { supabase } from '../supabaseClient';
import { INITIAL_FURNITURE } from '../data/mockData';
import { getCoordinatesForLocation } from '../utils/geoUtils';
import { uploadAllListingImages, uploadListingImage, uploadListingVideo } from './storageService';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

const LOCAL_STORAGE_KEY = 'pinin_custom_furniture_listings';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
const LISTINGS_CACHE_TIME_KEY = 'pinin_listings_cache_time';
let inMemoryListingsCache: { data: FurnitureItem[]; timestamp: number } | null = null;

export function invalidateListingsCache() {
  inMemoryListingsCache = null;
  try {
    localStorage.removeItem(LISTINGS_CACHE_TIME_KEY);
  } catch {}
}

export interface SupabaseListingRow {
  id: string;
  title: string;
  location: string;
  price: number;
  original_price?: number | null;
  category: string;
  condition: 'Brand New' | 'Like New' | 'Good' | 'Fair' | 'Vintage';
  image_url: string;
  additional_images?: string[] | null;
  seller_id: string;
  seller_name: string;
  seller_avatar: string;
  seller_rating?: number | null;
  seller_review_count?: number | null;
  seller_joined_date?: string | null;
  seller_response_rate?: string | null;
  description: string;
  dimensions?: string | null;
  material?: string | null;
  brand?: string | null;
  posted_at?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | string | null;
  is_approved?: boolean | string | number | null;
  rejection_reason?: string | null;
  rejectionReason?: string | null;
  reject_reason?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  // Safety & Collection Meetup Pin fields
  collection_lat?: number | null;
  collection_lng?: number | null;
  collection_suburb?: string | null;
  collection_surburb?: string | null; // Alternate spelling support
  collection_address?: string | null;
  // Verification & Approval fields (Internal / Admin only)
  handwritten_date_image?: string | null;
  verification_video?: string | null;
  created_at?: string;
}

// Check if a row is approved or active for public feed
export function isListingRowApproved(row?: Partial<SupabaseListingRow> | Record<string, unknown> | null): boolean {
  if (!row) return false;

  // Explicit rejections
  if (row.status === 'rejected') return false;
  if (row.is_approved === false || row.is_approved === 'false' || row.is_approved === 0) return false;

  // Explicit approvals
  if (
    row.is_approved === true ||
    row.is_approved === 'true' ||
    row.is_approved === 1 ||
    row.is_approved === '1'
  ) {
    return true;
  }
  if (typeof row.status === 'string') {
    const s = row.status.toLowerCase().trim();
    if (s === 'approved' || s === 'active' || s === 'live' || s === 'published' || s === 'ready') {
      return true;
    }
    if (s === 'pending' || s === 'under_review') {
      return false;
    }
  }

  // Default to true for any custom Supabase records without explicit status/approval column
  return true;
}

// Convert database row to UI FurnitureItem object
export function mapRowToFurnitureItem(row: SupabaseListingRow): FurnitureItem {
  const approved = isListingRowApproved(row);
  const statusVal: 'approved' | 'pending' | 'rejected' = approved
    ? 'approved'
    : row.status === 'rejected'
    ? 'rejected'
    : 'pending';

  // Extract latitude and longitude (supports collection_lat, latitude, or lat)
  let latitude: number | undefined = undefined;
  let longitude: number | undefined = undefined;

  if (typeof row.collection_lat === 'number' && !isNaN(row.collection_lat)) {
    latitude = row.collection_lat;
  } else if (typeof row.latitude === 'number' && !isNaN(row.latitude)) {
    latitude = row.latitude;
  } else if (typeof row.lat === 'number' && !isNaN(row.lat)) {
    latitude = row.lat;
  }

  if (typeof row.collection_lng === 'number' && !isNaN(row.collection_lng)) {
    longitude = row.collection_lng;
  } else if (typeof row.longitude === 'number' && !isNaN(row.longitude)) {
    longitude = row.longitude;
  } else if (typeof row.lng === 'number' && !isNaN(row.lng)) {
    longitude = row.lng;
  }

  // Fallback to location-based geocoding if lat/lng are missing
  if (latitude === undefined || longitude === undefined) {
    const coords = getCoordinatesForLocation(row.location);
    if (coords) {
      latitude = coords.lat;
      longitude = coords.lng;
    }
  }

  const collectionSuburb =
    row.collection_suburb || row.collection_surburb || row.location || 'Local Area';

  return {
    id: row.id,
    title: row.title,
    location: row.location || collectionSuburb || 'Local Area',
    price: Number(row.price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    category: row.category || 'sofas',
    condition: row.condition || 'Like New',
    imageUrl: getOptimizedImageUrl(
      row.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
      { width: 600, quality: 70, format: 'webp' }
    ),
    additionalImages: Array.isArray(row.additional_images)
      ? row.additional_images.map((img) =>
          getOptimizedImageUrl(img, { width: 600, quality: 70, format: 'webp' })
        )
      : [],
    seller: {
      id: row.seller_id || 'unknown_seller',
      name: row.seller_name || 'PinIn Member',
      avatar: getOptimizedImageUrl(
        row.seller_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        { width: 200, quality: 75, format: 'webp' }
      ),
      rating: Number(row.seller_rating) || 5.0,
      reviewCount: Number(row.seller_review_count) || 1,
      joinedDate: row.seller_joined_date || 'Member',
      responseRate: row.seller_response_rate || 'under 15 mins',
    },
    description: row.description || '',
    dimensions: row.dimensions || 'Standard',
    material: row.material || 'Quality material',
    brand: row.brand || '',
    postedAt: row.posted_at || 'Just now',
    status: statusVal,
    rejectionReason: row.rejection_reason || row.rejectionReason || row.reject_reason || undefined,
    isSaved: false,
    latitude,
    longitude,
    collectionLat: latitude,
    collectionLng: longitude,
    collectionSuburb,
    collectionAddress: row.collection_address || undefined,
    handwrittenDateImage: row.handwritten_date_image
      ? getOptimizedImageUrl(row.handwritten_date_image, { width: 600, quality: 70, format: 'webp' })
      : undefined,
    verificationVideo: row.verification_video || undefined,
  };
}

// Convert UI FurnitureItem object to database row
export function mapFurnitureItemToRow(item: FurnitureItem): Record<string, unknown> {
  // Ensure coords exist
  let lat = item.collectionLat ?? item.latitude;
  let lng = item.collectionLng ?? item.longitude;
  if (lat === undefined || lng === undefined) {
    const derived = getCoordinatesForLocation(item.location);
    if (derived) {
      lat = derived.lat;
      lng = derived.lng;
    }
  }

  const suburb = item.collectionSuburb || item.location || 'Sandton';

  const payload: Record<string, unknown> = {
    id: item.id,
    title: item.title,
    location: suburb,
    price: item.price,
    original_price: item.originalPrice || null,
    category: item.category,
    condition: item.condition,
    image_url: item.imageUrl,
    additional_images: item.additionalImages || [],
    seller_id: item.seller.id,
    seller_name: item.seller.name,
    seller_avatar: item.seller.avatar,
    seller_rating: item.seller.rating,
    seller_review_count: item.seller.reviewCount,
    seller_joined_date: item.seller.joinedDate,
    seller_response_rate: item.seller.responseRate,
    description: item.description,
    dimensions: item.dimensions || null,
    material: item.material || null,
    brand: item.brand || null,
    posted_at: item.postedAt || 'Just now',
    status: item.status || 'approved',
    is_approved: item.status === 'rejected' ? false : true,
    // Safety Location Pin fields
    collection_lat: lat,
    collection_lng: lng,
    collection_suburb: suburb,
    collection_address: item.collectionAddress || null,
    // Verification & Approval fields (stored for admin review)
    handwritten_date_image: item.handwrittenDateImage || null,
    verification_video: item.verificationVideo || null,
  };

  if (item.rejectionReason) {
    payload.rejection_reason = item.rejectionReason;
  }

  if (lat !== undefined && lat !== null) {
    payload.latitude = lat;
    payload.lat = lat;
  }
  if (lng !== undefined && lng !== null) {
    payload.longitude = lng;
    payload.lng = lng;
  }

  return payload;
}


// Filter out legacy mock item IDs from local storage or cached arrays
const MOCK_ITEM_IDS = new Set(['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6', 'item-7', 'item-8']);
const USER_LISTINGS_STORAGE_PREFIX = 'pinin_user_listings_';
const DELETED_LISTINGS_STORAGE_KEY = 'pinin_deleted_listing_ids';

// Helper: Get set of locally deleted listing IDs that should never be shown again
export function getDeletedListingIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_LISTINGS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

// Helper: Permanently mark a listing ID as deleted across all local caches
export function markListingAsDeleted(itemId: string) {
  if (!itemId) return;
  try {
    // 1. Add to permanent deleted blacklist
    const deleted = getDeletedListingIds();
    deleted.add(itemId);
    localStorage.setItem(DELETED_LISTINGS_STORAGE_KEY, JSON.stringify(Array.from(deleted)));

    // 2. Remove from global listings cache
    const globalListings = getLocalListings().filter((l) => l.id !== itemId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(globalListings));

    // 3. Remove from all user specific listing caches in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(USER_LISTINGS_STORAGE_PREFIX) || key.startsWith('pinin_'))) {
        try {
          const raw = localStorage.getItem(key);
          if (raw && (raw.includes(itemId) || raw.startsWith('['))) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((item: any) => {
                if (typeof item === 'string') return item !== itemId;
                return item?.id !== itemId;
              });
              localStorage.setItem(key, JSON.stringify(filtered));
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('markListingAsDeleted cache update note:', err);
  }
}

// Generate valid RFC-4122 compliant UUID for database primary keys
export function generateValidUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

// Get offline listings stored on device
export function getLocalListings(): FurnitureItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const deleted = getDeletedListingIds();
    return parsed.filter((l) => !MOCK_ITEM_IDS.has(l.id) && !deleted.has(l.id));
  } catch {
    return [];
  }
}

// Save or sync listings locally on device
export function setLocalListings(items: FurnitureItem[]) {
  try {
    const deleted = getDeletedListingIds();
    const cleanItems = items.filter((l) => !MOCK_ITEM_IDS.has(l.id) && !deleted.has(l.id));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanItems));
  } catch {}
}

export function saveLocalListing(item: FurnitureItem) {
  try {
    const deleted = getDeletedListingIds();
    if (MOCK_ITEM_IDS.has(item.id) || deleted.has(item.id)) return;
    const existing = getLocalListings().filter((l) => l.id !== item.id);
    const updated = [item, ...existing];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

// Get cached user listings stored on device
export function getLocalUserListings(userId?: string): FurnitureItem[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${USER_LISTINGS_STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const deleted = getDeletedListingIds();
    return parsed.filter((l) => !MOCK_ITEM_IDS.has(l.id) && !deleted.has(l.id));
  } catch {
    return [];
  }
}

// Save user listings locally on device
export function setLocalUserListings(userId: string | undefined, items: FurnitureItem[]) {
  if (!userId) return;
  try {
    const deleted = getDeletedListingIds();
    const cleanItems = items.filter((l) => !MOCK_ITEM_IDS.has(l.id) && !deleted.has(l.id));
    localStorage.setItem(`${USER_LISTINGS_STORAGE_PREFIX}${userId}`, JSON.stringify(cleanItems));
  } catch {}
}

// Fetch all APPROVED listings for the public app feed and searches (cached for 5 minutes)
export async function fetchAllListings(forceRefresh: boolean = false): Promise<FurnitureItem[]> {
  const deleted = getDeletedListingIds();
  const now = Date.now();

  // 1. Check in-memory 5-minute cache
  if (!forceRefresh && inMemoryListingsCache && now - inMemoryListingsCache.timestamp < CACHE_TTL_MS) {
    return inMemoryListingsCache.data.filter((l) => !deleted.has(l.id));
  }

  // 2. Check localStorage 5-minute cache
  if (!forceRefresh) {
    try {
      const cachedTimeStr = localStorage.getItem(LISTINGS_CACHE_TIME_KEY);
      if (cachedTimeStr) {
        const cachedTime = Number(cachedTimeStr);
        if (now - cachedTime < CACHE_TTL_MS) {
          const localListings = getLocalListings();
          if (localListings && localListings.length > 0) {
            const valid = localListings.filter(
              (l) => isListingRowApproved(l) && !MOCK_ITEM_IDS.has(l.id) && !deleted.has(l.id)
            );
            inMemoryListingsCache = { data: valid, timestamp: cachedTime };
            return valid;
          }
        }
      }
    } catch {}
  }

  try {
    let rows: SupabaseListingRow[] | null = null;

    // 1. Primary query: Fetch ordered by created_at
    const fetchPromise = supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    const { data, error } = await withTimeout(fetchPromise, 7000, { data: null, error: null } as any);

    if (!error && data && Array.isArray(data)) {
      rows = data as SupabaseListingRow[];
    } else {
      // 2. Fallback query: if created_at column doesn't exist, fetch without order
      const retryPromise = supabase.from('listings').select('*');
      const { data: retryData, error: retryError } = await withTimeout(retryPromise, 5000, { data: null, error: null } as any);
      if (!retryError && retryData && Array.isArray(retryData)) {
        rows = retryData as SupabaseListingRow[];
      }
    }

    if (!rows || rows.length === 0) {
      const localListings = getLocalListings();
      const valid = localListings.filter((l) => isListingRowApproved(l) && !MOCK_ITEM_IDS.has(l.id) && !deleted.has(l.id));
      inMemoryListingsCache = { data: valid, timestamp: now };
      return valid;
    }

    // Filter rows that are approved / active and NOT deleted
    const approvedRows = rows.filter(
      (row) => isListingRowApproved(row) && !MOCK_ITEM_IDS.has(row.id) && !deleted.has(row.id)
    );
    const mapped = approvedRows.map(mapRowToFurnitureItem);

    // Cache locally immediately with timestamp for 5 minutes TTL
    if (mapped.length > 0) {
      setLocalListings(mapped);
      try {
        localStorage.setItem(LISTINGS_CACHE_TIME_KEY, now.toString());
      } catch {}
      inMemoryListingsCache = { data: mapped, timestamp: now };
    }

    return mapped;
  } catch {
    const localListings = getLocalListings();
    return localListings.filter((l) => isListingRowApproved(l) && !MOCK_ITEM_IDS.has(l.id) && !deleted.has(l.id));
  }
}

// Fetch all listings created by a specific user (including pending review) for their Account page
export async function fetchUserListings(userId: string): Promise<FurnitureItem[]> {
  if (!userId) return [];
  const deleted = getDeletedListingIds();
  try {
    let rows: SupabaseListingRow[] | null = null;

    const fetchPromise = supabase
      .from('listings')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    const { data, error } = await withTimeout(fetchPromise, 7000, { data: null, error: null } as any);

    if (!error && data && Array.isArray(data)) {
      rows = data as SupabaseListingRow[];
    } else {
      const retryPromise = supabase.from('listings').select('*').eq('seller_id', userId);
      const { data: retryData, error: retryError } = await withTimeout(retryPromise, 5000, { data: null, error: null } as any);
      if (!retryError && retryData && Array.isArray(retryData)) {
        rows = retryData as SupabaseListingRow[];
      }
    }

    if (!rows || rows.length === 0) {
      return getLocalUserListings(userId).filter((l) => !deleted.has(l.id));
    }

    const mapped = rows.filter((r) => !deleted.has(r.id)).map(mapRowToFurnitureItem);
    if (mapped.length > 0) {
      setLocalUserListings(userId, mapped);
    }
    return mapped;
  } catch {
    return getLocalUserListings(userId).filter((l) => !deleted.has(l.id));
  }
}

// Insert new listing into Supabase as 'approved' (live immediately across all deployed clients)
export async function insertListing(item: FurnitureItem): Promise<{ success: boolean; error?: string }> {
  // Ensure listing has a valid RFC UUID for Postgres uuid column compatibility
  let itemId = item.id;
  const isStandardUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);
  if (!isStandardUuid) {
    itemId = generateValidUUID();
  }

  // 1. Collect images to upload
  const rawImages = [item.imageUrl, ...(item.additionalImages || [])].filter(Boolean);
  let uploadedUrls = rawImages;
  let uploadedHandwrittenUrl = item.handwrittenDateImage;
  let uploadedVideoUrl = item.verificationVideo;

  try {
    // If any images are local base64/blobs, upload them to Supabase Storage bucket 'listings'
    const hasLocalImages = rawImages.some(
      (img) => typeof img === 'string' && (img.startsWith('data:') || img.startsWith('blob:'))
    );
    if (hasLocalImages) {
      uploadedUrls = await uploadAllListingImages(rawImages, itemId);
    }

    // Upload handwritten date image if local file/data/blob
    if (
      item.handwrittenDateImage &&
      (item.handwrittenDateImage.startsWith('data:') || item.handwrittenDateImage.startsWith('blob:'))
    ) {
      uploadedHandwrittenUrl = await uploadListingImage(
        item.handwrittenDateImage,
        `verification_date_${itemId}`
      );
    }

    // Upload verification video if local file/data/blob
    if (
      item.verificationVideo &&
      (item.verificationVideo.startsWith('data:') || item.verificationVideo.startsWith('blob:'))
    ) {
      uploadedVideoUrl = await uploadListingVideo(
        item.verificationVideo,
        `verification_video_${itemId}`
      );
    }
  } catch (storageErr) {
    console.warn('Storage upload note (using raw images as fallback):', storageErr);
  }

  // Set status explicitly to 'approved' (live immediately) with resolved storage URLs
  const liveItem: FurnitureItem = {
    ...item,
    id: itemId,
    imageUrl: uploadedUrls[0] || item.imageUrl,
    additionalImages: uploadedUrls.slice(1),
    handwrittenDateImage: uploadedHandwrittenUrl || item.handwrittenDateImage,
    verificationVideo: uploadedVideoUrl || item.verificationVideo,
    status: 'approved',
  };

  // 2. Save locally immediately for 0ms latency display
  saveLocalListing(liveItem);
  if (item.seller?.id) {
    const existingUserListings = getLocalUserListings(item.seller.id).filter((l) => l.id !== liveItem.id);
    setLocalUserListings(item.seller.id, [liveItem, ...existingUserListings]);
  }

  // 3. Insert directly into Supabase 'listings' table with robust adaptive retries
  try {
    const row = mapFurnitureItemToRow(liveItem);

    // Primary: Insert full row into 'listings' table
    const insertResult = await supabase.from('listings').insert([row]);
    
    if (insertResult.error) {
      console.warn('Primary listings insert note:', insertResult.error.message);
      const errMsg = insertResult.error.message.toLowerCase();

      // Fallback 1: Strip optional verification / extended columns if schema doesn't have them
      const cleanRow: Record<string, unknown> = {
        id: itemId,
        title: liveItem.title,
        price: liveItem.price,
        category: liveItem.category,
        condition: liveItem.condition,
        image_url: liveItem.imageUrl,
        location: liveItem.location || liveItem.collectionSuburb || 'Sandton',
        description: liveItem.description || '',
        seller_name: liveItem.seller.name || 'PinIn Member',
        seller_avatar: liveItem.seller.avatar,
        status: 'approved',
        is_approved: true,
      };

      // Try with seller_id if valid UUID
      if (liveItem.seller.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(liveItem.seller.id)) {
        cleanRow.seller_id = liveItem.seller.id;
      }

      if (liveItem.latitude !== undefined && liveItem.longitude !== undefined) {
        cleanRow.latitude = liveItem.latitude;
        cleanRow.longitude = liveItem.longitude;
      }

      const retryRes = await supabase.from('listings').insert([cleanRow]);
      if (!retryRes.error) {
        invalidateListingsCache();
        return { success: true };
      }

      // Fallback 2: If seller_id caused a foreign key or UUID constraint error, try without seller_id
      if (errMsg.includes('seller_id') || errMsg.includes('foreign key') || errMsg.includes('uuid')) {
        delete cleanRow.seller_id;
        const retryWithoutSeller = await supabase.from('listings').insert([cleanRow]);
        if (!retryWithoutSeller.error) {
          invalidateListingsCache();
          return { success: true };
        }
      }

      // Fallback 3: Try 'products' table name
      const fallbackResult = await supabase.from('products').insert([row]);
      if (!fallbackResult.error) {
        invalidateListingsCache();
        return { success: true };
      }

      return { success: false, error: insertResult.error.message };
    }

    invalidateListingsCache();
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save to database';
    return { success: false, error: msg };
  }
}

// Delete listing from Supabase and local cache permanently
export async function deleteListingFromDb(itemId: string): Promise<boolean> {
  if (!itemId) return true;
  try {
    // 1. Mark as permanently deleted in local cache blacklist
    markListingAsDeleted(itemId);
    invalidateListingsCache();

    // 2. Remove from Supabase listings table
    await supabase.from('listings').delete().eq('id', itemId);

    // 3. Remove any saved bookmarks for this item
    try {
      await supabase.from('saved_listings').delete().eq('listing_id', itemId);
    } catch {}

    return true;
  } catch {
    return false;
  }
}


// Update a listing review status in Supabase (approve or reject with reasons)
export async function updateListingReviewStatus(
  itemId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isApproved = status === 'approved';
    const updatePayload: Record<string, unknown> = {
      status,
      is_approved: isApproved,
    };

    if (status === 'rejected' && rejectionReason) {
      updatePayload.rejection_reason = rejectionReason;
      updatePayload.reject_reason = rejectionReason;
    }

    // Update locally
    const localListings = getLocalListings();
    const updatedLocals = localListings.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          status,
          rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        };
      }
      return item;
    });
    setLocalListings(updatedLocals);

    // Update in Supabase
    const { error } = await supabase
      .from('listings')
      .update(updatePayload)
      .eq('id', itemId);

    if (error) {
      // If error due to specific column, retry with only status & is_approved
      if (error.message.includes('column') && status === 'rejected') {
        const fallbackPayload: Record<string, unknown> = {
          status: 'rejected',
          is_approved: false,
        };
        const { error: retryError } = await supabase
          .from('listings')
          .update(fallbackPayload)
          .eq('id', itemId);
        if (retryError) return { success: false, error: retryError.message };
      } else {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update review status';
    return { success: false, error: msg };
  }
}

