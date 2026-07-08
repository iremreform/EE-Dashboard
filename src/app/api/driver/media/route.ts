import { NextResponse } from "next/server";
import { getDriverAccessByAuthUserId } from "@/lib/admin-drivers";
import {
  createSignedMediaUpload,
  removePendingMediaUpload,
} from "@/lib/driver-media";
import { getMediaUploadLimitLabel, type MediaKind } from "@/lib/media-limits";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MediaRequestBody = {
  contentType?: string;
  fileName?: string;
  mediaKind?: string;
  path?: string;
  sizeBytes?: number;
};

export async function POST(request: Request) {
  const driver = await requireActiveDriverForApi();

  if (driver instanceof NextResponse) {
    return driver;
  }

  const body = (await request.json()) as MediaRequestBody;

  if (
    !body.fileName ||
    !body.mediaKind ||
    !isMediaKind(body.mediaKind) ||
    typeof body.sizeBytes !== "number"
  ) {
    return NextResponse.json({ error: "Invalid media upload request" }, { status: 400 });
  }

  try {
    const upload = await createSignedMediaUpload({
      contentType: body.contentType ?? "",
      driverId: driver.id,
      fileName: body.fileName,
      mediaKind: body.mediaKind,
      sizeBytes: body.sizeBytes,
    });

    return NextResponse.json(upload);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : `File must be ${getMediaUploadLimitLabel(body.mediaKind)} or smaller.`;

    return NextResponse.json({ error: message }, { status: 413 });
  }
}

export async function DELETE(request: Request) {
  const driver = await requireActiveDriverForApi();

  if (driver instanceof NextResponse) {
    return driver;
  }

  const body = (await request.json()) as MediaRequestBody;

  if (!body.path) {
    return NextResponse.json({ error: "Missing media path" }, { status: 400 });
  }

  await removePendingMediaUpload(body.path);
  return NextResponse.json({ ok: true });
}

async function requireActiveDriverForApi() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const driver = await getDriverAccessByAuthUserId(data.user.id);

  if (!driver || driver.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return driver;
}

function isMediaKind(value: string): value is MediaKind {
  return value === "photo" || value === "video" || value === "license";
}
