export type MediaKind = "photo" | "video" | "license";

export const MEDIA_UPLOAD_LIMITS: Record<MediaKind, number> = {
  license: 40 * 1024 * 1024,
  photo: 40 * 1024 * 1024,
  video: 450 * 1024 * 1024,
};

export function getMediaUploadLimitLabel(mediaKind: MediaKind) {
  return formatUploadLimit(MEDIA_UPLOAD_LIMITS[mediaKind]);
}

export function isWithinMediaUploadLimit(mediaKind: MediaKind, sizeBytes: number) {
  return sizeBytes <= MEDIA_UPLOAD_LIMITS[mediaKind];
}

function formatUploadLimit(sizeBytes: number) {
  return `${Math.round(sizeBytes / 1024 / 1024)} MB`;
}
