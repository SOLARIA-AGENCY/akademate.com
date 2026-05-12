import type { CollectionBeforeChangeHook } from 'payload';
import sharp from 'sharp';
import { sanitizeFilename } from '../Media.validation';

const IMAGE_MIME_TYPES_TO_WEBP = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_WEBP_WIDTH = 1920;
const MAX_WEBP_HEIGHT = 1080;
const WEBP_QUALITY = 84;

interface MediaFileData {
  data: Buffer | Uint8Array;
}

interface MediaDocumentData {
  filename?: string;
  mimeType?: string;
  filesize?: number;
  width?: number;
  height?: number;
  file?: MediaFileData;
  [key: string]: unknown;
}

function toWebpFilename(filename: string | undefined) {
  const baseName = sanitizeFilename(filename || 'media-image')
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return `${baseName || 'media-image'}.webp`;
}

/**
 * Converts uploaded raster images to WebP before validation/storage.
 *
 * Documents, videos, SVGs and GIFs are intentionally not converted:
 * - PDFs/videos are not photos.
 * - SVGs are sanitized by validateMediaFile and should remain vectors.
 * - GIFs may be animated; converting them here would silently drop animation.
 */
export const normalizeImageToWebp: CollectionBeforeChangeHook = async ({ data }) => {
  const mediaData = data as MediaDocumentData;
  const fileData = mediaData.file?.data;
  const mimeType = mediaData.mimeType;

  if (!fileData || !mimeType || !IMAGE_MIME_TYPES_TO_WEBP.has(mimeType)) {
    return data;
  }

  const originalBuffer = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData);
  const image = sharp(originalBuffer, { failOn: 'none' }).rotate();
  const metadata = await image.metadata();
  const optimizedBuffer = await image
    .resize({
      width: MAX_WEBP_WIDTH,
      height: MAX_WEBP_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: 5,
    })
    .toBuffer();
  const optimizedMetadata = await sharp(optimizedBuffer).metadata();

  mediaData.file = { data: optimizedBuffer };
  mediaData.filename = toWebpFilename(mediaData.filename);
  mediaData.mimeType = 'image/webp';
  mediaData.filesize = optimizedBuffer.length;
  mediaData.width = optimizedMetadata.width ?? metadata.width;
  mediaData.height = optimizedMetadata.height ?? metadata.height;

  console.log('[Media Optimization] Converted image upload to WebP', {
    filename: mediaData.filename,
    originalMimeType: mimeType,
    originalSize: originalBuffer.length,
    optimizedSize: optimizedBuffer.length,
    width: mediaData.width,
    height: mediaData.height,
  });

  return mediaData;
};
