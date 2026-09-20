import { NotificationItem } from '../types/furniture';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';
import { supabase } from '../supabaseClient';
import { sendOneSignalPushNotification } from './oneSignalService';

const NOTIFICATIONS_STORAGE_PREFIX = 'pinin_notifications_';

export interface SupabaseNotificationRow {
  id?: string;
  user_id?: string | null;
  title: string;
  message: string;
  type?: string | null;
  target_item_id?: string | null;
  rejection_reason?: string | null;
  created_at?: string | null;
  read?: boolean | null;
}

export function getStoredNotifications(userId?: string): NotificationItem[] {
  try {
    const key = `${NOTIFICATIONS_STORAGE_PREFIX}${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((n) => n && n.id !== 'notif-welcome');
      }
    }
    return [];
  } catch {
    return [];
  }
}

export function saveStoredNotifications(userId: string | undefined, notifications: NotificationItem[]) {
  try {
    const key = `${NOTIFICATIONS_STORAGE_PREFIX}${userId || 'guest'}`;
    localStorage.setItem(key, JSON.stringify(notifications));
  } catch {}
}

export function formatNotificationTime(item: { timestamp?: string; createdAt?: number | string }): string {
  let timeMs: number | null = null;
  if (typeof item.createdAt === 'number' && !isNaN(item.createdAt)) {
    timeMs = item.createdAt;
  } else if (typeof item.createdAt === 'string') {
    const parsed = Date.parse(item.createdAt);
    if (!isNaN(parsed)) timeMs = parsed;
  }

  if (!timeMs && item.timestamp) {
    // If timestamp is an ISO or parseable date string
    const parsed = Date.parse(item.timestamp);
    if (!isNaN(parsed) && (item.timestamp.includes('-') || item.timestamp.includes('/'))) {
      timeMs = parsed;
    }
  }

  if (timeMs) {
    const diffMs = Date.now() - timeMs;
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin === 1) return '1 minute ago';
    if (diffMin < 60) return `${diffMin} mins ago`;
    if (diffHour === 1) return '1 hour ago';
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 month ago';
    return `${diffMonths} months ago`;
  }

  if (item.timestamp && item.timestamp !== 'Just now') {
    return item.timestamp;
  }
  return 'Just now';
}

export function mapSupabaseNotificationRow(row: SupabaseNotificationRow): NotificationItem {
  const rowType = (row.type as NotificationItem['type']) || 'system';
  const createdMs = row.created_at ? Date.parse(row.created_at) : Date.now();

  return {
    id: row.id || `notif-remote-${Date.now()}`,
    title: row.title || 'Notification Alert',
    message: row.message || '',
    type: rowType,
    targetItemId: row.target_item_id || undefined,
    rejectionReason: row.rejection_reason || undefined,
    read: row.read === true,
    createdAt: isNaN(createdMs) ? Date.now() : createdMs,
    timestamp: formatNotificationTime({ createdAt: createdMs }),
  };
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

/**
 * Fetches alerts & notifications from the Supabase `notifications` table.
 * Returns alerts targeted to this user or broadcast alerts (user_id IS NULL / 'all' / 'broadcast')
 */
export async function fetchSupabaseNotifications(userId?: string): Promise<NotificationItem[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null,user_id.eq.all,user_id.eq.broadcast`);
    } else {
      query = query.or(`user_id.is.null,user_id.eq.all,user_id.eq.broadcast`);
    }

    const { data, error } = await withTimeout(query, 7000, { data: null, error: null } as any);

    if (error || !data || !Array.isArray(data)) {
      return getStoredNotifications(userId);
    }

    const remoteItems = data.map((r: SupabaseNotificationRow) => mapSupabaseNotificationRow(r));
    if (remoteItems.length > 0) {
      // Merge with any local offline notifications and cache
      const local = getStoredNotifications(userId);
      const existingIds = new Set(remoteItems.map((n) => n.id));
      const unmergedLocal = local.filter((n) => !existingIds.has(n.id));
      const combined = [...remoteItems, ...unmergedLocal];
      saveStoredNotifications(userId, combined);
      return combined;
    }

    return getStoredNotifications(userId);
  } catch {
    return getStoredNotifications(userId);
  }
}

/**
 * Send an alert / notification to Supabase (can target a specific user or broadcast to all)
 * Also triggers OneSignal Mobile Push Notification automatically.
 */
export async function sendSupabaseNotification(payload: {
  userId?: string | null;
  title: string;
  message: string;
  type?: string;
  targetItemId?: string;
  rejectionReason?: string;
}): Promise<boolean> {
  try {
    // 1. Send push notification to user's mobile device via OneSignal
    sendOneSignalPushNotification({
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      data: {
        type: payload.type || 'system',
        targetItemId: payload.targetItemId,
      },
    }).catch((err) => console.warn('OneSignal background push dispatch note:', err));

    // 2. Persist in Supabase notifications table
    const { error } = await supabase.from('notifications').insert([
      {
        user_id: payload.userId || null,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'system',
        target_item_id: payload.targetItemId || null,
        rejection_reason: payload.rejectionReason || null,
        read: false,
      },
    ]);
    return !error;
  } catch {
    return false;
  }
}

export function createSubmittedNotification(listingTitle: string, listingId: string): NotificationItem {
  return {
    id: `notif-sub-${listingId}-${Date.now()}`,
    title: 'Listing Under Review ⏳',
    message: `Your listing "${listingTitle}" was successfully submitted. Our team will review it before it goes live on the marketplace.`,
    timestamp: 'Just now',
    createdAt: Date.now(),
    read: false,
    type: 'listing_submitted',
    targetItemId: listingId,
  };
}

export function createApprovedNotification(listingTitle: string, listingId: string): NotificationItem {
  return {
    id: `notif-appr-${listingId}-${Date.now()}`,
    title: 'Listing Approved! 🎉',
    message: `Great news! Your listing "${listingTitle}" has been approved and is now live for all buyers on the marketplace.`,
    timestamp: 'Just now',
    createdAt: Date.now(),
    read: false,
    type: 'listing_approved',
    targetItemId: listingId,
  };
}

export function createRejectedNotification(
  listingTitle: string,
  listingId: string,
  rejectionReason?: string
): NotificationItem {
  const reasonText = rejectionReason && rejectionReason.trim()
    ? `Reason: ${rejectionReason.trim()}`
    : 'Please check community guidelines or ensure your listing meets our marketplace standards.';

  return {
    id: `notif-rej-${listingId}-${Date.now()}`,
    title: 'Listing Review Update ❌',
    message: `Your listing "${listingTitle}" was not approved. ${reasonText}`,
    rejectionReason: rejectionReason?.trim() || undefined,
    timestamp: 'Just now',
    createdAt: Date.now(),
    read: false,
    type: 'listing_rejected',
    targetItemId: listingId,
  };
}
