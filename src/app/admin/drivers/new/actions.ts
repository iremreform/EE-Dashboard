"use server";

import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { createAdminDriver } from "@/lib/admin-drivers";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

const ERROR_MESSAGES = {
  duplicate: "A driver with this email already exists.",
  password: `Temporary password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  required: "First name, last name, email, and temporary password are required.",
  unknown: "Driver could not be created. Please try again.",
} as const;

export async function createDriverAction(formData: FormData) {
  const { admin } = await requireActiveAdmin();
  const firstName = getFormValue(formData, "driver-first-name");
  const lastName = getFormValue(formData, "driver-last-name");
  const email = getFormValue(formData, "driver-email").toLowerCase();
  const phone = getFormValue(formData, "driver-phone-optional");
  const temporaryPassword = getFormValue(formData, "driver-password");

  if (!firstName || !lastName || !email || !temporaryPassword) {
    redirectWithError(ERROR_MESSAGES.required);
  }

  if (temporaryPassword.length < MIN_PASSWORD_LENGTH) {
    redirectWithError(ERROR_MESSAGES.password);
  }

  try {
    await createAdminDriver({
      actorAdminId: admin.id,
      email,
      firstName,
      lastName,
      phone,
      temporaryPassword,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (
      message.includes("duplicate key")
      || message.includes("drivers_email_key")
      || message.includes("already been registered")
      || message.includes("already exists")
    ) {
      redirectWithError(ERROR_MESSAGES.duplicate);
    }

    redirectWithError(ERROR_MESSAGES.unknown);
  }

  redirect("/admin/drivers");
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string): never {
  redirect(`/admin/drivers/new?error=${encodeURIComponent(message)}`);
}
