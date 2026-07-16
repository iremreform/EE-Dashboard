import { NextResponse } from "next/server";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSafeReturnUrl, isSameOriginRequest } from "@/lib/request-security";

type AdminAlertDeleteRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: AdminAlertDeleteRouteProps) {
  if (!isSameOriginRequest(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  await requireActiveAdmin();
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("alerts").delete().eq("id", id);

  if (error) {
    return new Response("Unable to delete notification", { status: 500 });
  }

  const response = NextResponse.redirect(getSafeReturnUrl(request, "/admin/dashboard"), 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
