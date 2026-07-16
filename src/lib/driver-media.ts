import "server-only";
import { SUPABASE_BUCKETS } from "@/lib/supabase/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getMediaUploadLimitLabel,
  isAllowedMediaMimeType,
  isWithinMediaUploadLimit,
  normalizeMimeType,
  type MediaKind,
} from "@/lib/media-limits";

type SignedMediaUploadInput = {
  contentType: string;
  driverId: string;
  fileName: string;
  mediaKind: MediaKind;
  sizeBytes: number;
};

type UploadedMediaRef = {
  label: string;
  mediaKind: MediaKind;
  mimeType: string;
  originalName: string;
  path: string;
  sizeBytes: number;
};

type FinalizeSubmissionMediaInput = {
  driverId: string;
  media: UploadedMediaRef[];
  publicId: string;
  submissionId: string;
};

export const UPLOADED_MEDIA_FIELD_NAME = "uploaded-media";
const MAX_MEDIA_ITEMS_PER_SUBMISSION = 20;

export async function createSignedMediaUpload({
  contentType,
  driverId,
  fileName,
  mediaKind,
  sizeBytes,
}: SignedMediaUploadInput) {
  const normalizedContentType = normalizeMimeType(contentType);

  if (!isAllowedMediaMimeType(mediaKind, normalizedContentType)) {
    throw new Error(`${formatMediaKind(mediaKind)} file type is not supported.`);
  }

  if (!isWithinMediaUploadLimit(mediaKind, sizeBytes)) {
    throw new Error(
      `${formatMediaKind(mediaKind)} uploads must be ${getMediaUploadLimitLabel(mediaKind)} or smaller.`,
    );
  }

  const supabase = createSupabaseAdminClient();
  const path = buildPendingStoragePath({
    driverId,
    fileName,
    mediaKind,
    mimeType: normalizedContentType,
  });
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKETS.submissionMedia)
    .createSignedUploadUrl(path, { upsert: false });

  if (error) {
    throw new Error(`Unable to create media upload URL: ${error.message}`);
  }

  return {
    contentType: normalizedContentType,
    path: data.path,
    token: data.token,
  };
}

export async function removePendingMediaUpload(path: string, driverId: string) {
  if (!isPendingStoragePathForDriver(path, driverId)) {
    throw new Error("Only your pending media uploads can be removed.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(SUPABASE_BUCKETS.submissionMedia).remove([path]);

  if (error) {
    throw new Error(`Unable to remove media upload: ${error.message}`);
  }
}

export function parseUploadedMediaRefs(formData: FormData) {
  return formData
    .getAll(UPLOADED_MEDIA_FIELD_NAME)
    .map((value) => parseUploadedMediaRef(value))
    .filter((value): value is UploadedMediaRef => Boolean(value));
}

export async function finalizeSubmissionMedia({
  driverId,
  media,
  publicId,
  submissionId,
}: FinalizeSubmissionMediaInput) {
  if (!media.length) {
    return;
  }

  if (media.length > MAX_MEDIA_ITEMS_PER_SUBMISSION) {
    throw new Error("Too many media files were attached to this submission.");
  }

  if (new Set(media.map((item) => item.path)).size !== media.length) {
    throw new Error("Duplicate media uploads are not allowed.");
  }

  const supabase = createSupabaseAdminClient();
  const finalizedPaths: string[] = [];

  try {
    const verifiedMedia = await Promise.all(media.map(async (item) => {
      if (!isPendingStoragePathForDriver(item.path, driverId, item.mediaKind)) {
        throw new Error("Invalid uploaded media path.");
      }

      const uploadedFile = await getPendingUploadMetadata(supabase, item.path);
      const mimeType = normalizeMimeType(uploadedFile.mimeType);

      if (!isAllowedMediaMimeType(item.mediaKind, mimeType)) {
        throw new Error(`${item.label} has an unsupported file type.`);
      }

      if (!isWithinMediaUploadLimit(item.mediaKind, uploadedFile.sizeBytes)) {
        throw new Error(
          `${item.label} must be ${getMediaUploadLimitLabel(item.mediaKind)} or smaller.`,
        );
      }

      return { item, mimeType, sizeBytes: uploadedFile.sizeBytes };
    }));
    const mediaRows = [];

    for (const [index, verified] of verifiedMedia.entries()) {
      const { item, mimeType, sizeBytes } = verified;
      const storagePath = buildFinalStoragePath({
        index,
        item,
        mimeType,
        publicId,
      });
      const { error: moveError } = await supabase.storage
        .from(SUPABASE_BUCKETS.submissionMedia)
        .move(item.path, storagePath);

      if (moveError) {
        throw new Error(`Unable to finalize ${item.label}: ${moveError.message}`);
      }

      finalizedPaths.push(storagePath);

      mediaRows.push({
        label: item.label,
        media_kind: item.mediaKind,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        storage_bucket: SUPABASE_BUCKETS.submissionMedia,
        storage_path: storagePath,
        submission_id: submissionId,
      });
    }

    const { error: mediaError } = await supabase.from("submission_media").insert(mediaRows);

    if (mediaError) {
      throw new Error(`Unable to save media metadata: ${mediaError.message}`);
    }
  } catch (error) {
    if (finalizedPaths.length) {
      await supabase.storage.from(SUPABASE_BUCKETS.submissionMedia).remove(finalizedPaths);
    }

    throw error;
  }
}

function parseUploadedMediaRef(value: FormDataEntryValue) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<UploadedMediaRef>;

    if (
      !parsed.path ||
      parsed.path.length > 1024 ||
      !parsed.label ||
      parsed.label.length > 120 ||
      !parsed.mediaKind ||
      !isMediaKind(parsed.mediaKind) ||
      (parsed.originalName?.length ?? 0) > 255 ||
      typeof parsed.sizeBytes !== "number"
    ) {
      return null;
    }

    return {
      label: parsed.label,
      mediaKind: parsed.mediaKind,
      mimeType: parsed.mimeType ?? "",
      originalName: parsed.originalName ?? parsed.label,
      path: parsed.path,
      sizeBytes: parsed.sizeBytes,
    };
  } catch {
    return null;
  }
}

