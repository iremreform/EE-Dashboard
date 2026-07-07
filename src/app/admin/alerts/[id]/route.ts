import { NextResponse } from "next/server";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminAlertRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: AdminAlertRouteProps) {
  await requireActiveAdmin();
  const { id } = await params;
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

  const { error: resolveError } = await supabase
    .from("alerts")
    .update({ status: "resolved" })
    .eq("id", id)
    .eq("status", "open");

  if (resolveError) {
    await supabase.from("alerts").delete().eq("id", id);
  }

  const submission = Array.isArray(data?.submissions)
    ? data?.submissions[0]
    : data?.submissions;
  const destination = submission?.public_id
    ? `/admin/submissions/${submission.public_id}`
    : "/admin/submissions";

  return NextResponse.redirect(new URL(destination, request.url));
}
