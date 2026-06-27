import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminStatus = "active" | "disabled";

export async function getAdminAccessByAuthUserId(authUserId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, status")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to verify admin access: ${error.message}`);
  }

  return data as { id: string; status: AdminStatus } | null;
}

export async function requireActiveAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/admin/login");
  }

  const admin = await getAdminAccessByAuthUserId(data.user.id);

  if (!admin || admin.status !== "active") {
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return {
    admin,
    user: data.user,
  };
}

