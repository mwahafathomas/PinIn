import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Updated: Fetch all categories without filters
    const response = await fetch('https://dummyjson.com/products?limit=100');
    const data = await response.json();

    const productsToUpsert = data.products.map((item: any) => {
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

    const { data: insertedData, error } = await supabase
      .from('products')
      .upsert(productsToUpsert, { onConflict: 'supplier_sku' })
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, count: insertedData?.length || 0 }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
