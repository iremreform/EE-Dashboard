"use server";

import { redirect } from "next/navigation";
import {
  formDataToPayload,
  getFormValue,
  parseFuelLevel,
  parseMileage,
  parseYesNo,
} from "@/lib/driver-form-data";
import { requireActiveDriver } from "@/lib/driver-auth";
import { createPickupSubmission } from "@/lib/driver-submissions";

const ERROR_MESSAGES = {
  confirmation: "Please confirm the guest and driver acknowledgements before submitting.",
  reservation: "Enter a valid reservation number before submitting.",
  unknown: "Pickup report could not be submitted. Please try again.",
} as const;

export async function createPickupSubmissionAction(formData: FormData) {
  const { driver } = await requireActiveDriver();
  const reservationNumber = getReservationNumber(formData);

  if (!reservationNumber) {
    redirectWithError(ERROR_MESSAGES.reservation);
  }

  const guestConfirmed = formData.get("pickup-guest-confirmation") === "on";
  const driverConfirmed = formData.get("pickup-driver-confirmation") === "on";

  if (!guestConfirmed || !driverConfirmed) {
    redirectWithError(ERROR_MESSAGES.confirmation);
  }

  try {
    await createPickupSubmission({
      checklist: {
        hasNewDamage: parseYesNo(getFormValue(formData, "pickup-new-damage")),
        hasSmokingEvidence: parseYesNo(getFormValue(formData, "pickup-smoking-vaping-evidence")),
        isLateReturn: parseYesNo(getFormValue(formData, "pickup-late-return")),
        keysReturned: parseYesNo(getFormValue(formData, "pickup-keys-returned")),
        personalItemsRemoved: parseYesNo(getFormValue(formData, "pickup-personal-items-removed")),
      },
      driverId: driver.id,
      formPayload: formDataToPayload(formData),
      fuelLevelPercent: parseFuelLevel(getFormValue(formData, "pickup-checklist-fuel-level")),
      guestConfirmed,
      mileage: parseMileage(getFormValue(formData, "pickup-checklist-mileage")),
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

function getReservationNumber(formData: FormData) {
  return (
    getFormValue(formData, "pickup-guest-reservation-number") ||
    getFormValue(formData, "pickup-search")
  );
}

function redirectWithError(message: string): never {
  redirect(`/driver/pickup?error=${encodeURIComponent(message)}`);
}
