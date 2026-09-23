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

// Safe public listing fields (omits massive verification_video base64 so queries complete in <150ms)
export const PUBLIC_LISTING_FIELDS =
  'id, title, location, price, original_price, category, condition, image_url, additional_images, seller_id, seller_name, seller_avatar, seller_rating, seller_review_count, seller_joined_date, seller_response_rate, description, dimensions, material, brand, posted_at, created_at, status, latitude, longitude';

// Check if a row is approved or active for public feed
export function isListingRowApproved(row?: Partial<SupabaseListingRow> | Record<string, unknown> | null): boolean {
  if (!row) return false;

  // Explicit rejections or pending states
  if (
    row.status === 'rejected' ||
    row.status === 'pending' ||
    row.status === 'under_review' ||
    row.status === 'draft'
  ) {
    return false;
  }
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
    return s === 'approved' || s === 'active' || s === 'live' || s === 'published' || s === 'ready';
  }

  // Without explicit approved flag/status, do not show on public feed
  return false;
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
    additionalImages: (() => {
      const list: string[] = [];
      const add = (v: unknown) => {
        if (typeof v === 'string') {
          const t = v.trim();
          if (t && !list.includes(t)) list.push(t);
        }
      };
      const parse = (src: unknown) => {
        if (!src) return;
        if (Array.isArray(src)) {
          src.forEach(add);
        } else if (typeof src === 'string') {
          const trimmed = src.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const p = JSON.parse(trimmed);
              if (Array.isArray(p)) p.forEach(add);
            } catch {}
          } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            trimmed
              .slice(1, -1)
              .split(',')
              .forEach((s) => add(s.replace(/^"(.*)"$/, '$1').trim()));
          } else if (trimmed.includes(',')) {
            trimmed.split(',').forEach((s) => add(s.trim()));
          } else if (trimmed !== '') {
            add(trimmed);
          }
        }
      };
      parse(row.additional_images);
      parse((row as any).additionalImages);
      parse((row as any).images);
      parse((row as any).imageUrls);
      return list.map((img) =>
        getOptimizedImageUrl(img, { width: 600, quality: 70, format: 'webp' })
      );
    })(),
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

// Convert UI FurnitureItem object to database row matching the exact Supabase listings table schema
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

  const suburb = (item.collectionSuburb || item.location || 'Sandton').trim();

  // Exactly matches the columns in Supabase 'listings' table:
  // id, title, location, price, original_price, category, condition, image_url, additional_images,
  // seller_id, seller_name, seller_avatar, seller_rating, seller_review_count, seller_joined_date,
  // seller_response_rate, description, dimensions, material, brand, posted_at, status,
  // latitude, longitude, handwritten_date_image, verification_video
  const payload: Record<string, unknown> = {
    id: item.id,
    title: item.title,
    location: suburb,
    price: Math.max(0, Number(item.price) || 0),
    original_price: item.originalPrice ? Number(item.originalPrice) : null,
    category: item.category,
    condition: item.condition,
    image_url: item.imageUrl,
    additional_images: Array.isArray(item.additionalImages) ? item.additionalImages : [],
    seller_id: item.seller?.id || 'anonymous_seller',
    seller_name: item.seller?.name || 'PinIn Member',
    seller_avatar: item.seller?.avatar || '',
    seller_rating: typeof item.seller?.rating === 'number' ? item.seller.rating : 5.0,
    seller_review_count: typeof item.seller?.reviewCount === 'number' ? item.seller.reviewCount : 0,
    seller_joined_date: item.seller?.joinedDate || 'Member',
    seller_response_rate: item.seller?.responseRate || '100%',
    description: item.description || '',
    dimensions: item.dimensions || 'Standard specifications',
    material: item.material || 'Quality build',
    brand: item.brand || item.title,
    posted_at: item.postedAt || 'Just now',
    status: item.status || 'pending',
    latitude: lat !== undefined ? lat : null,
    longitude: lng !== undefined ? lng : null,
    handwritten_date_image: item.handwrittenDateImage || null,
    verification_video: item.verificationVideo || null,
  };

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
    return parsed.filter(
      (l) => isListingRowApproved(l) && !MOCK_ITEM_IDS.has(l.id) && !deleted.has(l.id)
    );
  } catch {
    return [];
  }
}

// Save or sync listings locally on device
export function setLocalListings(items: FurnitureItem[]) {
  try {
    const deleted = getDeletedListingIds();
    const cleanItems = items.filter(
      (l) => isListingRowApproved(l) && !MOCK_ITEM_IDS.has(l.id) && !deleted.has(l.id)
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanItems));
  } catch {}
}

