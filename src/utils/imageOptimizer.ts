/**
 * Utility for optimizing image URLs and reducing Supabase bandwidth/egress.
 * Transforms Supabase Storage images to use width=600, quality=70, format=webp
 * and supports responsive width/quality options with browser-level caching.
 */

export interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif' | 'origin';
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  width: 600,
  quality: 70,
  format: 'webp',
};

// In-memory cache for transformed URLs to avoid re-calculating on every render
const transformedUrlCache = new Map<string, string>();

/**
 * Optimizes an image URL for minimal egress and fast loading.
 * Specifically targets Supabase Storage URLs (product-images, listings buckets)
 * and applies image transformations: width=600, quality=70, format=webp.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: ImageOptimizationOptions = DEFAULT_OPTIONS
): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  if (!trimmed) return '';

  // Data URIs or Blob URIs cannot be transformed on the server
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  const width = options.width ?? 600;
  const quality = options.quality ?? 70;
  const format = options.format ?? 'webp';

  const cacheKey = `${trimmed}_w${width}_q${quality}_f${format}`;
  const cached = transformedUrlCache.get(cacheKey);
  if (cached) return cached;

  let optimized = trimmed;

  try {
    // 1. Check for Supabase Storage URLs
    const isSupabase =
      trimmed.includes('supabase.co/storage/v1') ||
      trimmed.includes('/storage/v1/object/public/') ||
      trimmed.includes('/storage/v1/render/image/public/') ||
      trimmed.includes('product-images') ||
      trimmed.includes('listings');

    if (isSupabase) {
      // If it uses the object/public endpoint, transform to render/image/public for Supabase Image Transformation
      let baseUrl = trimmed;
      if (baseUrl.includes('/storage/v1/object/public/')) {
        baseUrl = baseUrl.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      }

      // Parse and apply/update transformation parameters
      const urlObj = new URL(baseUrl, window?.location?.origin || 'https://pinin.app');
      urlObj.searchParams.set('width', width.toString());
      urlObj.searchParams.set('quality', quality.toString());
      urlObj.searchParams.set('format', format);

      optimized = urlObj.toString();
    } else if (trimmed.includes('images.unsplash.com')) {
      // 2. Unsplash Image Optimization
      const urlObj = new URL(trimmed);
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fm', format === 'webp' ? 'webp' : 'jpg');
      urlObj.searchParams.set('fit', 'crop');
      optimized = urlObj.toString();
    }
  } catch {
    // Fallback: If URL parsing fails, append query string manually if it looks like Supabase storage
    if (
      trimmed.includes('supabase.co') ||
      trimmed.includes('product-images') ||
      trimmed.includes('listings')
    ) {
      const separator = trimmed.includes('?') ? '&' : '?';
      optimized = `${trimmed}${separator}width=${width}&quality=${quality}&format=${format}`;
    }
  }

  transformedUrlCache.set(cacheKey, optimized);
  return optimized;
}

/**
 * Validates whether a file size is within the 1MB limit.
 */
export const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export function isFileSizeUnder1MB(file: File | Blob): boolean {
  return file.size <= MAX_FILE_SIZE_BYTES;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
