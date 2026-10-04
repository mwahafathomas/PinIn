import { supabase } from '../supabaseClient';

export interface OrderRecord {
  id: string;
  orderNumber: string;
  listingId?: string;
  username: string;
  userEmail: string;
  buyerName: string;
  buyerEmail: string;
  buyerId?: string;
  sellerName: string;
  sellerId?: string;
  delivery: string;
  deliveryEstimation: string;
  recipientName?: string;
  recipientPhone?: string;
  streetAddressLine1?: string;
  streetAddressLine2?: string;
  cityTown?: string;
  province?: string;
  postalCode?: string;
  deliveryInstructions?: string;
  itemBought: string;
  itemPrice: number;
  price: number;
  quantity: number;
  dateBought: string;
  status: string;
  imageUrl?: string;
  created_at?: string;
}

const ORDERS_STORAGE_KEY = 'pinin_orders_history_v1';

// Generate a readable PinIn order number (e.g. PIN-839210)
export function generateOrderNumber(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `PIN-${randomNum}`;
}

// Format delivery estimation: 2 days to 5 days from order date
export function calculateDeliveryEstimation(baseDate: Date = new Date()): string {
  const start = new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  const end = new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `2 to 5 days (${start.toLocaleDateString('en-ZA', options)} - ${end.toLocaleDateString('en-ZA', options)})`;
}

// Local cache helpers
export function getLocalOrders(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalOrder(order: OrderRecord): void {
  try {
    const orders = getLocalOrders();
    // Prepend new order
    const updated = [order, ...orders.filter((o) => o.id !== order.id && o.orderNumber !== order.orderNumber)];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save order to localStorage:', e);
  }
}

export function saveMultipleLocalOrders(newOrders: OrderRecord[]): void {
  try {
    const orders = getLocalOrders();
    const newIds = new Set(newOrders.map((o) => o.id));
    const filteredOld = orders.filter((o) => !newIds.has(o.id));
    const combined = [...newOrders, ...filteredOld];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(combined));
  } catch (e) {
    console.warn('Failed to save orders to localStorage:', e);
  }
}

export interface PlaceOrderItemInput {
  listingId?: string;
  itemBought: string;
  itemPrice: number;
  sellerName: string;
  sellerId?: string;
  quantity: number;
  imageUrl?: string;
}

