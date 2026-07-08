import { NextResponse } from "next/server";
import { getAdminAccessByAuthUserId } from "@/lib/admin-auth";
import { getDriverAccessByAuthUserId } from "@/lib/admin-drivers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ target: "/admin/login" }, { status: 401 });
  }

  const admin = await getAdminAccessByAuthUserId(data.user.id);

  if (admin?.status === "active") {
    return NextResponse.json({ target: "/admin/change-password?recovery=1" });
  }

  const driver = await getDriverAccessByAuthUserId(data.user.id);

  if (driver?.status === "active") {
    return NextResponse.json({ target: "/driver/change-password?recovery=1" });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ target: "/admin/login?error=Account access is not active." }, { status: 403 });
}
