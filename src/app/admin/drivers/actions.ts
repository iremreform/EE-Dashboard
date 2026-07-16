"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/lib/admin-auth";
import {
  resetAdminDriverPassword,
  setAdminDriverStatus,
} from "@/lib/admin-drivers";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

const ERROR_MESSAGES = {
  missingDriver: "Driver action could not be completed. Please try again.",
  password: `Temporary password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  reset: "Password could not be reset. Please try again.",
  status: "Driver status could not be updated. Please try again.",
} as const;

export async function disableDriverAction(formData: FormData) {
  await updateDriverStatus(formData, "disabled");
}

export async function reenableDriverAction(formData: FormData) {
  await updateDriverStatus(formData, "active");
}

export async function resetDriverPasswordAction(formData: FormData) {
  const { admin } = await requireActiveAdmin();
  const driverId = getFormValue(formData, "driver_id");
  const searchQuery = getFormValue(formData, "q");
  const temporaryPassword = getFormValue(formData, "temporary_password");
  const resetParams = {
    reset: driverId,
    ...(searchQuery ? { q: searchQuery } : {}),
  };

  if (!driverId) {
    redirectWithError(ERROR_MESSAGES.missingDriver);
  }

  if (temporaryPassword.length < MIN_PASSWORD_LENGTH) {
    redirectWithError(ERROR_MESSAGES.password, resetParams);
  }

  try {
    await resetAdminDriverPassword({
      actorAdminId: admin.id,
      driverId,
      temporaryPassword,
    });
  } catch (error) {
    console.error("Unable to reset driver password", error);
    redirectWithError(ERROR_MESSAGES.reset, resetParams);
  }

  revalidatePath("/admin/drivers");
  const successQuery = new URLSearchParams({
    saved: "password-reset",
    ...resetParams,
  });
  redirect(`/admin/drivers?${successQuery.toString()}`);
}

async function updateDriverStatus(formData: FormData, status: "active" | "disabled") {
  const { admin } = await requireActiveAdmin();
  const driverId = getFormValue(formData, "driver_id");

  if (!driverId) {
    redirectWithError(ERROR_MESSAGES.missingDriver);
  }

  try {
    await setAdminDriverStatus({
      actorAdminId: admin.id,
      driverId,
      status,
    });
  } catch {
    redirectWithError(ERROR_MESSAGES.status);
  }

  revalidatePath("/admin/drivers");
  redirect(`/admin/drivers?saved=${status === "disabled" ? "disabled" : "reenabled"}`);
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithError(message: string, params: Record<string, string> = {}): never {
  const query = new URLSearchParams({
    error: message,
    ...params,
  });

  redirect(`/admin/drivers?${query.toString()}`);
}
