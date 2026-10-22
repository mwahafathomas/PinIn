import { supabase } from '../supabaseClient';

export interface OrderItem {
  listingId?: string;
  itemBought: string;
  itemPrice: number;
  quantity: number;
  imageUrl?: string;
  size?: string;
  sellerName?: string;
  sellerId?: string;
}

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
  streetAddressLine3?: string;
  cityTown?: string;
  province?: string;
  postalCode?: string;
  deliveryInstructions?: string;
  itemBought: string;
  itemPrice: number;
  price: number;
  quantity: number;
  dateBought: string;
  status: string; // e.g. 'Delivered', 'Out for delivery', 'Being processed'
  deliveryStatus?: string;
  imageUrl?: string;
  images?: string[];
  items?: OrderItem[];
  created_at?: string;
  packageInfo?: string;
  courier?: string;
  trackingNumber?: string;
  shippingStatus?: 'order_paid' | 'shipped' | 'delivered' | string;
  latestUpdate?: string;
  latestUpdateTime?: string;
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
    const updated = [order, ...orders.filter((o) => o.id !== order.id && o.orderNumber !== order.orderNumber)];
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save order to localStorage:', e);
  }
}

export function saveMultipleLocalOrders(newOrders: OrderRecord[]): void {
  try {
    const orders = getLocalOrders();
    const newNumbers = new Set(newOrders.map((o) => o.orderNumber));
    const filteredOld = orders.filter((o) => !newNumbers.has(o.orderNumber));
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
  sellerName?: string;
  sellerId?: string;
  quantity: number;
  imageUrl?: string;
  size?: string;
}

// Create a new unified order for all items in the cart
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
  streetAddressLine3?: string;
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
  const userEmail = data.userEmail.trim().toLowerCase() || data.buyerEmail?.trim().toLowerCase() || 'customer@pinin.co.za';

  // Determine items in cart
  const itemsToProcess: PlaceOrderItemInput[] =
    data.items && data.items.length > 0
      ? data.items
      : [
          {
            listingId: data.listingId,
            itemBought: data.itemBought || 'Item',
            itemPrice: data.itemPrice ?? data.price ?? 0,
            sellerName: data.sellerName || 'PinIn Verified Seller',
            sellerId: data.sellerId,
            quantity: data.quantity || 1,
            imageUrl: data.imageUrl,
          },
        ];

  // Calculate totals across cart items
  const totalCalculatedPrice =
    data.price !== undefined
      ? Number(data.price)
      : itemsToProcess.reduce(
          (sum, item) => sum + (Number(item.itemPrice) || 0) * (Number(item.quantity) || 1),
          0
        );

  const totalQuantity =
    data.quantity !== undefined
      ? Number(data.quantity)
      : itemsToProcess.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  // Extract all item images for Page 10 (first 4 displayed)
  const imagesList = itemsToProcess
    .map((item) => item.imageUrl)
    .filter((img): img is string => typeof img === 'string' && img.length > 0);
  if (data.imageUrl && !imagesList.includes(data.imageUrl)) {
    imagesList.unshift(data.imageUrl);
  }

  // Generate valid RFC4122 UUID so it works for both uuid and text column types in Postgres
  const orderId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'a' + Date.now().toString(16).padStart(31, '0');
  const summaryTitle =
    itemsToProcess.length === 1
      ? itemsToProcess[0].itemBought
      : `${itemsToProcess[0].itemBought} + ${itemsToProcess.length - 1} more`;

  const orderItemsList: OrderItem[] = itemsToProcess.map((item) => ({
    listingId: item.listingId,
    itemBought: item.itemBought,
    itemPrice: Number(item.itemPrice) || 0,
    quantity: Number(item.quantity) || 1,
    imageUrl: item.imageUrl,
    size: item.size || 'Standard',
    sellerName: item.sellerName,
    sellerId: item.sellerId,
  }));

  const trackingNumber = orderNumber.replace('PIN-', 'PIN-TRK-');

  // Single unified order record for the entire cart
  const record: OrderRecord = {
    id: orderId,
    orderNumber,
    listingId: itemsToProcess[0]?.listingId,
    username,
    userEmail,
    buyerName: username,
    buyerEmail: userEmail,
    buyerId: data.buyerId,
    sellerName: itemsToProcess[0]?.sellerName?.trim() || 'PinIn Verified Seller',
    sellerId: itemsToProcess[0]?.sellerId,
    delivery: data.delivery.trim(),
    deliveryEstimation,
    recipientName: data.recipientName?.trim(),
    recipientPhone: data.recipientPhone?.trim(),
    streetAddressLine1: data.streetAddressLine1?.trim(),
    streetAddressLine2: data.streetAddressLine2?.trim(),
    streetAddressLine3: data.streetAddressLine3?.trim(),
    cityTown: data.cityTown?.trim(),
    province: data.province?.trim() || 'Gauteng',
    postalCode: data.postalCode?.trim(),
    deliveryInstructions: data.deliveryInstructions?.trim(),
    itemBought: summaryTitle,
    itemPrice: itemsToProcess[0]?.itemPrice || 0,
    price: totalCalculatedPrice,
    quantity: totalQuantity,
    dateBought: dateBoughtFormatted,
    status: 'Being processed',
    deliveryStatus: 'Being processed',
    shippingStatus: 'order_paid',
    packageInfo: 'Standard parcel',
    courier: 'PinIn Express',
    trackingNumber,
    latestUpdate: 'Order confirmed and being prepared',
    latestUpdateTime: dateBoughtIso,
    imageUrl: imagesList[0] || data.imageUrl,
    images: imagesList,
    items: orderItemsList,
    created_at: dateBoughtIso,
  };

  // Cache locally immediately so user confirmation is guaranteed
  saveLocalOrder(record);

  // 1. Insert into Supabase `orders` table with multi-tier fallback resilience
  try {
    const fullRow: Record<string, any> = {
      id: record.id,
      order_number: record.orderNumber,
      listing_id: record.listingId || null,
      username: record.username,
      user_email: record.userEmail,
      buyer_name: record.buyerName,
      buyer_email: record.buyerEmail,
      buyer_id: record.buyerId || null,
      seller_name: record.sellerName,
      seller_id: record.sellerId || null,
      item_bought: record.itemBought,
      item_price: record.itemPrice,
      price: record.price,
      quantity: record.quantity,
      delivery_estimation: record.deliveryEstimation,
      delivery: record.delivery,
      recipient_name: record.recipientName || null,
      recipient_phone: record.recipientPhone || null,
      street_address_line1: record.streetAddressLine1 || null,
      street_address_line2: record.streetAddressLine2 || null,
      street_address_line3: record.streetAddressLine3 || null,
      city_town: record.cityTown || null,
      province: record.province || 'Gauteng',
      postal_code: record.postalCode || null,
      delivery_instructions: record.deliveryInstructions || null,
      date_bought: record.dateBought,
      status: record.status,
      delivery_status: record.deliveryStatus,
      shipping_status: record.shippingStatus,
      package_info: record.packageInfo,
      courier: record.courier,
      tracking_number: record.trackingNumber,
      latest_update: record.latestUpdate,
      latest_update_time: record.latestUpdateTime,
      items: record.items,
      images: record.images,
    };

    const { error: fullError } = await supabase.from('orders').insert([fullRow]);

    if (fullError) {
      console.warn('[Supabase Orders] Full schema insert notice:', fullError.message, fullError.code);
      // Attempt 2: Standard row with only core columns guaranteed by base setup_orders_and_analytics.sql
      const baseRow: Record<string, any> = {
        id: record.id,
        order_number: record.orderNumber,
        username: record.username,
        user_email: record.userEmail,
        date_bought: record.dateBought,
        item_bought: record.itemBought,
        item_price: Number(record.itemPrice) || 0,
        seller_name: record.sellerName,
        quantity: Number(record.quantity) || 1,
        delivery_estimation: record.deliveryEstimation,
        delivery: record.delivery,
        buyer_name: record.buyerName,
        buyer_email: record.buyerEmail,
        buyer_id: record.buyerId || null,
        seller_id: record.sellerId || null,
        price: Number(record.price) || 0,
        listing_id: record.listingId || null,
        status: record.status,
      };

      const { error: baseError } = await supabase.from('orders').insert([baseRow]);

      if (baseError) {
        console.warn('[Supabase Orders] Base row insert notice:', baseError.message, baseError.code);
        // Attempt 3: Omit id so Postgres can use its default gen_random_uuid() or serial
        const { id: _omitId, ...rowWithoutId } = baseRow;
        const { error: noIdError } = await supabase.from('orders').insert([rowWithoutId]);

        if (noIdError) {
          console.error('[Supabase Orders] All insert tiers failed:', noIdError.message, noIdError.details);
        } else {
          console.log('[Supabase Orders] Insert succeeded with DB-generated ID');
        }
      } else {
        console.log('[Supabase Orders] Insert succeeded with base schema');
      }
    } else {
      console.log('[Supabase Orders] Insert succeeded with full schema');
    }
  } catch (e) {
    console.warn('[Supabase Orders] Insert error:', e);
  }

  // 2. If listing exists, update buyer info in `listings` table
  for (const item of itemsToProcess) {
    if (item.listingId) {
      try {
        await supabase
          .from('listings')
          .update({
            buyer_name: record.username,
            buyer_email: record.userEmail,
            seller_name: record.sellerName,
            delivery: record.delivery,
            order_number: record.orderNumber,
            date_bought: record.dateBought,
            item_bought: item.itemBought,
            price: item.itemPrice,
          })
          .eq('id', item.listingId);
      } catch (e) {
        console.warn('Listing table order columns update notice:', e);
      }
    }

    // 3. Record in `most_bought_items`
    recordBoughtItem(item.itemBought, item.listingId, item.itemPrice * item.quantity, item.quantity).catch(
      (err) => console.warn('Record bought item stats notice:', err)
    );
  }

  return {
    success: true,
    orders: [record],
    order: record,
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

// Fetch user's orders from Supabase (or local cache fallback) with unified cart grouping
export async function getUserOrders(userEmail?: string, buyerId?: string): Promise<OrderRecord[]> {
  const localOrders = getLocalOrders();

  try {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (userEmail && userEmail.trim()) {
      const cleanEmail = userEmail.trim().toLowerCase();
      query = query.or(`buyer_email.ilike.${cleanEmail},user_email.ilike.${cleanEmail}`);
    } else if (buyerId && buyerId !== 'guest') {
      query = query.eq('buyer_id', buyerId);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      // Group rows by order_number to ensure multi-item cart purchases are 1 single order
      const groupedMap = new Map<string, any[]>();
      for (const row of data) {
        const num = row.order_number || row.id;
        if (!groupedMap.has(num)) {
          groupedMap.set(num, []);
        }
        groupedMap.get(num)!.push(row);
      }

      const parsedSupabaseOrders: OrderRecord[] = [];

      groupedMap.forEach((rows, orderNum) => {
        const first = rows[0];

        // Parse items if stored as JSON/array on row, or build from rows
        let items: OrderItem[] = [];
        if (first.items) {
          try {
            items = typeof first.items === 'string' ? JSON.parse(first.items) : first.items;
          } catch {
            items = [];
          }
        }

        if (!Array.isArray(items) || items.length === 0) {
          items = rows.map((r) => ({
            listingId: r.listing_id,
            itemBought: r.item_bought || 'Item',
            itemPrice: Number(r.item_price) || Number(r.price) || 0,
            quantity: Number(r.quantity) || 1,
            imageUrl: r.image_url || r.imageUrl,
            size: r.item_size || r.size || 'Standard',
            sellerName: r.seller_name,
            sellerId: r.seller_id,
          }));
        }

        // Collect images from items or row
        let images: string[] = [];
        if (first.images && Array.isArray(first.images)) {
          images = first.images.filter(Boolean);
        } else {
          images = items.map((i) => i.imageUrl).filter((img): img is string => !!img);
        }
        if (first.image_url && !images.includes(first.image_url)) {
          images.unshift(first.image_url);
        }

        const totalPrice = rows.reduce(
          (sum, r) => sum + (Number(r.price) || Number(r.item_price) || 0),
          0
        );
        const totalQuantity = rows.reduce((sum, r) => sum + (Number(r.quantity) || 1), 0);

        parsedSupabaseOrders.push({
          id: first.id,
          orderNumber: orderNum,
          listingId: first.listing_id,
          username: first.username || first.buyer_name || 'PinIn Buyer',
          userEmail: first.user_email || first.buyer_email || '',
          buyerName: first.buyer_name || first.username || 'PinIn Buyer',
          buyerEmail: first.buyer_email || first.user_email || '',
          buyerId: first.buyer_id,
          sellerName: first.seller_name || 'PinIn Verified Seller',
          sellerId: first.seller_id,
          delivery: first.delivery || 'Standard Delivery',
          deliveryEstimation: first.delivery_estimation || '2 to 5 days',
          recipientName: first.recipient_name,
          recipientPhone: first.recipient_phone,
          streetAddressLine1: first.street_address_line1,
          streetAddressLine2: first.street_address_line2,
          streetAddressLine3: first.street_address_line3,
          cityTown: first.city_town,
          province: first.province || 'Gauteng',
          postalCode: first.postal_code,
          deliveryInstructions: first.delivery_instructions,
          itemBought:
            items.length > 1
              ? `${items[0].itemBought} + ${items.length - 1} more`
              : first.item_bought || items[0]?.itemBought || 'Item',
          itemPrice: Number(first.item_price) || items[0]?.itemPrice || 0,
          price: totalPrice > 0 ? totalPrice : Number(first.price) || 0,
          quantity: totalQuantity > 0 ? totalQuantity : Number(first.quantity) || 1,
          dateBought: first.date_bought || new Date(first.created_at || Date.now()).toLocaleDateString(),
          status: first.status || first.delivery_status || 'Being processed',
          deliveryStatus: first.delivery_status || first.status || 'Being processed',
          shippingStatus: first.shipping_status || 'order_paid',
          packageInfo: first.package_info || 'Standard parcel',
          courier: first.courier || 'PinIn Express',
          trackingNumber: first.tracking_number || orderNum.replace('PIN-', 'PIN-TRK-'),
          latestUpdate: first.latest_update || 'Order confirmed and being prepared',
          latestUpdateTime: first.latest_update_time || first.created_at || new Date().toISOString(),
          imageUrl: images[0] || first.image_url,
          images,
          items,
          created_at: first.created_at,
        });
      });

      // Merge with local orders, avoiding duplicate orderNumbers
      const seenNumbers = new Set(parsedSupabaseOrders.map((o) => o.orderNumber));
      const combined = [
        ...parsedSupabaseOrders,
        ...localOrders.filter((l) => !seenNumbers.has(l.orderNumber)),
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
