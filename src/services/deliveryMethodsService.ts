import { supabase } from '../supabaseClient';

export interface DeliveryMethodOption {
  id: string;
  name: string; // 'Door to door' | 'PAXI'
  price: number;
  is_active?: boolean;
}

export const DEFAULT_DELIVERY_METHODS: DeliveryMethodOption[] = [
  { id: 'door-to-door', name: 'Door to door', price: 60 },
  { id: 'paxi', name: 'PAXI', price: 40 },
];

/**
 * Fetch delivery methods and their prices from Supabase `delivery_methods` table.
 * If not present, returns the default options.
 */
export async function fetchDeliveryMethods(): Promise<DeliveryMethodOption[]> {
  try {
    const { data, error } = await supabase
      .from('delivery_methods')
      .select('*')
      .order('price', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: String(d.id || d.name),
        name: d.name,
        price: Number(d.price) || 0,
        is_active: d.is_active !== false,
      }));
    }
  } catch (err) {
    console.warn('Could not fetch delivery_methods from Supabase, using defaults:', err);
  }

  return DEFAULT_DELIVERY_METHODS;
}
