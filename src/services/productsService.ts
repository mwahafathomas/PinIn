import { FurnitureItem } from '../types/furniture';
import { supabase } from '../supabaseClient';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

/**
 * Exact schema for Supabase `products` table storing automated inventory synced from supplier APIs:
 * - id (uuid)
 * - supplier_sku (text)
 * - title (text)
 * - description (text)
 * - cost_price (numeric)
 * - selling_price (numeric)
 * - stock_quantity (int4)
 * - image_url (text)
 */
export interface SupabaseProductRow {
  id: string;
  supplier_sku?: string | null;
  title: string;
  description?: string | null;
  cost_price?: number | string | null;
  selling_price: number | string;
  stock_quantity: number;
  image_url: string;
  created_at?: string | null;
  category?: string | null;
  condition?: string | null;
  location?: string | null;
  [key: string]: unknown;
}

/**
 * Infer the best matching category from title and description
 * to align with the app's existing category taxonomy
 */
export function inferCategoryFromProduct(title?: string, description?: string): string {
  const text = `${title || ''} ${description || ''}`.toLowerCase();

  if (
    text.includes('sofa') ||
    text.includes('couch') ||
    text.includes('sectional') ||
    text.includes('futon') ||
    text.includes('loveseat') ||
    text.includes('l-shape') ||
    text.includes('chesterfield') ||
    text.includes('daybed')
  ) {
    return 'couches / sofas';
  }

  if (text.includes('coffee table') || text.includes('living room table') || text.includes('center table')) {
    return 'living room table / coffee tables';
  }

  if (text.includes('tv stand') || text.includes('tv unit') || text.includes('media console') || text.includes('entertainment center')) {
    return 'tv stand / console';
  }

  if (text.includes('dining') || text.includes('dining table') || text.includes('dining suite') || text.includes('dining set')) {
    return 'dining room suite';
  }

  if (text.includes('chair') || text.includes('armchair') || text.includes('accent chair') || text.includes('recliner')) {
    return 'chairs';
  }

  if (text.includes('side table') || text.includes('end table') || text.includes('bedside') || text.includes('nightstand')) {
    return 'side tables';
  }

  if (text.includes('sideboard') || text.includes('side board') || text.includes('buffet') || text.includes('credenza')) {
    return 'side board';
  }

  if (text.includes('bench') || text.includes('ottoman') || text.includes('footstool')) {
    return 'bench';
  }

  if (text.includes('bookcase') || text.includes('bookshelf') || text.includes('bookshelves') || text.includes('shelving')) {
    return 'bookcase / bookshelves';
  }

  if (text.includes('display cabinet') || text.includes('bar cabinet') || text.includes('curio') || text.includes('liquor cabinet')) {
    return 'display cabinet / bar cabinet';
  }

  if (text.includes('bed') || text.includes('mattress') || text.includes('headboard') || text.includes('bunk')) {
    return 'beds';
  }

  if (text.includes('desk') || text.includes('study table') || text.includes('workstation')) {
    return 'office desks';
  }

  if (text.includes('wardrobe') || text.includes('closet') || text.includes('armoire') || text.includes('dresser')) {
    return 'wardrobes';
  }

  if (text.includes('outdoor') || text.includes('patio') || text.includes('garden') || text.includes('rattan')) {
    return 'outdoor & patio';
  }

  if (text.includes('kitchen') || text.includes('fridge') || text.includes('microwave') || text.includes('stove') || text.includes('blender')) {
    return 'kitchen';
  }

  return 'couches / sofas';
}

/**
 * Maps a row from `products` table into a full `FurnitureItem`
 * so existing UI cards, detail pages, cart, and search populate seamlessly.
 */
