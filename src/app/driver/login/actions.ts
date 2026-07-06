"use server";

import { redirect } from "next/navigation";
import { getDriverAccessByAuthUserId } from "@/lib/admin-drivers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ERROR_MESSAGES = {
  disabled: "This driver account is disabled. Contact an administrator.",
  invalid: "Invalid email or password.",
  required: "Email and password are required.",
  unauthorized: "This account does not have driver access.",
} as const;

export async function driverLoginAction(formData: FormData) {
  const email = getFormValue(formData, "email").toLowerCase();
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirectWithError(ERROR_MESSAGES.required);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirectWithError(ERROR_MESSAGES.invalid);
  }

  const driver = await getDriverAccessByAuthUserId(data.user.id);

  if (!driver) {
    await supabase.auth.signOut();
    redirectWithError(ERROR_MESSAGES.unauthorized);
  }

  if (driver.status !== "active") {
    await supabase.auth.signOut();
    redirectWithError(ERROR_MESSAGES.disabled);
  }

  if (data.user.user_metadata?.must_change_password) {
    redirect("/driver/change-password?required=1");
  }

  redirect("/driver/dashboard");
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string): never {
  redirect(`/driver/login?error=${encodeURIComponent(message)}`);
}
