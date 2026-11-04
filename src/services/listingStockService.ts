import { supabase } from '../supabaseClient';
import { FurnitureItem } from '../types/furniture';

const BOUGHT_COUNT_PREFIX = 'pinin_bought_count_';
const BOUGHT_TIME_PREFIX = 'pinin_bought_time_';
const OUT_OF_STOCK_THRESHOLD = 5;

/**
 * Record an item as bought in the app (increments bought count)
 */
export function recordListingAsBought(listingId: string | number, quantity: number = 1) {
  if (!listingId) return;
  const idStr = String(listingId);
  try {
    const currentCount = getListingBoughtCount(idStr);
    const newCount = currentCount + Math.max(1, quantity);
    localStorage.setItem(`${BOUGHT_COUNT_PREFIX}${idStr}`, String(newCount));
    localStorage.setItem(`${BOUGHT_TIME_PREFIX}${idStr}`, String(Date.now()));

    // If bought 5 or more items, mark as out of stock in Supabase listings table
    if (newCount >= OUT_OF_STOCK_THRESHOLD) {
      (async () => {
        try {
          await supabase
            .from('listings')
            .update({ availability_status: 'out of stock' })
            .eq('id', idStr);
        } catch {}
      })();
    }
  } catch {}
}

/**
 * Get total number of times an item has been bought
 */
export function getListingBoughtCount(listingId: string | number): number {
  if (!listingId) return 0;
  try {
    const val = localStorage.getItem(`${BOUGHT_COUNT_PREFIX}${String(listingId)}`);
    return val ? Number(val) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Get timestamp when the item was last bought
 */
export function getListingBoughtTimestamp(listingId: string | number): number | null {
  if (!listingId) return null;
  try {
    const val = localStorage.getItem(`${BOUGHT_TIME_PREFIX}${String(listingId)}`);
    return val ? Number(val) : null;
  } catch {
    return null;
  }
}

/**
 * Determine if a listing is available for purchase.
 * Changed to make item display as out of stock once 5 items are bought.
 */
export function isListingInStock(item?: Partial<FurnitureItem> | null): boolean {
  if (!item || !item.id) return true;

  const status = (item.availabilityStatus || '').trim().toLowerCase();

  // If admin manually set "available" or "in stock" in Supabase, show Add to Cart!
  if (status === 'available' || status === 'in stock') {
    return true;
  }

  // If explicitly marked out of stock in Supabase
  if (status === 'out of stock' || status === 'unavailable') {
    return false;
  }

  // Rule: out of stock once 5 items are bought
  const boughtCount = getListingBoughtCount(item.id);
  const salesCount = typeof (item as any).sales_count === 'number' ? (item as any).sales_count : 0;
  const totalBought = boughtCount + salesCount;

  if (totalBought >= OUT_OF_STOCK_THRESHOLD) {
    return false;
  }

  // Also check if stockQuantity was set and reached 0
  if (typeof item.stockQuantity === 'number' && item.stockQuantity <= 0) {
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
