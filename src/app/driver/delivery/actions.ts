"use server";

import { redirect } from "next/navigation";
import { requireActiveDriver } from "@/lib/driver-auth";
import { createDeliverySubmission } from "@/lib/driver-submissions";

const ERROR_MESSAGES = {
  confirmation: "Please confirm the guest and driver acknowledgements before submitting.",
  reservation: "Enter a valid reservation number before submitting.",
  unknown: "Delivery report could not be submitted. Please try again.",
} as const;

export async function createDeliverySubmissionAction(formData: FormData) {
  const { driver } = await requireActiveDriver();
  const reservationNumber = getFormValue(formData, "delivery-guest-reservation-number");

  if (!reservationNumber) {
    redirectWithError(ERROR_MESSAGES.reservation);
  }

  const guestConfirmed = formData.get("delivery-guest-confirmation") === "on";
  const driverConfirmed = formData.get("delivery-driver-confirmation") === "on";

  if (!guestConfirmed || !driverConfirmed) {
    redirectWithError(ERROR_MESSAGES.confirmation);
  }

  try {
    await createDeliverySubmission({
      driverId: driver.id,
      formPayload: formDataToPayload(formData),
      fuelLevelPercent: parseFuelLevel(getFormValue(formData, "delivery-vehicle-mileage-fuel-level")),
      guestConfirmed,
      hasPaymentVerified: parsePaymentVerified(getFormValue(formData, "payment-status")),
      mileage: parseMileage(getFormValue(formData, "delivery-vehicle-mileage-fuel-level")),
      reservationNumber,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Reservation was not found")) {
      redirectWithError("Reservation was not found. Please check the reservation number.");
    }

    redirectWithError(ERROR_MESSAGES.unknown);
  }

  redirect("/driver/complete");
}

function formDataToPayload(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).filter(([, value]) => typeof value === "string"),
  );
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parsePaymentVerified(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes("verified") && !normalized.includes("not");
}

function parseMileage(value: string) {
  const match = value.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : undefined;
}

function parseFuelLevel(value: string) {
  const match = value.match(/(\d{1,3})\s*%/);

  if (!match) {
    return undefined;
  }

  const fuelLevel = Number(match[1]);
  return fuelLevel >= 0 && fuelLevel <= 100 ? fuelLevel : undefined;
}

function redirectWithError(message: string): never {
  redirect(`/driver/delivery?error=${encodeURIComponent(message)}`);
}

