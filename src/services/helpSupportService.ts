import { supabase } from '../supabaseClient';

export interface HelpItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  orderNum?: number;
  createdAt?: string;
}

/**
 * Normalizes category names to match regardless of casing or formatting differences
 * e.g., "Returns & Exchanges" matches "returns & exchanges", "returns and exchanges"
 */
function normalizeCategory(cat: string): string {
  return cat
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Fetch help questions and answers from Supabase `help_support` table.
 * If the table is empty or does not exist, returns empty array (no mock data).
 */
export async function fetchHelpByCategory(categoryName: string): Promise<HelpItem[]> {
  if (!categoryName || !categoryName.trim()) return [];

  const targetNorm = normalizeCategory(categoryName);

  try {
    // Try primary table `help_support`
    const { data, error } = await supabase
      .from('help_support')
      .select('*')
      .order('order_num', { ascending: true, nullsFirst: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      const filtered = data.filter((row: any) => {
        const rowCat = String(row.category || row.category_name || '').trim();
        return normalizeCategory(rowCat) === targetNorm;
      });

      return filtered.map((row: any) => ({
        id: String(row.id || Math.random()),
        category: String(row.category || categoryName),
        question: String(row.question || row.question_text || row.q || ''),
        answer: String(row.answer || row.answer_text || row.a || ''),
        orderNum: typeof row.order_num === 'number' ? row.order_num : undefined,
        createdAt: row.created_at,
      })).filter((item) => Boolean(item.question.trim()));
    }
  } catch (err) {
    console.warn('[HelpSupportService] Supabase fetch notice:', err);
  }

  return [];
}
