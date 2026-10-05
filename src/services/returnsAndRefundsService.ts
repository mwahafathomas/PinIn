import { supabase } from '../supabaseClient';

export interface ReturnRequest {
  id: string;
  orderNumber: string;
  orderId?: string;
  userEmail: string;
  userName: string;
  listingId?: string;
  itemBought: string;
  reason: string;
  description?: string;
  status: string;
  created_at?: string;
}

export interface RefundRecord {
  id: string;
  refundNumber: string;
  orderNumber: string;
  userEmail: string;
  userName: string;
  amount: number;
  status: string; // 'Processing' | 'Approved' | 'Refunded' | 'Rejected'
  reason?: string;
  itemBought?: string;
  created_at?: string;
}

const LOCAL_RETURNS_KEY = 'pinin_local_returns_requests_v1';
const LOCAL_REFUNDS_KEY = 'pinin_local_refunds_v1';

export function getLocalReturns(): ReturnRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_RETURNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalReturn(req: ReturnRequest) {
  try {
    const existing = getLocalReturns();
    localStorage.setItem(LOCAL_RETURNS_KEY, JSON.stringify([req, ...existing.filter((r) => r.id !== req.id)]));
  } catch {}
}

export function getLocalRefunds(): RefundRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_REFUNDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Submit return request to Supabase `returns_requests` table
 */
export async function submitReturnRequest(data: {
  orderNumber: string;
  orderId?: string;
  userEmail: string;
  userName: string;
  listingId?: string;
  itemBought: string;
  reason: string;
  description?: string;
}): Promise<{ success: boolean; data?: ReturnRequest; error?: string }> {
  const newId = `ret_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const record: ReturnRequest = {
    id: newId,
    orderNumber: data.orderNumber,
    orderId: data.orderId,
    userEmail: data.userEmail,
    userName: data.userName,
    listingId: data.listingId,
    itemBought: data.itemBought,
    reason: data.reason,
    description: data.description,
    status: 'Pending',
    created_at: new Date().toISOString(),
  };

  saveLocalReturn(record);

  try {
    const { error } = await supabase.from('returns_requests').insert([
      {
        id: record.id,
        order_number: record.orderNumber,
        order_id: record.orderId || null,
        user_email: record.userEmail,
        user_name: record.userName,
        listing_id: record.listingId || null,
        item_bought: record.itemBought,
        reason: record.reason,
        description: record.description || null,
        status: record.status,
      },
    ]);

    if (error) {
      console.warn('Supabase returns_requests notice:', error.message);
    }
  } catch (err) {
    console.warn('Returns request error:', err);
  }

  return { success: true, data: record };
}

/**
 * Fetch refunds for a user from Supabase `refunds` table
 */
export async function fetchUserRefunds(userEmail?: string): Promise<RefundRecord[]> {
  const local = getLocalRefunds();

  try {
    let query = supabase.from('refunds').select('*').order('created_at', { ascending: false });
    if (userEmail && userEmail.trim()) {
      query = query.ilike('user_email', userEmail.trim().toLowerCase());
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row: any) => ({
        id: String(row.id),
        refundNumber: row.refund_number || `REF-${row.id.slice(0, 6)}`,
        orderNumber: row.order_number || '',
        userEmail: row.user_email || '',
        userName: row.user_name || '',
        amount: Number(row.amount) || 0,
        status: row.status || 'Processing',
        reason: row.reason || '',
        itemBought: row.item_bought || 'Purchased Item',
        created_at: row.created_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn('Refunds query notice:', err);
  }

  return local;
}
