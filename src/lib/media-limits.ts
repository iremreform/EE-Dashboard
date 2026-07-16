export type MediaKind = "photo" | "video" | "license";

export const MEDIA_UPLOAD_LIMITS: Record<MediaKind, number> = {
  license: 40 * 1024 * 1024,
  photo: 40 * 1024 * 1024,
  video: 450 * 1024 * 1024,
};

const MEDIA_UPLOAD_MIME_TYPES: Record<MediaKind, ReadonlySet<string>> = {
  license: new Set([
    "image/avif",
    "image/heic",
    "image/heif",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  photo: new Set([
    "image/avif",
    "image/heic",
    "image/heif",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  video: new Set([
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-m4v",
  ]),
};

export function getMediaUploadLimitLabel(mediaKind: MediaKind) {
  return formatUploadLimit(MEDIA_UPLOAD_LIMITS[mediaKind]);
}

export function isWithinMediaUploadLimit(mediaKind: MediaKind, sizeBytes: number) {
  return Number.isSafeInteger(sizeBytes)
    && sizeBytes > 0
    && sizeBytes <= MEDIA_UPLOAD_LIMITS[mediaKind];
}

export function isAllowedMediaMimeType(mediaKind: MediaKind, mimeType: string) {
  return MEDIA_UPLOAD_MIME_TYPES[mediaKind].has(normalizeMimeType(mimeType));
}

export function normalizeMimeType(mimeType: string) {
  return mimeType.split(";", 1)[0].trim().toLowerCase();
}

function formatUploadLimit(sizeBytes: number) {
  return `${Math.round(sizeBytes / 1024 / 1024)} MB`;
}