// Create a new order (or multiple orders for cart items) in Supabase and update stats
export async function createOrder(data: {
  orderNumber?: string;
  username: string;
  userEmail: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerId?: string;
  sellerName?: string;
  sellerId?: string;
  listingId?: string;
  delivery: string;
  deliveryEstimation?: string;
  recipientName?: string;
  recipientPhone?: string;
  streetAddressLine1?: string;
  streetAddressLine2?: string;
  cityTown?: string;
  province?: string;
  postalCode?: string;
  deliveryInstructions?: string;
  itemBought?: string;
  itemPrice?: number;
  price?: number;
  quantity?: number;
  imageUrl?: string;
  items?: PlaceOrderItemInput[];
}): Promise<{ success: boolean; orders: OrderRecord[]; order: OrderRecord; error?: string }> {
  const orderNumber = data.orderNumber || generateOrderNumber();
  const now = new Date();
  const dateBoughtIso = now.toISOString();
  const dateBoughtFormatted = now.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const deliveryEstimation = data.deliveryEstimation || calculateDeliveryEstimation(now);

  const username = data.username.trim() || data.buyerName?.trim() || 'PinIn Buyer';
  const userEmail = data.userEmail.trim().toLowerCase() || data.buyerEmail?.trim().toLowerCase() || '';

  // Determine items to insert
  const itemsToProcess: PlaceOrderItemInput[] =
    data.items && data.items.length > 0
      ? data.items
      : [
          {
            listingId: data.listingId,
            itemBought: data.itemBought || 'Furniture Item',
            itemPrice: data.itemPrice ?? data.price ?? 0,
            sellerName: data.sellerName || 'PinIn Verified Seller',
            sellerId: data.sellerId,
            quantity: data.quantity || 1,
            imageUrl: data.imageUrl,
          },
        ];

  const createdOrders: OrderRecord[] = [];

  for (let index = 0; index < itemsToProcess.length; index++) {
    const item = itemsToProcess[index];
    const orderId = `ord_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`;
    const lineTotal = (Number(item.itemPrice) || 0) * (Number(item.quantity) || 1);

    const record: OrderRecord = {
      id: orderId,
      orderNumber,
      listingId: item.listingId,
      username,
      userEmail,
      buyerName: username,
      buyerEmail: userEmail,
      buyerId: data.buyerId,
      sellerName: item.sellerName.trim() || 'PinIn Verified Seller',
      sellerId: item.sellerId,
      delivery: data.delivery.trim(),
      deliveryEstimation,
      recipientName: data.recipientName?.trim(),
      recipientPhone: data.recipientPhone?.trim(),
      streetAddressLine1: data.streetAddressLine1?.trim(),
      streetAddressLine2: data.streetAddressLine2?.trim(),
      cityTown: data.cityTown?.trim(),
      province: data.province?.trim() || 'Gauteng',
      postalCode: data.postalCode?.trim(),
      deliveryInstructions: data.deliveryInstructions?.trim(),
      itemBought: item.itemBought.trim(),
      itemPrice: Number(item.itemPrice) || 0,
      price: lineTotal,
      quantity: Number(item.quantity) || 1,
      dateBought: dateBoughtFormatted,
      status: 'Completed',
      imageUrl: item.imageUrl,
      created_at: dateBoughtIso,
    };

    createdOrders.push(record);
  }

  // Cache locally immediately so user confirmation is guaranteed
  saveMultipleLocalOrders(createdOrders);

  // 1. Insert into Supabase `orders` table
  try {
    const rowsToInsert = createdOrders.map((rec) => ({
      id: rec.id,
      order_number: rec.orderNumber,
      listing_id: rec.listingId || null,
      username: rec.username,
      user_email: rec.userEmail,
      buyer_name: rec.buyerName,
      buyer_email: rec.buyerEmail,
      buyer_id: rec.buyerId || null,
      seller_name: rec.sellerName,
      seller_id: rec.sellerId || null,
      item_bought: rec.itemBought,
      item_price: rec.itemPrice,
      price: rec.price,
      quantity: rec.quantity,
      delivery_estimation: rec.deliveryEstimation,
      delivery: rec.delivery,
      recipient_name: rec.recipientName || null,
      recipient_phone: rec.recipientPhone || null,
      street_address_line1: rec.streetAddressLine1 || null,
      street_address_line2: rec.streetAddressLine2 || null,
      city_town: rec.cityTown || null,
      province: rec.province || 'Gauteng',
      postal_code: rec.postalCode || null,
      delivery_instructions: rec.deliveryInstructions || null,
      date_bought: rec.dateBought,
      status: rec.status,
    }));

    const { error: insertError } = await supabase.from('orders').insert(rowsToInsert);

    if (insertError) {
      console.warn('Supabase orders insert notice (using local storage cache):', insertError.message);
      // Fallback: try inserting with legacy columns if newer ones are not yet migrated
      try {
        const fallbackRows = createdOrders.map((rec) => ({
          id: rec.id,
          order_number: rec.orderNumber,
          listing_id: rec.listingId || null,
          buyer_name: rec.buyerName,
          buyer_email: rec.buyerEmail,
          buyer_id: rec.buyerId || null,
          seller_name: rec.sellerName,
          seller_id: rec.sellerId || null,
          delivery: rec.delivery,
          item_bought: rec.itemBought,
          price: rec.price,
          date_bought: rec.dateBought,
          status: rec.status,
        }));
        await supabase.from('orders').insert(fallbackRows);
      } catch (fallbackErr) {
        console.warn('Fallback insert error:', fallbackErr);
      }
    }
  } catch (e) {
    console.warn('Supabase orders table error:', e);
  }

  // 2. If listing exists, update buyer info in `listings` table
  for (const ord of createdOrders) {
    if (ord.listingId) {
      try {
        await supabase
          .from('listings')
          .update({
            buyer_name: ord.username,
            buyer_email: ord.userEmail,
            seller_name: ord.sellerName,
            delivery: ord.delivery,
            order_number: ord.orderNumber,
            date_bought: ord.dateBought,
            item_bought: ord.itemBought,
            price: ord.itemPrice,
          })
          .eq('id', ord.listingId);
      } catch (e) {
        console.warn('Listing table order columns update notice:', e);
      }
    }

    // 3. Record in `most_bought_items`
    recordBoughtItem(ord.itemBought, ord.listingId, ord.itemPrice * ord.quantity, ord.quantity).catch(
      (err) => console.warn('Record bought item stats notice:', err)
    );
  }

  return {
    success: true,
    orders: createdOrders,
    order: createdOrders[0],
  };
}

