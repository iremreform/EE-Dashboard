"use server";

import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/lib/admin-auth";
import {
  clearAdminRecoveryProof,
  hasAdminRecoveryProof,
} from "@/lib/admin-recovery";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ERROR_MESSAGES = {
  current: "Current password is incorrect.",
  mismatch: "New password and confirmation do not match.",
  password: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  required: "Current password, new password, and confirmation are required.",
  same: "New password must be different from your current password.",
  unknown: "Password could not be changed. Please try again.",
} as const;

export async function changeAdminPasswordAction(formData: FormData) {
  const { user } = await requireActiveAdmin({ allowPasswordChangeRequired: true });
  const currentPassword = getFormValue(formData, "current_password");
  const isRecovery = await hasAdminRecoveryProof(user.id);
  const newPassword = getFormValue(formData, "new_password");
  const confirmPassword = getFormValue(formData, "confirm_password");

  if (!user.email || (!isRecovery && !currentPassword) || !newPassword || !confirmPassword) {
    redirectWithError(ERROR_MESSAGES.required, isRecovery);
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    redirectWithError(ERROR_MESSAGES.password, isRecovery);
  }

  if (newPassword !== confirmPassword) {
    redirectWithError(ERROR_MESSAGES.mismatch, isRecovery);
  }

  if (!isRecovery && newPassword === currentPassword) {
    redirectWithError(ERROR_MESSAGES.same, isRecovery);
  }

  const supabase = await createSupabaseServerClient();

  if (!isRecovery) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      redirectWithError(ERROR_MESSAGES.current, isRecovery);
    }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      must_change_password: false,
    },
    password: newPassword,
  });

  if (updateError) {
    redirectWithError(ERROR_MESSAGES.unknown, isRecovery);
  }

  await clearAdminRecoveryProof();
  redirect("/admin/dashboard?passwordChanged=1");
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string, isRecovery = false): never {
  const recovery = isRecovery ? "&recovery=1" : "";
  redirect(`/admin/change-password?error=${encodeURIComponent(message)}${recovery}`);
}
