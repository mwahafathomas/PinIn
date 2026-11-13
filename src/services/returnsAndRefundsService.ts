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

export function saveLocalRefund(ref: RefundRecord) {
  try {
    const existing = getLocalRefunds();
    localStorage.setItem(LOCAL_REFUNDS_KEY, JSON.stringify([ref, ...existing.filter((r) => r.id !== ref.id)]));
  } catch {}
}

/**
 * Record a wallet withdrawal in the Supabase `refunds` table
 */
export async function recordRefundWithdrawal(data: {
  userId?: string;
  userEmail?: string;
  userName?: string;
  amount: number;
}): Promise<{ success: boolean; data?: RefundRecord; error?: string }> {
  const refundNumber = `WDR-${Date.now().toString().slice(-6)}`;
  const record: RefundRecord = {
    id: `wdr_${Date.now()}`,
    refundNumber,
    orderNumber: 'WALLET-WITHDRAWAL',
    userEmail: data.userEmail || '',
    userName: data.userName || 'Account Holder',
    amount: data.amount,
    status: 'Processing',
    reason: 'Wallet balance withdrawal to bank',
    itemBought: 'Wallet Balance Withdrawal',
    created_at: new Date().toISOString(),
  };

  saveLocalRefund(record);

  try {
    const insertPayload: any = {
      refund_number: record.refundNumber,
      order_number: record.orderNumber,
      user_email: record.userEmail,
      user_name: record.userName,
      amount: record.amount,
      status: record.status,
      reason: record.reason,
      item_bought: record.itemBought,
    };

    const { data: inserted, error } = await supabase
      .from('refunds')
      .insert([insertPayload])
      .select();

    if (error) {
      console.warn('Supabase refunds insert notice:', error.message);
    } else if (inserted && inserted[0]) {
      record.id = String(inserted[0].id);
      saveLocalRefund(record);
    }

    // Also record into `refunds_history` table
    try {
      await supabase.from('refunds_history').insert([
        {
          refund_number: record.refundNumber,
          order_number: record.orderNumber,
          user_email: record.userEmail,
          user_id: data.userId || null,
          user_name: record.userName,
          amount: record.amount,
          status: record.status,
          reason: record.reason,
        },
      ]);
    } catch {}
  } catch (err) {
    console.warn('Refund withdrawal recording error:', err);
  }

  return { success: true, data: record };
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
    const insertPayload: any = {
      order_number: record.orderNumber,
      order_id: null,
      user_email: record.userEmail,
      user_name: record.userName,
      listing_id: null,
      item_bought: record.itemBought,
      reason: record.reason,
      description: record.description || null,
      status: record.status,
    };

    const { data: inserted, error } = await supabase
      .from('returns_requests')
      .insert([insertPayload])
      .select();

    if (error) {
      console.warn('Supabase returns_requests notice:', error.message);
    } else if (inserted && inserted[0]) {
      record.id = inserted[0].id;
      saveLocalReturn(record);
    }

    // Insert into Supabase `return_reasons` table
    try {
      await supabase.from('return_reasons').insert([
        {
          order_number: record.orderNumber,
          user_email: record.userEmail,
          user_name: record.userName,
          item_bought: record.itemBought,
          reason: record.reason,
          other_reason_text: record.description || null,
        },
      ]);
    } catch (reasonErr) {
      console.warn('Supabase return_reasons notice:', reasonErr);
    }

    // Update order status in orders table if orderId was provided
    const targetOrderId = data.orderId || record.orderNumber;
    if (data.orderId) {
      try {
        await supabase
          .from('orders')
          .update({
            status: 'Returned',
            delivery_status: 'Returned',
            latest_update: `Return requested: ${record.reason}`,
          })
          .eq('id', data.orderId);
      } catch {}
    }

    // Invoke Supabase Edge Function `send-order-email` for return
    const order = { id: data.orderId || record.orderNumber };
    try {
      console.log('Sending return email for order', order.id);
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-order-email', {
        body: { order_id: order.id, type: 'return' }
      });
      console.log('Return email result', emailData, emailError);
    } catch (e) {
      console.error('Email failed', e);
    }
  } catch (err) {
    console.warn('Returns request error:', err);
  }

  return { success: true, data: record };
}

/**
 * Fetch refunds for a user from Supabase `refunds_history` and `refunds` table
 */