// Record an item purchase in `most_bought_items` table
export async function recordBoughtItem(
  itemTitle: string,
  listingId?: string,
  revenue: number = 0,
  quantity: number = 1
): Promise<void> {
  const cleanTitle = itemTitle.trim();
  if (!cleanTitle) return;

  try {
    // Check if item exists in `most_bought_items`
    const { data: existing } = await supabase
      .from('most_bought_items')
      .select('id, total_sold, total_revenue')
      .ilike('item_title', cleanTitle)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('most_bought_items')
        .update({
          total_sold: (existing.total_sold || 0) + quantity,
          total_revenue: (Number(existing.total_revenue) || 0) + revenue,
          last_bought_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('most_bought_items').insert([
        {
          item_title: cleanTitle,
          listing_id: listingId || null,
          total_sold: quantity,
          total_revenue: revenue,
          last_bought_at: new Date().toISOString(),
        },
      ]);
    }
  } catch (e) {
    console.warn('Failed to update most_bought_items in Supabase:', e);
  }
}

// Record a search query in `most_searched_items` table
export async function recordSearchQuery(query: string, category?: string): Promise<void> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) return;

  try {
    const { data: existing } = await supabase
      .from('most_searched_items')
      .select('id, search_count')
      .ilike('query', cleanQuery)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('most_searched_items')
        .update({
          search_count: (existing.search_count || 1) + 1,
          last_searched_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('most_searched_items').insert([
        {
          query: cleanQuery,
          search_count: 1,
          category: category || null,
          last_searched_at: new Date().toISOString(),
        },
      ]);
    }
  } catch (e) {
    console.warn('Failed to record search query:', e);
  }
}

// Fetch user's orders from Supabase (or local cache fallback)
export async function getUserOrders(userEmail?: string, buyerId?: string): Promise<OrderRecord[]> {
  const localOrders = getLocalOrders();

  try {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (userEmail) {
      query = query.ilike('buyer_email', userEmail.trim().toLowerCase());
    } else if (buyerId) {
      query = query.eq('buyer_id', buyerId);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      const parsedSupabaseOrders: OrderRecord[] = data.map((row) => ({
        id: row.id,
        orderNumber: row.order_number,
        listingId: row.listing_id,
        username: row.username || row.buyer_name || 'PinIn Buyer',
        userEmail: row.user_email || row.buyer_email || '',
        buyerName: row.buyer_name || row.username || 'PinIn Buyer',
        buyerEmail: row.buyer_email || row.user_email || '',
        buyerId: row.buyer_id,
        sellerName: row.seller_name || 'PinIn Verified Seller',
        sellerId: row.seller_id,
        delivery: row.delivery || 'Standard Delivery',
        deliveryEstimation: row.delivery_estimation || '2 to 5 days',
        itemBought: row.item_bought || 'Furniture Item',
        itemPrice: Number(row.item_price) || Number(row.price) || 0,
        price: Number(row.price) || Number(row.item_price) || 0,
        quantity: Number(row.quantity) || 1,
        dateBought: row.date_bought || new Date(row.created_at || Date.now()).toLocaleDateString(),
        status: row.status || 'Completed',
        created_at: row.created_at,
      }));

      // Merge with local orders, avoiding duplicates
      const seenIds = new Set(parsedSupabaseOrders.map((o) => o.id));
      const seenNumbers = new Set(parsedSupabaseOrders.map((o) => o.orderNumber));
      const combined = [
        ...parsedSupabaseOrders,
        ...localOrders.filter((l) => !seenIds.has(l.id) && !seenNumbers.has(l.orderNumber)),
      ];
      return combined;
    }
  } catch (e) {
    console.warn('Orders query notice:', e);
  }

  return localOrders;
}

// Aliases for compatibility
export const fetchUserOrders = getUserOrders;
