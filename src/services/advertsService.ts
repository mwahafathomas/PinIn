import { supabase } from '../supabaseClient';

export interface AdvertItem {
  id: string;
  slot_number: number;
  image_url: string;
  title?: string;
  is_active?: boolean;
}

// Advertisements fetched directly from Supabase `adverts` table
export async function fetchHomeAdverts(): Promise<Record<number, AdvertItem>> {
  const result: Record<number, AdvertItem> = {};

  try {
    const { data, error } = await supabase
      .from('adverts')
      .select('*')
      .eq('is_active', true)
      .order('slot_number', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      data.forEach((row: any) => {
        const slot = Number(row.slot_number);
        if (slot >= 1 && slot <= 3 && row.image_url) {
          result[slot] = {
            id: String(row.id || `adv_${slot}`),
            slot_number: slot,
            image_url: row.image_url,
            title: row.title || `Advertisement ${slot}`,
            is_active: row.is_active ?? true,
          };
        }
      });
    }
  } catch (err) {
    console.warn('Adverts fetch notice:', err);
  }

  return result;
}