function buildPendingStoragePath({
  driverId,
  fileName,
  mediaKind,
  mimeType,
}: {
  driverId: string;
  fileName: string;
  mediaKind: MediaKind;
  mimeType: string;
}) {
  const extension = getExtensionForMimeType(mimeType);
  const basename = slugify(fileName || mediaKind).slice(0, 80) || mediaKind;
  return `pending/${driverId}/${crypto.randomUUID()}/${mediaKind}/${basename}${extension}`;
}

function buildFinalStoragePath({
  index,
  item,
  mimeType,
  publicId,
}: {
  index: number;
  item: UploadedMediaRef;
  mimeType: string;
  publicId: string;
}) {
  const extension = getExtensionForMimeType(mimeType);
  const basename = slugify(item.originalName || item.label || item.mediaKind).slice(0, 80)
    || item.mediaKind;
  const prefix = String(index + 1).padStart(2, "0");
  const uniqueId = item.path.split("/")[2] ?? crypto.randomUUID();

  return `${publicId}/${item.mediaKind}/${prefix}-${basename}-${uniqueId}${extension}`;
}

function isMediaKind(value: string): value is MediaKind {
  return value === "photo" || value === "video" || value === "license";
}

function formatMediaKind(mediaKind: MediaKind) {
  return mediaKind === "license" ? "License image" : mediaKind;
}

function isPendingStoragePathForDriver(
  path: string,
  driverId: string,
  mediaKind?: MediaKind,
) {
  const segments = path.split("/");

  return segments.length === 5
    && segments[0] === "pending"
    && segments[1] === driverId
    && isUuid(segments[2])
    && (!mediaKind || segments[3] === mediaKind)
    && Boolean(segments[4]);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(value);
}

async function getPendingUploadMetadata(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  path: string,
) {
  const segments = path.split("/");
  const fileName = segments.at(-1) ?? "";
  const directory = segments.slice(0, -1).join("/");
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKETS.submissionMedia)
    .list(directory, { limit: 10, search: fileName });

  if (error) {
    throw new Error(`Unable to verify uploaded media: ${error.message}`);
  }

  const file = data.find((candidate) => candidate.name === fileName);
  const sizeBytes = Number(file?.metadata?.size);
  const mimeType = typeof file?.metadata?.mimetype === "string"
    ? file.metadata.mimetype
    : "";

  if (!file || !Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || !mimeType) {
    throw new Error("Uploaded media could not be verified.");
  }

  return { mimeType, sizeBytes };
}

function getExtensionForMimeType(mimeType: string) {
  const extensions: Record<string, string> = {
    "image/avif": ".avif",
    "image/heic": ".heic",
    "image/heif": ".heif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/webm": ".webm",
    "video/x-m4v": ".m4v",
  };

  return extensions[mimeType] ?? "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
