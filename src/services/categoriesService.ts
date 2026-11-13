import { supabase } from '../supabaseClient';

export interface CategoryItemRow {
  id: string;
  group_id: string;
  group_number: number;
  group_title: string;
  item_name: string;
  display_order: number;
  image_url?: string | null;
  created_at?: string;
}

export interface CategoryItemEntry {
  name: string;
  imageUrl?: string;
}

export interface CategoryGroup {
  id: string;
  number: number;
  title: string;
  items: string[];
  itemEntries?: CategoryItemEntry[];
}

export const DEFAULT_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'ladies',
    number: 1,
    title: 'ladies',
    items: [
      'just dropped',
      'Tees, shirts',
      'Trousers',
      'Jeans',
      'Jackets, hoodies',
      'Dresses',
      'Skirts',
      'Accessories',
      'Shoes',
    ],
  },
  {
    id: 'men',
    number: 2,
    title: 'men',
    items: [
      'just dropped',
      'tees, shirts',
      'Jeans',
      'Trousers',
      'Jackets, hoodies, sweaters',
      'Accessories',
      'Shoes',
    ],
  },
];

function resolveCategoryImageUrl(rawUrl: unknown): string | undefined {
  if (typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  const { data } = supabase.storage.from('category-images').getPublicUrl(trimmed);
  return data?.publicUrl || undefined;
}

// Fetch dynamic categories from Supabase with fallback to DEFAULT_CATEGORY_GROUPS
export async function fetchCategoriesFromSupabase(): Promise<CategoryGroup[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('group_number', { ascending: true })
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_CATEGORY_GROUPS.map((g) => ({
        ...g,
        itemEntries: g.items.map((name) => ({ name })),
      }));
    }

    // Group the rows by normalized group_id (map legacy 'women' -> 'ladies')
    const groupsMap = new Map<string, CategoryGroup>();

    data.forEach((row: CategoryItemRow & Record<string, unknown>) => {
      const rawId = (row.group_id || '').toLowerCase().trim();
      const rawTitle = (row.group_title || '').toLowerCase().trim();
      const normalizedId = rawId === 'women' ? 'ladies' : row.group_id;
      const normalizedTitle = rawTitle === 'women' ? 'ladies' : row.group_title;

      if (!groupsMap.has(normalizedId)) {
        groupsMap.set(normalizedId, {
          id: normalizedId,
          number: row.group_number,
          title: normalizedTitle,
          items: [],
          itemEntries: [],
        });
      }
      const group = groupsMap.get(normalizedId)!;
      const resolvedImage = resolveCategoryImageUrl(
        row.image_url ?? row.imageUrl ?? row.image
      );

      if (row.item_name) {
        if (!group.items.includes(row.item_name)) {
          group.items.push(row.item_name);
          group.itemEntries!.push({ name: row.item_name, imageUrl: resolvedImage });
        } else if (resolvedImage) {
          const existing = group.itemEntries!.find((e) => e.name === row.item_name);
          if (existing && !existing.imageUrl) {
            existing.imageUrl = resolvedImage;
          }
        }
      }
    });

    const groups = Array.from(groupsMap.values());
    // Ensure required new subcategories ('just dropped', 'Accessories', 'Shoes') appear even if DB is not yet updated
    const defaultExtras = ['just dropped', 'Accessories', 'Shoes'];
    groups.forEach((group) => {
      if (!group.itemEntries) {
        group.itemEntries = group.items.map((name) => ({ name }));
      }
      const lowerItems = new Set(group.items.map((i) => i.toLowerCase().trim()));
      if (!lowerItems.has('just dropped')) {
        group.items.unshift('just dropped');
        group.itemEntries.unshift({ name: 'just dropped' });
      }
      defaultExtras.slice(1).forEach((extra) => {
        if (!lowerItems.has(extra.toLowerCase())) {
          group.items.push(extra);
          group.itemEntries!.push({ name: extra });
        }
      });
    });

    return groups;
  } catch (err) {
    console.warn('fetchCategoriesFromSupabase fallback:', err);
    return DEFAULT_CATEGORY_GROUPS.map((g) => ({
      ...g,
      itemEntries: g.items.map((name) => ({ name })),
    }));
  }
}
