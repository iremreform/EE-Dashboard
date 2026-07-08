import "server-only";
import { SUPABASE_BUCKETS } from "@/lib/supabase/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getMediaUploadLimitLabel,
  isWithinMediaUploadLimit,
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
  media: UploadedMediaRef[];
  publicId: string;
  submissionId: string;
};

export const UPLOADED_MEDIA_FIELD_NAME = "uploaded-media";

export async function createSignedMediaUpload({
  contentType,
  driverId,
  fileName,
  mediaKind,
  sizeBytes,
}: SignedMediaUploadInput) {
  if (!isWithinMediaUploadLimit(mediaKind, sizeBytes)) {
    throw new Error(
      `${formatMediaKind(mediaKind)} uploads must be ${getMediaUploadLimitLabel(mediaKind)} or smaller.`,
    );
  }

  const supabase = createSupabaseAdminClient();
  const path = buildPendingStoragePath({ driverId, fileName, mediaKind });
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKETS.submissionMedia)
    .createSignedUploadUrl(path, { upsert: false });

  if (error) {
    throw new Error(`Unable to create media upload URL: ${error.message}`);
  }

  return {
    contentType,
    path: data.path,
    token: data.token,
  };
}

export async function removePendingMediaUpload(path: string) {
  if (!isPendingStoragePath(path)) {
    throw new Error("Only pending media uploads can be removed.");
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
  media,
  publicId,
  submissionId,
}: FinalizeSubmissionMediaInput) {
  if (!media.length) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const finalizedPaths: string[] = [];

  try {
    const mediaRows = await Promise.all(
      media.map(async (item, index) => {
        if (!isPendingStoragePath(item.path)) {
          throw new Error("Invalid uploaded media path.");
        }

        const storagePath = buildFinalStoragePath({
          index,
          item,
          publicId,
        });
        const { error: moveError } = await supabase.storage
          .from(SUPABASE_BUCKETS.submissionMedia)
          .move(item.path, storagePath);

        if (moveError) {
          throw new Error(`Unable to finalize ${item.label}: ${moveError.message}`);
        }

        finalizedPaths.push(storagePath);

        return {
          label: item.label,
          media_kind: item.mediaKind,
          mime_type: item.mimeType || null,
          size_bytes: item.sizeBytes,
          storage_bucket: SUPABASE_BUCKETS.submissionMedia,
          storage_path: storagePath,
          submission_id: submissionId,
        };
      }),
    );

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
      !parsed.label ||
      !parsed.mediaKind ||
      !isMediaKind(parsed.mediaKind) ||
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
}: {
  driverId: string;
  fileName: string;
  mediaKind: MediaKind;
}) {
  const extension = getFileExtension(fileName);
  const basename = slugify(fileName || mediaKind);
  return `pending/${driverId}/${crypto.randomUUID()}/${mediaKind}/${basename}${extension}`;
}

function buildFinalStoragePath({
  index,
  item,
  publicId,
}: {
  index: number;
  item: UploadedMediaRef;
  publicId: string;
}) {
  const extension = getFileExtension(item.originalName);
  const basename = slugify(item.originalName || item.label || item.mediaKind);
  const prefix = String(index + 1).padStart(2, "0");
  const uniqueId = item.path.split("/")[2] ?? crypto.randomUUID();

  return `${publicId}/${item.mediaKind}/${prefix}-${basename}-${uniqueId}${extension}`;
}

function getFileExtension(fileName: string) {
  const extension = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : "";
  return extension.toLowerCase();
}

function isMediaKind(value: string): value is MediaKind {
  return value === "photo" || value === "video" || value === "license";
}

function formatMediaKind(mediaKind: MediaKind) {
  return mediaKind === "license" ? "License image" : mediaKind;
}

function isPendingStoragePath(path: string) {
  return path.startsWith("pending/");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
