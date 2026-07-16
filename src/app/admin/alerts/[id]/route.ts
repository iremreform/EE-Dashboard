import { NextResponse } from "next/server";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSameOriginRequest } from "@/lib/request-security";

type AdminAlertRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: AdminAlertRouteProps) {
  await requireActiveAdmin();
  const destination = await getAlertDestination((await params).id);
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function POST(request: Request, { params }: AdminAlertRouteProps) {
  if (!isSameOriginRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  await requireActiveAdmin();
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const destination = await getAlertDestination(id);

  const { error: resolveError } = await supabase
    .from("alerts")
    .update({ status: "resolved" })
    .eq("id", id)
    .eq("status", "open");

  if (resolveError) {
    return new Response("Unable to update notification", {
      headers: { "Cache-Control": "private, no-store" },
      status: 500,
    });
  }

  return NextResponse.json({ destination }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

async function getAlertDestination(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("alerts")
    .select(`
      id,
      submissions (
        public_id
      )
    `)
    .eq("id", id)
    .maybeSingle();
  const submission = Array.isArray(data?.submissions)
    ? data.submissions[0]
    : data?.submissions;

  return submission?.public_id
    ? `/admin/submissions/${submission.public_id}`
    : "/admin/submissions";
}
