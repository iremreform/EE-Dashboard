import { NextResponse } from "next/server";
import { getDriverAccessByAuthUserId } from "@/lib/admin-drivers";
import {
  createSignedMediaUpload,
  removePendingMediaUpload,
  type MediaKind,
} from "@/lib/driver-media";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MediaRequestBody = {
  contentType?: string;
  fileName?: string;
  mediaKind?: string;
  path?: string;
};

export async function POST(request: Request) {
  const driver = await requireActiveDriverForApi();

  if (driver instanceof NextResponse) {
    return driver;
  }

  const body = (await request.json()) as MediaRequestBody;

  if (!body.fileName || !body.mediaKind || !isMediaKind(body.mediaKind)) {
    return NextResponse.json({ error: "Invalid media upload request" }, { status: 400 });
  }

  const upload = await createSignedMediaUpload({
    contentType: body.contentType ?? "",
    driverId: driver.id,
    fileName: body.fileName,
    mediaKind: body.mediaKind,
  });

  return NextResponse.json(upload);
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
