import { supabase } from '../supabaseClient';
import { FurnitureItem } from '../types/furniture';

const BOUGHT_PREFIX = 'pinin_bought_item_';

/**
 * Record an item as bought in the app
 */
export function recordListingAsBought(listingId: string | number) {
  if (!listingId) return;
  const idStr = String(listingId);
  try {
    localStorage.setItem(`${BOUGHT_PREFIX}${idStr}`, String(Date.now()));
  } catch {}

  // Also best-effort update Supabase listings table if column exists
  try {
    (async () => {
      try {
        await supabase
          .from('listings')
          .update({ availability_status: 'out of stock' })
          .eq('id', idStr);
      } catch {}
    })();
  } catch {}
}

/**
 * Check if an item has been bought locally
 */
export function getListingBoughtTimestamp(listingId: string | number): number | null {
  if (!listingId) return null;
  try {
    const val = localStorage.getItem(`${BOUGHT_PREFIX}${String(listingId)}`);
    return val ? Number(val) : null;
  } catch {
    return null;
  }
}

/**
 * Determine if a listing is available for purchase.
 * If the admin sets availability_status in Supabase to 'available', it is in stock!
 */
export function isListingInStock(item?: Partial<FurnitureItem> | null): boolean {
  if (!item || !item.id) return true;

  const status = (item.availabilityStatus || '').trim().toLowerCase();

  // If the admin manually wrote "available" or "in stock" in Supabase, show Add to Cart!
  if (status === 'available' || status === 'in stock') {
    return true;
  }

  // If explicitly marked out of stock in Supabase
  if (status === 'out of stock' || status === 'unavailable') {
    return false;
  }

  // If bought in the app and admin hasn't reset to "available"
  const boughtTime = getListingBoughtTimestamp(item.id);
  if (boughtTime) {
    return false;
  }

  return true;
}

/**
 * Calculate the available date (4 days after purchase or 4 days from now)
 * Format: "29 October 2026"
 */
export function getListingAvailableDate(item?: Partial<FurnitureItem> | null): string {
  if (item?.availableDate && item.availableDate.trim()) {
    return item.availableDate.trim();
  }

  const boughtTime = item?.id ? getListingBoughtTimestamp(item.id) : null;
  const baseTime = boughtTime || Date.now();
  const future = new Date(baseTime + 4 * 24 * 60 * 60 * 1000);

  const day = future.getDate();
  const month = future.toLocaleDateString('en-GB', { month: 'long' });
  const year = future.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Returns the exact out of stock message required:
 * "Out of stock, will be available on 29 October 2026"
 */
export function getOutOfStockMessage(item?: Partial<FurnitureItem> | null): string {
  const dateStr = getListingAvailableDate(item);
  return `Out of stock, will be available on ${dateStr}`;
}
