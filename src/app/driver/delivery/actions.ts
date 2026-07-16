"use server";

import { redirect } from "next/navigation";
import {
  formDataToPayload,
  getDriverReportValidationError,
  getFormValue,
  parseFuelLevel,
  parseMileage,
} from "@/lib/driver-form-data";
import { finalizeSubmissionMedia, parseUploadedMediaRefs } from "@/lib/driver-media";
import { requireActiveDriver } from "@/lib/driver-auth";
import { createDeliverySubmission } from "@/lib/driver-submissions";

const ERROR_MESSAGES = {
  confirmation: "Please confirm the guest and driver acknowledgements before submitting.",
  reservation: "Enter a valid reservation number before submitting.",
  signature: "Please capture the guest signature before submitting.",
  unknown: "Delivery report could not be submitted. Please try again.",
} as const;

export async function createDeliverySubmissionAction(formData: FormData) {
  const { driver } = await requireActiveDriver();
  const reservationNumber = getFormValue(formData, "delivery-guest-reservation-number");
  const uploadedMedia = parseUploadedMediaRefs(formData);
  let completedPublicId = "";

  const validationError = getDriverReportValidationError({
    formData,
    media: uploadedMedia,
    type: "delivery",
  });

  if (validationError) {
    redirectWithError(validationError);
  }

  if (!reservationNumber) {
    redirectWithError(ERROR_MESSAGES.reservation);
  }

  const guestConfirmed = formData.get("delivery-guest-confirmation") === "on";
  const driverConfirmed = formData.get("delivery-driver-confirmation") === "on";

  if (!guestConfirmed || !driverConfirmed) {
    redirectWithError(ERROR_MESSAGES.confirmation);
  }

  if (!getFormValue(formData, "delivery-guest-signature")) {
    redirectWithError(ERROR_MESSAGES.signature);
  }

  try {
    const submission = await createDeliverySubmission({
      driverId: driver.id,
      formPayload: formDataToPayload(formData),
      fuelLevelPercent: parseFuelLevel(getFormValue(formData, "delivery-vehicle-mileage-fuel-level")),
      guestConfirmed,
      hasPaymentVerified: parsePaymentVerified(getFormValue(formData, "payment-status")),
      mileage: parseMileage(getFormValue(formData, "delivery-vehicle-mileage-fuel-level")),
      reservationNumber,
    });
    completedPublicId = submission.publicId;
    await finalizeSubmissionMedia({
      driverId: driver.id,
      media: uploadedMedia,
      publicId: submission.publicId,
      submissionId: submission.submissionId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Reservation was not found")) {
      redirectWithError("Reservation was not found. Please check the reservation number.");
    }

    redirectWithError(ERROR_MESSAGES.unknown);
  }

  redirect(`/driver/complete?report=${encodeURIComponent(completedPublicId)}`);
}
function parsePaymentVerified(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes("verified") && !normalized.includes("not");
}

function redirectWithError(message: string): never {
  redirect(`/driver/delivery?error=${encodeURIComponent(message)}`);
}
