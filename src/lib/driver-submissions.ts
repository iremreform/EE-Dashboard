import "server-only";
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

