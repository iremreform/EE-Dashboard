import "server-only";
import { getPickupIssueMessages } from "@/lib/pickup-rules";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CreateDeliverySubmissionInput = {
  driverId: string;
  formPayload: Record<string, FormDataEntryValue>;
  fuelLevelPercent?: number;
  guestConfirmed: boolean;
  hasPaymentVerified: boolean;
  mileage?: number;
  reservationNumber: string;
};

type CreatePickupSubmissionInput = {
  checklist: {
    hasNewDamage: boolean | null;
    hasSmokingEvidence: boolean | null;
    isLateReturn: boolean | null;
    keysReturned: boolean | null;
    personalItemsRemoved: boolean | null;
  };
  driverId: string;
  formPayload: Record<string, FormDataEntryValue>;
  fuelLevelPercent?: number;
  guestConfirmed: boolean;
  mileage?: number;
  reservationNumber: string;
};

type ReservationLookup = {
  id: string;
  reservation_number: string;
};

type DeliveryBaseline = {
  fuel_level_percent: number | null;
  id: string;
  mileage: number | null;
  public_id: string;
};

export async function createDeliverySubmission(input: CreateDeliverySubmissionInput) {
  const supabase = createSupabaseAdminClient();
  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("id, reservation_number")
    .eq("reservation_number", input.reservationNumber)
    .maybeSingle();

  if (reservationError) {
    throw new Error(`Unable to find reservation: ${reservationError.message}`);
  }

  if (!reservation) {
    throw new Error("Reservation was not found.");
  }

  const publicId = `${reservation.reservation_number}-delivery-${Date.now().toString(36)}`;
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      checklist_payload: {
        driver_confirmation: true,
        guest_confirmation: input.guestConfirmed,
      },
      driver_id: input.driverId,
      form_payload: input.formPayload,
      fuel_level_percent: input.fuelLevelPercent ?? null,
      mileage: input.mileage ?? null,
      payment_status: input.hasPaymentVerified ? "verified" : "not_verified",
      public_id: publicId,
      reservation_id: reservation.id,
      submission_type: "delivery",
    })
    .select("id")
    .single();

  if (submissionError) {
    throw new Error(`Unable to create delivery report: ${submissionError.message}`);
  }

  const { error: paymentError } = await supabase
    .from("payment_verifications")
    .upsert({
      is_verified: input.hasPaymentVerified,
      reservation_id: reservation.id,
      verified_at: input.hasPaymentVerified ? new Date().toISOString() : null,
    }, { onConflict: "reservation_id" });

  if (paymentError) {
    throw new Error(`Unable to update payment status: ${paymentError.message}`);
  }

  const { error: alertError } = await supabase.from("alerts").insert({
    alert_type: "new_submission",
    message: `Delivery report submitted for Res #${reservation.reservation_number}.`,
    reservation_id: reservation.id,
    severity: "info",
    submission_id: submission.id,
    title: "New delivery report submitted",
  });

  if (alertError) {
    throw new Error(`Unable to create submission alert: ${alertError.message}`);
  }

  await supabase
    .from("drivers")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", input.driverId);

  await supabase.from("audit_events").insert({
    action: "submission_created",
    actor_driver_id: input.driverId,
    actor_type: "driver",
    entity_id: submission.id,
    entity_type: "submission",
    metadata: {
      public_id: publicId,
      reservation_number: reservation.reservation_number,
      submission_type: "delivery",
    },
  });

  return {
    publicId,
    submissionId: submission.id as string,
  };
}

export async function createPickupSubmission(input: CreatePickupSubmissionInput) {
  const supabase = createSupabaseAdminClient();
  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .select("id, reservation_number")
    .eq("reservation_number", input.reservationNumber)
    .maybeSingle();

  if (reservationError) {
    throw new Error(`Unable to find reservation: ${reservationError.message}`);
  }

  if (!reservation) {
    throw new Error("Reservation was not found.");
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from("submissions")
    .select("id, public_id, mileage, fuel_level_percent")
    .eq("reservation_id", reservation.id)
    .eq("submission_type", "delivery")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (deliveryError) {
    throw new Error(`Unable to find matching delivery report: ${deliveryError.message}`);
  }

  const { data: paymentVerification, error: paymentError } = await supabase
    .from("payment_verifications")
    .select("is_verified")
    .eq("reservation_id", reservation.id)
    .maybeSingle();

  if (paymentError) {
    throw new Error(`Unable to read payment status: ${paymentError.message}`);
  }

  const baseline = delivery as DeliveryBaseline | null;
  const issues = getPickupIssueMessages(input, baseline);
  const publicId = `${reservation.reservation_number}-pickup-${Date.now().toString(36)}`;
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({
      checklist_payload: {
        delivery_submission_id: baseline?.id ?? null,
        driver_confirmation: true,
        guest_confirmation: input.guestConfirmed,
        issue_messages: issues,
        keys_returned: input.checklist.keysReturned,
        new_damage: input.checklist.hasNewDamage,
        personal_items_removed: input.checklist.personalItemsRemoved,
        smoking_vaping_evidence: input.checklist.hasSmokingEvidence,
        late_return: input.checklist.isLateReturn,
      },
      driver_id: input.driverId,
      form_payload: input.formPayload,
      fuel_level_percent: input.fuelLevelPercent ?? null,
      mileage: input.mileage ?? null,
      payment_status: paymentVerification?.is_verified ? "verified" : "not_verified",
      public_id: publicId,
      reservation_id: reservation.id,
      submission_type: "pickup",
    })
    .select("id")
    .single();

  if (submissionError) {
    throw new Error(`Unable to create pickup report: ${submissionError.message}`);
  }

  const alertTitle = issues.length
    ? "Pickup report needs review"
    : "New pickup report submitted";
  const alertMessage = issues.length
    ? `Pickup report submitted for Res #${reservation.reservation_number}: ${issues.join("; ")}.`
    : `Pickup report submitted for Res #${reservation.reservation_number}.`;
  const { error: alertError } = await supabase.from("alerts").insert({
    alert_type: "new_submission",
    message: alertMessage,
    reservation_id: reservation.id,
    severity: issues.length ? "warning" : "info",
    submission_id: submission.id,
    title: alertTitle,
  });

  if (alertError) {
    throw new Error(`Unable to create pickup alert: ${alertError.message}`);
  }

  await supabase
    .from("drivers")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", input.driverId);

  await supabase.from("audit_events").insert({
    action: "submission_created",
    actor_driver_id: input.driverId,
    actor_type: "driver",
    entity_id: submission.id,
    entity_type: "submission",
    metadata: {
      delivery_public_id: baseline?.public_id ?? null,
      issues,
      public_id: publicId,
      reservation_number: (reservation as ReservationLookup).reservation_number,
      submission_type: "pickup",
    },
  });

  return {
    publicId,
    submissionId: submission.id as string,
  };
}