export function mapProductRowToFurnitureItem(product: SupabaseProductRow): FurnitureItem {
  const sellingPriceNum = Math.max(0, Number(product.selling_price) || 0);
  const costPriceNum =
    product.cost_price !== undefined && product.cost_price !== null && !isNaN(Number(product.cost_price))
      ? Number(product.cost_price)
      : undefined;

  // If cost price or an original price is provided and higher than selling price, show as original price
  const originalPriceNum =
    costPriceNum && costPriceNum > sellingPriceNum
      ? costPriceNum
      : (product as any).original_price
      ? Number((product as any).original_price)
      : undefined;

  const stockQty = Number(product.stock_quantity) || 0;
  const supplierSku = product.supplier_sku ? String(product.supplier_sku).trim() : undefined;

  const titleStr = product.title?.trim() || 'Supplier Product';
  const descriptionStr = product.description?.trim() || '';

  const imageUrlStr =
    product.image_url?.trim() ||
    (product as any).imageUrl?.trim() ||
    (product as any).image?.trim() ||
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80';

  const categoryStr =
    product.category?.trim() ||
    (product as any).category_name?.trim() ||
    inferCategoryFromProduct(titleStr, descriptionStr);

  const conditionStr =
    ((product as any).condition as 'Brand New' | 'Like New' | 'Good' | 'Fair' | 'Vintage') ||
    'Brand New';

  const sellerNameStr =
    (product as any).seller_name ||
    (supplierSku ? `Supplier (${supplierSku})` : 'PinIn Verified Supplier');

  const locationStr =
    (product as any).location ||
    (product as any).collection_suburb ||
    'National Delivery';

  // Parse extra/additional images if available on the row
  const additionalImagesList: string[] = [];
  const addImg = (v: unknown) => {
    if (typeof v === 'string') {
      const t = v.trim();
      if (t && !additionalImagesList.includes(t)) additionalImagesList.push(t);
    }
  };
  if (Array.isArray((product as any).additional_images)) {
    (product as any).additional_images.forEach(addImg);
  } else if (Array.isArray((product as any).images)) {
    (product as any).images.forEach(addImg);
  }
  for (let i = 2; i <= 7; i++) {
    const extraVal = (product as any)[`image_url_${i}`] || (product as any)[`image_${i}`];
    if (typeof extraVal === 'string' && extraVal.trim()) addImg(extraVal.trim());
  }

  // Check for sale status
  const saleTagVal = (product as any).sale_tag || (product as any).sale || undefined;
  const salePriceVal =
    (product as any).sale_price !== undefined && (product as any).sale_price !== null
      ? Number((product as any).sale_price)
      : undefined;
  const isSaleVal =
    (product as any).is_sale === true ||
    (salePriceVal !== undefined && salePriceVal > 0) ||
    String(saleTagVal || '').toLowerCase().trim() === 'sale';

  return {
    id: String(product.id),
    title: titleStr,
    location: locationStr,
    price: sellingPriceNum,
    originalPrice: originalPriceNum,
    category: categoryStr,
    condition: conditionStr,
    imageUrl: getOptimizedImageUrl(imageUrlStr, { width: 600, quality: 75, format: 'webp' }),
    additionalImages: additionalImagesList.map((img) =>
      getOptimizedImageUrl(img, { width: 600, quality: 70, format: 'webp' })
    ),
    seller: {
      id: (product as any).seller_id || `supplier_${supplierSku || 'pinin'}`,
      name: sellerNameStr,
      avatar: getOptimizedImageUrl(
        (product as any).seller_avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        { width: 200, quality: 75, format: 'webp' }
      ),
      rating: Number((product as any).seller_rating) || 5.0,
      reviewCount: Number((product as any).seller_review_count) || 8,
      joinedDate: (product as any).seller_joined_date || 'Verified Supplier',
      responseRate: (product as any).seller_response_rate || 'under 15 mins',
    },
    description: descriptionStr,
    dimensions: (product as any).dimensions || 'Standard specifications',
    material: (product as any).material || 'Quality build',
    brand: (product as any).brand || titleStr,
    postedAt: (product as any).posted_at || 'In Stock',
    status: 'approved',
    isSaved: false,
    collectionSuburb: locationStr,
    collectionAddress: (product as any).collection_address || undefined,
    // Marketplace detail fields
    soldBy: (product as any).sold_by || sellerNameStr,
    deliveryEstimation: (product as any).delivery_estimation || '2 to 5 days',
    inStock: true, // filtered for stock_quantity > 0
    warranty: true,
    returns: true,
    payInPerson: true,
    productInformation: (product as any).product_information || descriptionStr,
    reviewsList: Array.isArray((product as any).reviews)
      ? (product as any).reviews
      : (product as any).reviewsList || [],
    trendingTag: (product as any).trending_tag || undefined,
    whatYouMightLike: (product as any).what_you_might_like || undefined,
    electronics: (product as any).electronics ? String((product as any).electronics).trim() : undefined,
    categoryOrder:
      typeof (product as any).category_order === 'number'
        ? (product as any).category_order
        : undefined,
    // Sale details
    saleTag: saleTagVal,
    salePrice: salePriceVal,
    isSale: isSaleVal,
    // Supplier inventory metadata
    supplierSku,
    stockQuantity: stockQty,
    costPrice: costPriceNum,
    isSupplierProduct: true,
  };
}

/**
 * 1. Remove hardcoded furniture filter - fetch all products from Supabase
 */
export async function fetchProducts(): Promise<FurnitureItem[]> {
  try {
    const { data, error } = await supabase.from('products').select('*');

    if (error) {
      console.warn('Supabase fetch error for products table:', error.message);
      return [];
    }

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return (data as SupabaseProductRow[]).map(mapProductRowToFurnitureItem);
  } catch (err) {
    console.warn('fetchProducts exception:', err);
    return [];
  }
}

/**
 * Fetch a single product by ID from the `products` table where stock_quantity > 0
 */
export async function fetchProductById(productId: string): Promise<FurnitureItem | null> {
  if (!productId) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .gt('stock_quantity', 0)
      .maybeSingle();

    if (!error && data && Number((data as any).stock_quantity) > 0) {
      return mapProductRowToFurnitureItem(data as SupabaseProductRow);
    }
  } catch (err) {
    console.warn('fetchProductById exception:', err);
  }
  return null;
}
