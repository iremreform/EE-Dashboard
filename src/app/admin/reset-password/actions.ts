"use server";

import { redirect } from "next/navigation";
import { getAdminAccessByAuthUserId } from "@/lib/admin-auth";
import { setAdminRecoveryProof } from "@/lib/admin-recovery";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const INVALID_LINK_MESSAGE =
  "Password reset link is invalid or expired. Please request a new link.";
const INACTIVE_ACCOUNT_MESSAGE =
  "This admin account is not active. Please contact another administrator.";

export async function verifyAdminRecoveryAction(formData: FormData) {
  const tokenHash = getFormValue(formData, "token_hash");
  const recoveryType = getFormValue(formData, "type");

  if (!tokenHash || recoveryType !== "recovery") {
    redirectToRecovery(INVALID_LINK_MESSAGE);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  if (error || !data.user) {
    redirectToRecovery(INVALID_LINK_MESSAGE);
  }

  const admin = await getAdminAccessByAuthUserId(data.user.id);

  if (!admin || admin.status !== "active") {
    await supabase.auth.signOut();
    redirectToRecovery(INACTIVE_ACCOUNT_MESSAGE);
  }

  await setAdminRecoveryProof(data.user.id);
  redirect("/admin/change-password?recovery=1");
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToRecovery(message: string): never {
  redirect(`/admin/forgot-password?error=${encodeURIComponent(message)}`);
}
