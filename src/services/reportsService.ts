import { FurnitureItem } from '../types/furniture';
import { supabase } from '../supabaseClient';

export interface SupabaseReportRow {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_price: number;
  listing_image: string;
  seller_id: string;
  seller_name: string;
  reporter_id?: string | null;
  reporter_name?: string | null;
  reporter_email?: string | null;
  reason: string;
  details?: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed' | 'listing_removed';
  action_taken?: string | null;
  created_at?: string;
}

// Submit a report for a listing
export async function submitListingReport(
  item: FurnitureItem,
  reason: string,
  reporter?: { id?: string; name?: string; email?: string },
  customDetails?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const reportRow: SupabaseReportRow = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      listing_id: item.id,
      listing_title: item.title,
      listing_price: item.price,
      listing_image: item.imageUrl,
      seller_id: item.seller.id,
      seller_name: item.seller.name,
      reporter_id: reporter?.id || 'anonymous_reporter',
      reporter_name: reporter?.name || 'PinIn User',
      reporter_email: reporter?.email || null,
      reason: reason,
      details: customDetails?.trim()
        ? `[${reason}] ${customDetails.trim()}`
        : `Reported from listing page for item "${item.title}" in ${item.location} (Reason: ${reason})`,
      status: 'pending',
    };

    const { error } = await supabase.from('reports').insert([reportRow]);

    if (error) {
      console.warn('Supabase report submission note:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit report';
    return { success: false, error: msg };
  }
}

// Fetch all reports (for Admin / Moderation overview)
export async function fetchAllReports(): Promise<SupabaseReportRow[]> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as SupabaseReportRow[];
  } catch {
    return [];
  }
}

// Update report status & take moderation action
export async function updateReportStatus(
  reportId: string,
  status: 'reviewed' | 'resolved' | 'dismissed' | 'listing_removed',
  actionTaken?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('reports')
      .update({
        status,
        action_taken: actionTaken || `Marked as ${status}`,
      })
      .eq('id', reportId);

    return !error;
  } catch {
    return false;
  }
}
