import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ygkyxxrrfcvypcvmnzke.supabase.co';
const cleanUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable__TcJkIYGsFBbmJ66gUcmzA_hJGn38yE';

interface DummyJsonProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  thumbnail: string;
}

interface DummyJsonResponse {
  products: DummyJsonProduct[];
  total: number;
}

export async function syncDummyJsonSmartphones() {
  console.log('🔄 [sync-dummyjson] Connecting to Supabase project ygkyxxrrfcvypcvmnzke...');
  const supabase = createClient(cleanUrl, SUPABASE_KEY);

  console.log('📦 [sync-dummyjson] Fetching all products (limit=100) from DummyJSON API...');
  const res = await fetch('https://dummyjson.com/products?limit=100');
  if (!res.ok) {
    throw new Error(`Failed to fetch DummyJSON: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as DummyJsonResponse;
  const rawProducts = data.products || [];
  console.log(`✅ [sync-dummyjson] Received ${rawProducts.length} items from all categories.`);

  const mappedProducts = rawProducts.map((item) => {
    const costPrice = item.price;
    const sellingPrice = parseFloat((costPrice * 1.15).toFixed(2));

    return {
      supplier_sku: `DUMMY-${item.id}`,
      title: item.title,
      description: item.description,
      cost_price: costPrice,
      selling_price: sellingPrice,
      stock_quantity: item.stock,
      image_url: item.thumbnail,
    };
  });

  console.log('🚀 [sync-dummyjson] Upserting products into Supabase `products` table on conflict `supplier_sku`...');
  const { data: upsertData, error } = await supabase
    .from('products')
    .upsert(mappedProducts, { onConflict: 'supplier_sku' })
    .select();

  if (error) {
    console.error('❌ [sync-dummyjson] Upsert failed:', error.message);
    return {
      success: false,
      error: error.message,
      details: error,
      count: mappedProducts.length,
      samplePayload: mappedProducts[0],
    };
  }

  console.log(`🎉 [sync-dummyjson] Successfully upserted ${mappedProducts.length} products!`);
  return {
    success: true,
    message: `Successfully synced ${mappedProducts.length} smartphone products to Supabase.`,
    count: mappedProducts.length,
    products: upsertData || mappedProducts,
  };
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('sync-dummyjson')) {
  syncDummyJsonSmartphones()
    .then((result) => {
      console.log('Result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Execution error:', err);
      process.exit(1);
    });
}
