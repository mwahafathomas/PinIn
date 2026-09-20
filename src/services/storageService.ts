import { supabase } from '../supabaseClient';
import { getOptimizedImageUrl, MAX_FILE_SIZE_BYTES } from '../utils/imageOptimizer';

export const PRODUCT_IMAGES_BUCKET = 'product-images';
export const LISTINGS_STORAGE_BUCKET = 'listings';

// Helper: Compress an image blob/file to reduce payload size to <= 1MB before upload or storage
export async function compressImageBlob(
  blob: Blob,
  maxDim: number = 1200,
  quality: number = 0.75
): Promise<{ blob: Blob; ext: string }> {
  if (!blob.type.startsWith('image/')) {
    let ext = 'jpg';
    if (blob.type.includes('mp4')) ext = 'mp4';
    else if (blob.type.includes('webm')) ext = 'webm';
    else if (blob.type.includes('quicktime') || blob.type.includes('mov')) ext = 'mov';
    return { blob, ext };
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { blob, ext: 'webp' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ blob, ext: 'webp' });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first for optimal size/quality compression
      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob && compressedBlob.size <= MAX_FILE_SIZE_BYTES) {
            resolve({ blob: compressedBlob, ext: 'webp' });
          } else if (compressedBlob) {
            // If still over 1MB, compress more aggressively
            const smallerCanvas = document.createElement('canvas');
            const scale = 0.75;
            smallerCanvas.width = Math.max(1, Math.round(width * scale));
            smallerCanvas.height = Math.max(1, Math.round(height * scale));
            const sCtx = smallerCanvas.getContext('2d');
            if (sCtx) {
              sCtx.drawImage(img, 0, 0, smallerCanvas.width, smallerCanvas.height);
              smallerCanvas.toBlob(
                (secondBlob) => {
                  resolve({ blob: secondBlob || compressedBlob, ext: 'webp' });
                },
                'image/webp',
                0.65
              );
            } else {
              resolve({ blob: compressedBlob, ext: 'webp' });
            }
          } else {
            // Fallback to JPEG if WebP blob creation is unsupported
            canvas.toBlob(
              (jpgBlob) => {
                resolve({ blob: jpgBlob || blob, ext: 'jpg' });
              },
              'image/jpeg',
              quality
            );
          }
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ blob, ext: 'jpg' });
    };
    img.src = url;
  });
}

// Helper: Convert any string/blob/file into an optimized real Blob reliably (max 1MB)
export async function sourceToBlob(
  source: string | File | Blob,
  fallbackType: string = 'image/webp'
): Promise<{ blob: Blob; ext: string }> {
  if (source instanceof File || source instanceof Blob) {
    if (source.type.startsWith('image/')) {
      return compressImageBlob(source, 1200, 0.75);
    }
    let ext = 'jpg';
    if (source.type.includes('png')) ext = 'png';
    else if (source.type.includes('webp')) ext = 'webp';
    else if (source.type.includes('mp4')) ext = 'mp4';
    else if (source.type.includes('webm')) ext = 'webm';
    else if (source.type.includes('quicktime') || source.type.includes('mov')) ext = 'mov';
    return { blob: source, ext };
  }

  if (typeof source === 'string') {
    // Both data: and blob: URLs can be converted via native fetch
    if (source.startsWith('data:') || source.startsWith('blob:')) {
      try {
        const response = await fetch(source);
        const rawBlob = await response.blob();
        if (rawBlob.type.startsWith('image/')) {
          return compressImageBlob(rawBlob, 1200, 0.75);
        }
        let ext = 'jpg';
        if (rawBlob.type.includes('png')) ext = 'png';
        else if (rawBlob.type.includes('webp')) ext = 'webp';
        else if (rawBlob.type.includes('mp4')) ext = 'mp4';
        else if (rawBlob.type.includes('webm')) ext = 'webm';
        else if (rawBlob.type.includes('quicktime') || rawBlob.type.includes('mov')) ext = 'mov';
        return { blob: rawBlob, ext };
      } catch (err) {
        console.warn('Error fetching source blob:', err);
      }
    }
  }

  return { blob: new Blob([], { type: fallbackType }), ext: 'webp' };
}

