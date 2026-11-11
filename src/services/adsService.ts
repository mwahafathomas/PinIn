import { supabase } from '../supabaseClient';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

export interface AdItem {
  id: string;
  title?: string;
  images: string[];
  link_url?: string;
  status: string;
}

/**
 * Fetches active banner items from Supabase 'ads' table.
 * Strictly requires column 'status' to equal 'show' (case-insensitive).
 * Supports both single URL, comma-separated URLs, and JSON/Postgres arrays in 'image_url' and 'images'.
 * If no row has status = 'show', returns an empty list (banner does not render).
 */
export async function fetchActiveHomeAds(): Promise<AdItem[]> {
  try {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || !Array.isArray(data)) {
      return [];
    }

    // Filter strictly where status is 'show'
    const activeRows = data.filter((row: any) => {
      const status = String(row.status || '').trim().toLowerCase();
      return status === 'show';
    });

    const parsedAds: AdItem[] = [];

    activeRows.forEach((row: any) => {
      const images: string[] = [];
      const add = (img: unknown) => {
        if (typeof img === 'string') {
          const trimmed = img.trim();
          if (trimmed && !images.includes(trimmed)) images.push(trimmed);
        }
      };

      const parse = (src: unknown) => {
        if (!src) return;
        if (Array.isArray(src)) {
          src.forEach(add);
        } else if (typeof src === 'string') {
          const trimmed = src.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const arr = JSON.parse(trimmed);
              if (Array.isArray(arr)) arr.forEach(add);
            } catch {}
          } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            trimmed
              .slice(1, -1)
              .split(',')
              .forEach((s) => add(s.replace(/^["']+|["']+$/g, '').trim()));
          } else if (trimmed.includes(',')) {
            trimmed.split(',').forEach((s) => add(s.trim()));
          } else if (trimmed !== '') {
            add(trimmed);
          }
        }
      };

      // Extract from images array or image_url column
      parse(row.images);
      parse(row.image_url);
      parse(row.imageUrl);
      parse(row.image);
      parse(row.photos);

      if (images.length > 0) {
        parsedAds.push({
          id: String(row.id || Math.random().toString(36).slice(2)),
          title: row.title,
          images: images.map((img) =>
            getOptimizedImageUrl(img, { width: 900, quality: 75, format: 'webp' })
          ),
          link_url: row.link_url || row.link || row.url,
          status: row.status,
        });
      }
    });

    return parsedAds;
  } catch (err) {
    console.warn('Error fetching active ads:', err);
    return [];
  }
}
