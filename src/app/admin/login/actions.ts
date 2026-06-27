"use server";

import { redirect } from "next/navigation";
import { getAdminAccessByAuthUserId } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ERROR_MESSAGES = {
  disabled: "This admin account is disabled.",
  invalid: "Invalid email or password.",
  required: "Email and password are required.",
  unauthorized: "This account does not have admin access.",
} as const;

export async function adminLoginAction(formData: FormData) {
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

  const admin = await getAdminAccessByAuthUserId(data.user.id);

  if (!admin) {
    await supabase.auth.signOut();
    redirectWithError(ERROR_MESSAGES.unauthorized);
  }

  if (admin.status !== "active") {
    await supabase.auth.signOut();
    redirectWithError(ERROR_MESSAGES.disabled);
  }

  redirect("/admin/dashboard");
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string): never {
  redirect(`/admin/login?error=${encodeURIComponent(message)}`);
}