// Upload a single image to Supabase Storage bucket with browser caching and width=600&quality=70&format=webp transformation
export async function uploadListingImage(
  imageSource: string | File | Blob,
  prefix: string = 'listing'
): Promise<string> {
  try {
    // If it's already a hosted URL (http/https), optimize it and return
    if (
      typeof imageSource === 'string' &&
      (imageSource.startsWith('http://') || imageSource.startsWith('https://')) &&
      !imageSource.startsWith('blob:')
    ) {
      return getOptimizedImageUrl(imageSource, { width: 600, quality: 70, format: 'webp' });
    }

    const { blob: fileBody, ext: fileExt } = await sourceToBlob(imageSource, 'image/webp');
    if (fileBody.size === 0) {
      return typeof imageSource === 'string' ? imageSource : '';
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const fileName = `${prefix}_${timestamp}_${randomSuffix}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // 1. Try uploading to 'product-images' bucket first, fallback to 'listings'
    let bucketToUse = PRODUCT_IMAGES_BUCKET;
    let uploadRes = await supabase.storage
      .from(bucketToUse)
      .upload(filePath, fileBody, {
        cacheControl: '31536000, public, immutable', // 1-year browser cache to eliminate egress
        upsert: true,
        contentType: fileBody.type || 'image/webp',
      });

    if (uploadRes.error && uploadRes.error.message?.includes('bucket not found')) {
      bucketToUse = LISTINGS_STORAGE_BUCKET;
      uploadRes = await supabase.storage
        .from(bucketToUse)
        .upload(filePath, fileBody, {
          cacheControl: '31536000, public, immutable',
          upsert: true,
          contentType: fileBody.type || 'image/webp',
        });
    }

    if (uploadRes.error) {
      console.warn('Supabase image storage upload note:', uploadRes.error.message);
      return typeof imageSource === 'string' ? imageSource : '';
    }

    // Get public URL and apply transformation options (?width=600&quality=70&format=webp)
    const { data: publicData } = supabase.storage
      .from(bucketToUse)
      .getPublicUrl(uploadRes.data.path);

    return getOptimizedImageUrl(publicData.publicUrl, { width: 600, quality: 70, format: 'webp' });
  } catch (err) {
    console.warn('uploadListingImage exception:', err);
    return typeof imageSource === 'string' ? imageSource : '';
  }
}

// Upload a single video (File, Blob, or data/blob URL) to Supabase Storage bucket
export async function uploadListingVideo(
  videoSource: string | File | Blob,
  prefix: string = 'video'
): Promise<string> {
  try {
    if (
      typeof videoSource === 'string' &&
      (videoSource.startsWith('http://') || videoSource.startsWith('https://')) &&
      !videoSource.startsWith('blob:')
    ) {
      return videoSource;
    }

    const { blob: fileBody, ext: fileExt } = await sourceToBlob(videoSource, 'video/mp4');
    if (fileBody.size === 0) {
      return typeof videoSource === 'string' ? videoSource : '';
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const fileName = `${prefix}_${timestamp}_${randomSuffix}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    let contentType = fileBody.type;
    if (!contentType || contentType === 'application/octet-stream') {
      if (fileExt === 'webm') contentType = 'video/webm';
      else if (fileExt === 'mov') contentType = 'video/quicktime';
      else contentType = 'video/mp4';
    }

    // Try uploading to 'product-images' or 'listings' bucket under videos/ folder
    let bucketToUse = PRODUCT_IMAGES_BUCKET;
    let { data, error } = await supabase.storage
      .from(bucketToUse)
      .upload(filePath, fileBody, {
        cacheControl: '86400',
        upsert: true,
        contentType,
      });

    if (error && error.message?.includes('bucket not found')) {
      bucketToUse = LISTINGS_STORAGE_BUCKET;
      const fallback = await supabase.storage
        .from(bucketToUse)
        .upload(filePath, fileBody, {
          cacheControl: '86400',
          upsert: true,
          contentType,
        });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.warn('Supabase video storage upload note:', error.message);
      // Fallback: try dedicated 'videos' bucket if user created one
      const { data: altData, error: altError } = await supabase.storage
        .from('videos')
        .upload(fileName, fileBody, {
          cacheControl: '86400',
          upsert: true,
          contentType,
        });

      if (!altError && altData) {
        const { data: publicAltData } = supabase.storage.from('videos').getPublicUrl(altData.path);
        return publicAltData.publicUrl;
      }

      return typeof videoSource === 'string' ? videoSource : '';
    }

    if (!data) return typeof videoSource === 'string' ? videoSource : '';

    const { data: publicData } = supabase.storage
      .from(bucketToUse)
      .getPublicUrl(data.path);

    return publicData.publicUrl;
  } catch (err) {
    console.warn('uploadListingVideo exception:', err);
    return typeof videoSource === 'string' ? videoSource : '';
  }
}

export async function uploadAllListingImages(
  images: (string | File | Blob)[],
  listingId: string = 'new'
): Promise<string[]> {
  if (!images || images.length === 0) return [];

  const uploadPromises = images.map((img, idx) =>
    uploadListingImage(img, `item_${listingId}_${idx + 1}`)
  );

  return Promise.all(uploadPromises);
}

