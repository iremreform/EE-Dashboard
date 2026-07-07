import { NextResponse } from "next/server";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminAlertDeleteRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: AdminAlertDeleteRouteProps) {
  await requireActiveAdmin();
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  await supabase.from("alerts").delete().eq("id", id);

  return NextResponse.redirect(getReturnUrl(request), 303);
}

function getReturnUrl(request: Request) {
  const referer = request.headers.get("referer");
  return referer ? new URL(referer) : new URL("/admin/dashboard", request.url);
}
