import { supabase } from '../supabaseClient';

export interface CategoryItemRow {
  id: string;
  group_id: string;
  group_number: number;
  group_title: string;
  item_name: string;
  display_order: number;
  created_at?: string;
}

export interface CategoryGroup {
  id: string;
  number: number;
  title: string;
  items: string[];
}

export const DEFAULT_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'living-room-dining',
    number: 4,
    title: 'living room & dining',
    items: [
      'couches / sofas',
      'living room table / coffee tables',
      'tv stand / console',
      'tv',
      'dining room suite',
      'chairs',
      'side tables',
      'side board',
      'bench',
      'bookcase / bookshelves',
      'display cabinet / bar cabinet',
    ],
  },
  {
    id: 'kitchen',
    number: 5,
    title: 'kitchen',
    items: [
      'fridge',
      'stove',
      'microwave',
      'tea machine',
      'kettle',
      'oven',
      'blender',
      'washing machine',
      'cupboard',
      'kitchen cabinets',
      'bar stools',
      'braai stand',
    ],
  },
  {
    id: 'bedroom',
    number: 6,
    title: 'bedroom',
    items: [
      'beds / mattress',
      'bedroom suites / headboards',
      'wardrobes / closets',
      'bedframes',
    ],
  },
  {
    id: 'others',
    number: 7,
    title: 'others',
    items: [
      'gym equipment',
      'sound',
      'maths',
      'study tables',
      'laundry',
      'vaccum cleaner',
      'mirrors',
      'shoe rack',
      'pet bed / crate',
      'fan',
      'bar cart',
    ],
  },
];

// Fetch dynamic categories from Supabase with fallback to DEFAULT_CATEGORY_GROUPS
export async function fetchCategoriesFromSupabase(): Promise<CategoryGroup[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('group_number', { ascending: true })
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_CATEGORY_GROUPS;
    }

    // Group the rows by group_id
    const groupsMap = new Map<string, CategoryGroup>();

    data.forEach((row: CategoryItemRow) => {
      if (!groupsMap.has(row.group_id)) {
        groupsMap.set(row.group_id, {
          id: row.group_id,
          number: row.group_number,
          title: row.group_title,
          items: [],
        });
      }
      const group = groupsMap.get(row.group_id)!;
      if (row.item_name && !group.items.includes(row.item_name)) {
        group.items.push(row.item_name);
      }
    });

    return Array.from(groupsMap.values());
  } catch (err) {
    console.warn('fetchCategoriesFromSupabase fallback:', err);
    return DEFAULT_CATEGORY_GROUPS;
  }
}
