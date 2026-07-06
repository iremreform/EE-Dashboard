import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminStatus = "active" | "disabled";

export function adminRequiresPasswordChange(
  metadata: Record<string, unknown> | null | undefined,
) {
  return metadata?.must_change_password !== false;
}

export async function getAdminAccessByAuthUserId(authUserId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("email, first_name, id, last_name, status")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to verify admin access: ${error.message}`);
  }

  return data as {
    email: string;
    first_name: string | null;
    id: string;
    last_name: string | null;
    status: AdminStatus;
  } | null;
}

export async function requireActiveAdmin({
  allowPasswordChangeRequired = false,
}: {
  allowPasswordChangeRequired?: boolean;
} = {}) {
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

  if (adminRequiresPasswordChange(data.user.user_metadata) && !allowPasswordChangeRequired) {
    redirect("/admin/change-password?required=1");
  }

  return {
    admin,
    user: data.user,
  };
}