export async function fetchRefundsHistory(userEmail?: string): Promise<RefundRecord[]> {
  const local = getLocalRefunds();

  try {
    // 1. First check `refunds_history` table
    let historyQuery = supabase.from('refunds_history').select('*').order('created_at', { ascending: false });
    if (userEmail && userEmail.trim()) {
      historyQuery = historyQuery.ilike('user_email', userEmail.trim().toLowerCase());
    }

    const { data: historyData, error: historyErr } = await historyQuery;
    if (!historyErr && Array.isArray(historyData) && historyData.length > 0) {
      return historyData.map((row: any) => ({
        id: String(row.id),
        refundNumber: row.refund_number || `REF-${String(row.id).slice(0, 6)}`,
        orderNumber: row.order_number || '',
        userEmail: row.user_email || '',
        userName: row.user_name || '',
        amount: Number(row.amount) || 0,
        status: row.status || 'Processing',
        reason: row.reason || '',
        itemBought: row.item_bought || 'Wallet Balance Withdrawal',
        created_at: row.created_at || new Date().toISOString(),
      }));
    }
  } catch (err) {
    console.warn('refunds_history query notice:', err);
  }

  // 2. Fallback to `refunds` table
  return fetchUserRefunds(userEmail);
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

/**
 * Fetch explanation message from Supabase `order_cancellation_info` table
 */
export async function fetchOrderCancellationMessage(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('order_cancellation_info')
      .select('message')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && Array.isArray(data) && data.length > 0 && data[0]?.message) {
      return String(data[0].message);
    }
  } catch (err) {
    console.warn('[Cancellation Info] Supabase notice:', err);
  }

  return `When you cancel an order, your items will immediately stop processing and will not be prepared or shipped.

A full refund will be processed and credited to your PinIn wallet balance in less than 24 hours.

When you withdraw your wallet balance, the money will be sent directly to the bank account that made the purchase (takes 2 - 5 business days to reflect).

Once confirmed, this cancellation cannot be reversed.`;
}

/**
 * Submit an order cancellation & refund request
 * Records in Supabase `refund_requests` table, updates `refunds` and order status
 */
export async function submitOrderRefundRequest(order: {
  id: string;
  orderNumber: string;
  userEmail?: string;
  buyerEmail?: string;
  userName?: string;
  buyerName?: string;
  username?: string;
  itemBought?: string;
  price?: number;
}): Promise<{ success: boolean; error?: string }> {
  const email = order.userEmail || order.buyerEmail || 'user@pinin.co.za';
  const name = order.userName || order.buyerName || order.username || 'PinIn Buyer';
  const amount = Number(order.price) || 0;
  const refundNumber = `REF-${order.orderNumber.replace('PIN-', '') || Date.now().toString().slice(-6)}`;

  const localRefund: RefundRecord = {
    id: `ref_${Date.now()}`,
    refundNumber,
    orderNumber: order.orderNumber,
    userEmail: email,
    userName: name,
    amount,
    status: 'Processing',
    reason: '',
    itemBought: order.itemBought || 'Cancelled Order Item',
    created_at: new Date().toISOString(),
  };

  saveLocalRefund(localRefund);

  // 1. Insert into Supabase `refund_requests` table
  try {
    const payload = {
      order_number: order.orderNumber,
      order_id: order.id,
      user_email: email,
      user_name: name,
      item_bought: order.itemBought || 'Cancelled Order Item',
      amount,
      status: 'Processing',
      reason: '',
    };

    const { error } = await supabase.from('refund_requests').insert([payload]);
    if (error) {
      console.warn('Supabase refund_requests notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase refund_requests error:', err);
  }

  // 2. Also insert into Supabase `refunds` table
  try {
    const refundsPayload = {
      refund_number: refundNumber,
      order_number: order.orderNumber,
      user_email: email,
      user_name: name,
      amount,
      status: 'Processing',
      reason: '',
      item_bought: order.itemBought || 'Cancelled Order Item',
    };
    await supabase.from('refunds').insert([refundsPayload]);
  } catch {}

  // 3. Update order in Supabase to 'Cancelled'
  try {
    await supabase
      .from('orders')
      .update({
        status: 'Cancelled',
        delivery_status: 'Cancelled',
        latest_update: 'Order cancelled and refund requested',
      })
      .eq('id', order.id);

    try {
      console.log('Sending refund email for order', order.id);
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-order-email', {
        body: { order_id: order.id, type: 'refund' }
      });
      console.log('Refund email result', emailData, emailError);
    } catch (e) {
      console.error('Email failed', e);
    }
  } catch {}

  // 4. Update order in localStorage
  try {
    const raw = localStorage.getItem('pinin_orders_history_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const updated = parsed.map((o: any) =>
          o.id === order.id || o.orderNumber === order.orderNumber
            ? { ...o, status: 'Cancelled', deliveryStatus: 'Cancelled', latestUpdate: 'Order cancelled and refund requested' }
            : o
        );
        localStorage.setItem('pinin_orders_history_v1', JSON.stringify(updated));
      }
    }
  } catch {}

  return { success: true };
}
