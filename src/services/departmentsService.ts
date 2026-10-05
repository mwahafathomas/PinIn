import { supabase } from '../supabaseClient';

export interface DepartmentItem {
  id: string;
  name: string;
  image_url: string;
  display_order: number;
}

export const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  {
    id: 'dept-1',
    name: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80',
    display_order: 1,
  },
  {
    id: 'dept-2',
    name: 'Furniture',
    image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80',
    display_order: 2,
  },
  {
    id: 'dept-3',
    name: 'Clothing',
    image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=300&auto=format&fit=crop&q=80',
    display_order: 3,
  },
  {
    id: 'dept-4',
    name: 'Beauty',
    image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
    display_order: 4,
  },
  {
    id: 'dept-5',
    name: 'Tools & fitness',
    image_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=300&auto=format&fit=crop&q=80',
    display_order: 5,
  },
];

/**
 * Fetch 5 departments from Supabase `departments` table or `department_images` table
 */
export async function fetchDepartments(): Promise<DepartmentItem[]> {
  try {
    // 1. Try fetching from `departments` table (row per department)
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return DEFAULT_DEPARTMENTS.map((def) => {
        const found = data.find(
          (d) => d.name?.toLowerCase().trim() === def.name.toLowerCase().trim()
        );
        if (found && found.image_url) {
          return {
            id: String(found.id || def.id),
            name: def.name,
            image_url: found.image_url,
            display_order: found.display_order ?? def.display_order,
          };
        }
        return def;
      });
    }

    // 2. Fallback: try fetching from `department_images` table (single row with 5 columns)
    const { data: colData, error: colError } = await supabase
      .from('department_images')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!colError && colData) {
      return DEFAULT_DEPARTMENTS.map((def) => {
        let colImg: string | undefined = undefined;
        const lower = def.name.toLowerCase().trim();
        if (lower === 'electronics' && colData.electronics) colImg = colData.electronics;
        else if (lower === 'furniture' && colData.furniture) colImg = colData.furniture;
        else if (lower === 'clothing' && colData.clothing) colImg = colData.clothing;
        else if (lower === 'beauty' && colData.beauty) colImg = colData.beauty;
        else if ((lower.includes('tools') || lower.includes('fitness')) && (colData.tools_fitness || colData.tools || colData.fitness)) {
          colImg = colData.tools_fitness || colData.tools || colData.fitness;
        }

        if (colImg) {
          return {
            ...def,
            image_url: colImg,
          };
        }
        return def;
      });
    }
  } catch (err) {
    console.warn('Departments fetch notice:', err);
  }

  return DEFAULT_DEPARTMENTS;
}
