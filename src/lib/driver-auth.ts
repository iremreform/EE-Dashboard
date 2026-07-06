import "server-only";
import { redirect } from "next/navigation";
import { getDriverAccessByAuthUserId } from "@/lib/admin-drivers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireActiveDriver({
  allowPasswordChangeRequired = false,
}: {
  allowPasswordChangeRequired?: boolean;
} = {}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/driver/login");
  }

  const driver = await getDriverAccessByAuthUserId(data.user.id);

  if (!driver || driver.status !== "active") {
    await supabase.auth.signOut();
    redirect("/driver/login");
  }

  if (data.user.user_metadata?.must_change_password && !allowPasswordChangeRequired) {
    redirect("/driver/change-password?required=1");
  }

  return {
    driver,
    user: data.user,
  };
}
