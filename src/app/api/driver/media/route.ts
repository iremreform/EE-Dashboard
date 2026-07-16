import { NextResponse } from "next/server";
import { getDriverAccessByAuthUserId } from "@/lib/admin-drivers";
import {
  createSignedMediaUpload,
  removePendingMediaUpload,
} from "@/lib/driver-media";
import { getMediaUploadLimitLabel, type MediaKind } from "@/lib/media-limits";
import { isSameOriginRequest } from "@/lib/request-security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MediaRequestBody = {
  contentType?: string;
  fileName?: string;
  mediaKind?: string;
  path?: string;
  sizeBytes?: number;
};

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const driver = await requireActiveDriverForApi();

  if (driver instanceof NextResponse) {
    return driver;
  }

  const body = await readMediaRequestBody(request);

  if (
    !body?.fileName ||
    !body.mediaKind ||
    !isMediaKind(body.mediaKind) ||
    body.fileName.length > 255 ||
    (body.contentType?.length ?? 0) > 100 ||
    typeof body.sizeBytes !== "number"
  ) {
    return jsonResponse({ error: "Invalid media upload request" }, 400);
  }

  try {
    const upload = await createSignedMediaUpload({
      contentType: body.contentType ?? "",
      driverId: driver.id,
      fileName: body.fileName,
      mediaKind: body.mediaKind,
      sizeBytes: body.sizeBytes,
    });

    return jsonResponse(upload);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : `File must be ${getMediaUploadLimitLabel(body.mediaKind)} or smaller.`;

    return jsonResponse({ error: message }, 400);
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const driver = await requireActiveDriverForApi();

  if (driver instanceof NextResponse) {
    return driver;
  }

  const body = await readMediaRequestBody(request);

  if (!body?.path) {
    return jsonResponse({ error: "Missing media path" }, 400);
  }

  try {
    await removePendingMediaUpload(body.path, driver.id);
    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove media upload.";
    return jsonResponse({ error: message }, 403);
  }
}

async function requireActiveDriverForApi() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const driver = await getDriverAccessByAuthUserId(data.user.id);

  if (!driver || driver.status !== "active") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  return driver;
}

function isMediaKind(value: string): value is MediaKind {
  return value === "photo" || value === "video" || value === "license";
}

async function readMediaRequestBody(request: Request) {
  try {
    return (await request.json()) as MediaRequestBody;
  } catch {
    return null;
  }
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, no-store" },
    status,
  });
}
