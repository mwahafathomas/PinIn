import { supabase } from '../supabaseClient';

export interface AdvertItem {
  id: string;
  slot_number: number;
  image_url: string;
  title?: string;
  is_active?: boolean;
}

// Fallback high-resolution advert images if none are uploaded in Supabase yet
const DEFAULT_ADVERTS: Record<number, AdvertItem> = {
  1: {
    id: 'default-adv-1',
    slot_number: 1,
    image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&auto=format&fit=crop&q=80',
    title: 'PinIn Verified Quality Furniture Deals',
    is_active: true,
  },
  2: {
    id: 'default-adv-2',
    slot_number: 2,
    image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&auto=format&fit=crop&q=80',
    title: 'Transform Your Living Room Today',
    is_active: true,
  },
  3: {
    id: 'default-adv-3',
    slot_number: 3,
    image_url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1600&auto=format&fit=crop&q=80',
    title: 'Exclusive Deals on Bedroom & Office Suites',
    is_active: true,
  },
};

/**
 * Fetch home page advertisements from Supabase `adverts` table
 * Slots: 1, 2, 3
 */
export async function fetchHomeAdverts(): Promise<Record<number, AdvertItem>> {
  const result: Record<number, AdvertItem> = { ...DEFAULT_ADVERTS };

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
