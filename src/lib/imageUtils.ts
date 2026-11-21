import { Certificate } from '../types';
import { isVideoMedia } from './videoUtils';

export function isPdfUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase().trim();
  return clean.endsWith('.pdf') || url.toLowerCase().includes('.pdf');
}

export function isRasterImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return !isPdfUrl(url) && !isVideoMedia(url);
}

/**
 * Picks the fastest, cleanest preview image URL for a Certificate card:
 * 1. Explicit lightweight `thumbnailUrl` (if present & valid)
 * 2. First non-PDF raster image in `images` or `imageUrl`
 * Falls back cleanly to flagging `isPdfOnly` if only PDFs exist.
 */
export function getCertificateCardMedia(cert: Pick<Certificate, 'thumbnailUrl' | 'images' | 'imageUrl'>): {
  previewUrl: string | null;
  isThumbnail: boolean;
  isPdfOnly: boolean;
  allMedia: string[];
} {
  const allMedia = cert.images && cert.images.length > 0
    ? cert.images.filter(Boolean)
    : (cert.imageUrl ? [cert.imageUrl] : []);

  const thumb = (cert.thumbnailUrl || '').trim();
  if (thumb && isRasterImageUrl(thumb)) {
    return {
      previewUrl: thumb,
      isThumbnail: true,
      isPdfOnly: false,
      allMedia,
    };
  }

  const firstRaster = allMedia.find(isRasterImageUrl) || null;
  return {
    previewUrl: firstRaster,
    isThumbnail: false,
    isPdfOnly: !firstRaster && allMedia.some(isPdfUrl),
    allMedia,
  };
}

/**
 * Generates a lightweight compressed WebP (or JPEG fallback) thumbnail File
 * from a local File or accessible image URL using HTML5 Canvas.
 */
export async function generateThumbnailFile(
  source: File | string,
  maxWidth = 640,
  quality = 0.8
): Promise<{ file: File; dataUrl: string } | null> {
  if (typeof document === 'undefined') return null;

  let objectUrlToRevoke: string | null = null;
  let imageSrc = '';

  try {
    if (typeof source === 'string') {
      if (!isRasterImageUrl(source)) return null;
      // Fetch blob when possible so canvas stays untainted cleanly on same-origin or CORS URLs
      try {
        const res = await fetch(source);
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!blob.type.startsWith('image/') || blob.type === 'image/svg+xml') {
          return null;
        }
        objectUrlToRevoke = URL.createObjectURL(blob);
        imageSrc = objectUrlToRevoke;
      } catch {
        // Fallback direct URL load if fetch is blocked by CORS
        imageSrc = source;
      }
    } else {
      if (!source.type.startsWith('image/') || source.type === 'image/svg+xml') {
        return null;
      }
      objectUrlToRevoke = URL.createObjectURL(source);
      imageSrc = objectUrlToRevoke;
    }

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      if (typeof source === 'string' && !objectUrlToRevoke) {
        el.crossOrigin = 'anonymous';
      }
      el.onload = () => resolve(el);
      el.onerror = (err) => reject(err);
      el.src = imageSrc;
    });

    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    if (!naturalW || !naturalH) return null;

    const targetW = Math.min(maxWidth, naturalW);
    const scale = targetW / naturalW;
    const targetH = Math.max(1, Math.round(naturalH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Prefer WebP for smallest size; fallback cleanly to JPEG
    let mimeType = 'image/webp';
    let blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), mimeType, quality)
    );

    if (!blob || blob.type !== 'image/webp') {
      mimeType = 'image/jpeg';
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), mimeType, quality)
      );
    }

    if (!blob) return null;

    const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
    const file = new File([blob], `thumbnail.${ext}`, { type: mimeType });
    const dataUrl = canvas.toDataURL(mimeType, quality);

    return { file, dataUrl };
  } catch (err) {
    console.warn('[ImageUtils] Thumbnail generation failed:', err);
    return null;
  } finally {
    if (objectUrlToRevoke) {
      try {
        URL.revokeObjectURL(objectUrlToRevoke);
      } catch {}
    }
  }
}

/**
 * Generates and uploads a thumbnail image to `/api/upload` and returns the served blob URL.
 */
export async function generateAndUploadThumbnail(
  source: File | string,
  pathPrefix: string,
  targetId: string
): Promise<string | null> {
  const generated = await generateThumbnailFile(source, 640, 0.8);
  if (!generated) return null;

  const { file } = generated;
  const ext = file.name.split('.').pop() || 'webp';
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const targetFilename = `${pathPrefix}_thumb_${targetId}_${uniqueSuffix}.${ext}`;

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'x-target-filename': encodeURIComponent(targetFilename),
    },
  });

  if (!response.ok) {
    throw new Error(`Thumbnail upload failed (${response.status})`);
  }

  const data = await response.json();
  return data?.url || null;
}
