import { FurnitureItem } from '../types/furniture';
import { supabase } from '../supabaseClient';

export interface CartItem {
  id: string; // unique cart entry id
  listingId: string;
  title: string;
  price: number;
  imageUrl: string;
  location: string;
  condition: string;
  sellerName: string;
  sellerId?: string;
  sellerEmail?: string;
  quantity: number;
  addedAt: string;
  size?: string;
}

const CART_STORAGE_KEY = 'pinin_cart_items_v1';
const CART_EVENT_NAME = 'pinin_cart_updated';

// Helper to get cart from localStorage
export function getCartItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Sync to Supabase `user_cart_items` table
async function syncCartItemToSupabase(item: CartItem) {
  try {
    let userEmail: string | undefined;
    let userId: string | undefined;
    try {
      const stored = localStorage.getItem('user_data');
      if (stored) {
        const u = JSON.parse(stored);
        userEmail = u.email;
        userId = u.id;
      }
    } catch {}

    await supabase.from('user_cart_items').upsert([
      {
        id: item.id,
        user_id: userId || null,
        user_email: userEmail || null,
        listing_id: item.listingId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image_url: item.imageUrl,
        size: item.size || null,
        updated_at: new Date().toISOString(),
      },
    ]);
  } catch {}
}

// Helper to save cart to localStorage and trigger change event
function saveCartItems(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CART_EVENT_NAME, { detail: items }));
    }
  } catch (e) {
    console.warn('Failed to save cart to localStorage:', e);
  }
}

// Add item to cart (if already in cart with same size, increment quantity)
export function addToCart(item: FurnitureItem, quantity: number = 1, size?: string): CartItem[] {
  const current = getCartItems();
  const selectedSize = size || item.itemSize || (item as any).size || undefined;
  const existingIndex = current.findIndex(
    (c) => c.listingId === item.id && (!selectedSize || c.size === selectedSize)
  );

  let targetItem: CartItem;
  if (existingIndex > -1) {
    current[existingIndex].quantity += quantity;
    if (selectedSize) {
      current[existingIndex].size = selectedSize;
    }
    targetItem = current[existingIndex];
  } else {
    const newItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      listingId: item.id,
      title: item.title,
      price: Number(item.price) || 0,
      imageUrl: item.imageUrl,
      location: item.location || 'Gauteng',
      condition: item.condition || 'Good',
      sellerName: item.seller?.name || 'PinIn Verified Seller',
      sellerId: item.seller?.id || (item as any).userId,
      sellerEmail: (item.seller as any)?.email,
      quantity: Math.max(1, quantity),
      addedAt: new Date().toISOString(),
      size: selectedSize,
    };
    current.push(newItem);
    targetItem = newItem;
  }

  saveCartItems(current);
  syncCartItemToSupabase(targetItem);
  return current;
}

// Remove item from cart
export function removeFromCart(listingId: string): CartItem[] {
  const current = getCartItems();
  const updated = current.filter((c) => c.listingId !== listingId);
  saveCartItems(updated);
  try {
    supabase.from('user_cart_items').delete().eq('listing_id', listingId).then();
  } catch {}
  return updated;
}

// Update item quantity
export function updateCartQuantity(listingId: string, quantity: number): CartItem[] {
  const current = getCartItems();
  if (quantity <= 0) {
    return removeFromCart(listingId);
  }
  const item = current.find((c) => c.listingId === listingId);
  if (item) {
    item.quantity = quantity;
    saveCartItems(current);
  }
  return current;
}

// Clear all items in cart
export function clearCart(): void {
  saveCartItems([]);
}

// Get total item count in cart
export function getCartCount(): number {
  const items = getCartItems();
  return items.reduce((acc, item) => acc + (item.quantity || 1), 0);
}

// Get cart subtotal in Rand (ZAR)
export function getCartSubtotal(): number {
  const items = getCartItems();
  return items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
}

// Subscribe to cart updates
export function subscribeToCart(callback: (items: CartItem[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<CartItem[]>;
    callback(custom.detail || getCartItems());
  };

  window.addEventListener(CART_EVENT_NAME, handler);
  // initial call
  callback(getCartItems());

  return () => {
    window.removeEventListener(CART_EVENT_NAME, handler);
  };
}
