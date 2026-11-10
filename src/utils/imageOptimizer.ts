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

export const BLANK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400' fill='%23f3f4f6'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3C/svg%3E";

export function isAppOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

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
  // When offline inside the app, return clean blank image placeholder
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return BLANK_IMAGE;
  }

  if (!url || typeof url !== 'string') {
    return '';
  }

  let trimmed = url.trim();
  if (!trimmed) return '';

  // Clean brackets, curly braces, quotes if stored as array/JSON in Supabase
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  // Strip surrounding quotes
  trimmed = trimmed.replace(/^["']+|["']+$/g, '').trim();

  // If multiple comma-separated URLs, take the first one
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',');
    trimmed = parts[0].trim().replace(/^["']+|["']+$/g, '');
  }

  if (!trimmed) return '';

  // Data URIs or Blob URIs cannot be transformed
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Handle Google Drive share links: convert to direct view
  if (trimmed.includes('drive.google.com/file/d/')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  const SUPABASE_BASE_URL = 'https://ygkyxxrrfcvypcvmnzke.supabase.co';

  // If user provided a storage path or relative filename:
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    // If it starts with storage/v1/
    if (trimmed.startsWith('storage/v1/')) {
      trimmed = `${SUPABASE_BASE_URL}/${trimmed}`;
    } else if (trimmed.startsWith('/storage/v1/')) {
      trimmed = `${SUPABASE_BASE_URL}${trimmed}`;
    } else if (
      trimmed.startsWith('listings/') ||
      trimmed.startsWith('product-images/') ||
      trimmed.startsWith('products/') ||
      trimmed.startsWith('public/') ||
      trimmed.startsWith('images/') ||
      trimmed.startsWith('uploads/')
    ) {
      trimmed = `${SUPABASE_BASE_URL}/storage/v1/object/public/${trimmed}`;
    } else {
      // Just a filename e.g. "my-photo.jpg" -> assume listings bucket
      const cleanPath = trimmed.replace(/^\/+/, '');
      trimmed = `${SUPABASE_BASE_URL}/storage/v1/object/public/listings/${cleanPath}`;
    }
  }

  // CRITICAL FIX: Supabase Image Transformation (/storage/v1/render/image/public/) requires
  // a paid Pro plan. Free tier returns 404 or 400 for /render/image/.
  // Always use the direct, guaranteed public storage endpoint: /storage/v1/object/public/
  if (trimmed.includes('/storage/v1/render/image/public/')) {
    trimmed = trimmed.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/');
    // Strip render query parameters
    try {
      const u = new URL(trimmed);
      u.searchParams.delete('width');
      u.searchParams.delete('quality');
      u.searchParams.delete('format');
      trimmed = u.toString();
    } catch {}
  }

  // If it's a standard Supabase storage object URL, do NOT append query parameters that cause some CDN issues
  if (trimmed.includes('supabase.co/storage/v1/object/public/')) {
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
    if (trimmed.includes('images.unsplash.com')) {
      // Unsplash Image Optimization
      const urlObj = new URL(trimmed);
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', quality.toString());
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fm', format === 'webp' ? 'webp' : 'jpg');
      urlObj.searchParams.set('fit', 'crop');
      optimized = urlObj.toString();
    }
  } catch {}

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