export function saveLocalListing(item: FurnitureItem) {
  // ONLY cache approved items in the public marketplace feed storage
  if (!isListingRowApproved(item)) return;
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

  // 0. Offline fast-path: Don't call any API if offline, return local cached listings immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const localListings = getLocalListings();
    const valid = localListings.filter((l) => isListingRowApproved(l) && !MOCK_ITEM_IDS.has(l.id) && !deleted.has(l.id));
    return valid;
  }

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

    // 1. Primary query: Fetch with PUBLIC_LISTING_FIELDS ordered by created_at
    // Omitting the heavy base64 verification_video column allows this to load in <150ms
    const fetchPromise = supabase
      .from('listings')
      .select(PUBLIC_LISTING_FIELDS)
      .order('created_at', { ascending: false });

    const { data, error } = await withTimeout(fetchPromise, 10000, { data: null, error: null } as any);

    if (!error && data && Array.isArray(data)) {
      rows = data as SupabaseListingRow[];
    } else {
      // 2. Fallback query: if created_at column doesn't exist, fetch with fields without order
      const retryPromise = supabase.from('listings').select(PUBLIC_LISTING_FIELDS);
      const { data: retryData, error: retryError } = await withTimeout(retryPromise, 8000, { data: null, error: null } as any);
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

  // Offline fast-path
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return getLocalUserListings(userId).filter((l) => !deleted.has(l.id));
  }

  try {
    let rows: SupabaseListingRow[] | null = null;

    const fetchPromise = supabase
      .from('listings')
      .select(`${PUBLIC_LISTING_FIELDS}, handwritten_date_image`)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    const { data, error } = await withTimeout(fetchPromise, 10000, { data: null, error: null } as any);

    if (!error && data && Array.isArray(data)) {
      rows = data as SupabaseListingRow[];
    } else {
      const retryPromise = supabase
        .from('listings')
        .select(`${PUBLIC_LISTING_FIELDS}, handwritten_date_image`)
        .eq('seller_id', userId);
      const { data: retryData, error: retryError } = await withTimeout(retryPromise, 8000, { data: null, error: null } as any);
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

// Fetch a single listing by ID with full fields including additional_images
export async function fetchListingById(itemId: string): Promise<FurnitureItem | null> {
  if (!itemId) return null;

  // Offline fast-path
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const local = getLocalListings().find((l) => l.id === itemId);
    if (local) return local;
  }

  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', itemId)
      .maybeSingle();

    if (!error && data) {
      return mapRowToFurnitureItem(data as SupabaseListingRow);
    }
  } catch (err) {
    console.warn('fetchListingById error:', err);
  }

  // Fallback to local listings or cached user listings
  try {
    const local = getLocalListings();
    const foundLocal = local.find((l) => l.id === itemId);
    if (foundLocal) {
      return foundLocal;
    }
  } catch {}

  return null;
}

// Insert new listing into Supabase as 'pending' (requires approval in Supabase before appearing publicly)
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

  // Listing defaults to 'pending' review (admin must approve in Supabase before appearing on home page)
  const pendingItem: FurnitureItem = {
    ...item,
    id: itemId,
    imageUrl: uploadedUrls[0] || item.imageUrl,
    additionalImages: uploadedUrls.slice(1),
    handwrittenDateImage: uploadedHandwrittenUrl || item.handwrittenDateImage,
    verificationVideo: uploadedVideoUrl || item.verificationVideo,
    status: item.status || 'pending',
  };

  // 2. Save locally ONLY to user's private listings on device so seller sees it in their Account page
  if (item.seller?.id) {
    const existingUserListings = getLocalUserListings(item.seller.id).filter((l) => l.id !== pendingItem.id);
    setLocalUserListings(item.seller.id, [pendingItem, ...existingUserListings]);
  }

  // 3. Insert directly into Supabase 'listings' table
  try {
    const row = mapFurnitureItemToRow(pendingItem);

    // Primary: Insert row into 'listings' table
    const insertResult = await supabase.from('listings').insert([row]);
    
    if (insertResult.error) {
      console.warn('Primary listings insert note:', insertResult.error.message);
      const errMsg = insertResult.error.message.toLowerCase();

      // Fallback: Strip extended fields and ensure seller_id is non-null
      const cleanRow: Record<string, unknown> = {
        id: itemId,
        title: pendingItem.title,
        price: Math.max(0, Number(pendingItem.price) || 0),
        category: pendingItem.category,
        condition: pendingItem.condition,
        image_url: pendingItem.imageUrl,
        additional_images: pendingItem.additionalImages || [],
        location: pendingItem.location || pendingItem.collectionSuburb || 'Sandton',
        description: pendingItem.description || '',
        seller_id: pendingItem.seller?.id || 'anonymous_seller',
        seller_name: pendingItem.seller?.name || 'PinIn Member',
        seller_avatar: pendingItem.seller?.avatar || '',
        status: pendingItem.status || 'pending',
      };

      if (pendingItem.latitude !== undefined && pendingItem.longitude !== undefined) {
        cleanRow.latitude = pendingItem.latitude;
        cleanRow.longitude = pendingItem.longitude;
      }

      const retryRes = await supabase.from('listings').insert([cleanRow]);
      if (!retryRes.error) {
        invalidateListingsCache();
        return { success: true };
      }

      return { success: false, error: insertResult.error.message || retryRes.error.message };
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
    const updatePayload: Record<string, unknown> = {
      status,
    };

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
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update review status';
    return { success: false, error: msg };
  }
}

