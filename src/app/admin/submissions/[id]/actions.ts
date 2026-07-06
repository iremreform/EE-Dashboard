"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SubmissionStatus = "submitted" | "completed" | "archived";
type PaymentStatus = "verified" | "not_verified";

const SUBMISSION_STATUSES: SubmissionStatus[] = ["submitted", "completed", "archived"];
const PAYMENT_STATUSES: PaymentStatus[] = ["verified", "not_verified"];

export async function updateAdminSubmissionAction(formData: FormData) {
  const { admin } = await requireActiveAdmin();
  const publicId = getFormValue(formData, "public_id");

  if (!publicId) {
    redirect("/admin/submissions?error=missing-submission");
  }

  const status = parseEnum(getFormValue(formData, "status"), SUBMISSION_STATUSES);
  const paymentStatus = parseEnum(getFormValue(formData, "payment_status"), PAYMENT_STATUSES);

  if (!status || !paymentStatus) {
    redirect(`/admin/submissions/${publicId}?error=invalid-status`);
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("submissions")
    .select(`
      id,
      form_payload,
      reservation_id,
      submission_type,
      status,
      payment_status,
      mileage,
      fuel_level_percent,
      reservations (
        guest_first_name,
        guest_last_name,
        member_number,
        reservation_number,
        vehicle_make_model,
        vehicle_color,
        vehicle_plate
      )
    `)
    .eq("public_id", publicId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Unable to load submission before update: ${existingError.message}`);
  }

  if (!existing) {
    redirect("/admin/submissions?error=missing-submission");
  }

  const reservationId = existing.reservation_id as string | null;

  if (!reservationId) {
    redirect(`/admin/submissions/${publicId}?error=missing-reservation`);
  }

  const reservationUpdates = {
    guest_first_name: getFormValue(formData, "guest_first_name") || null,
    guest_last_name: getFormValue(formData, "guest_last_name") || null,
    member_number: getFormValue(formData, "member_number") || null,
    reservation_number: getFormValue(formData, "reservation_number") || null,
    vehicle_color: getFormValue(formData, "vehicle_color") || null,
    vehicle_make_model: getFormValue(formData, "vehicle_make_model") || null,
    vehicle_plate: getFormValue(formData, "vehicle_plate") || null,
  };
  const mileageFuel = getFormValue(formData, "mileage_fuel");
  const formPayload = getUpdatedFormPayload({
    existingPayload: existing.form_payload,
    mileageFuel,
    submissionType: existing.submission_type,
  });
  const submissionUpdates = {
    form_payload: formPayload,
    fuel_level_percent: parseFuelLevel(mileageFuel),
    mileage: parseMileage(mileageFuel),
    payment_status: paymentStatus,
    status,
  };

  const { error: reservationError } = await supabase
    .from("reservations")
    .update(reservationUpdates)
    .eq("id", reservationId);

  if (reservationError) {
    throw new Error(`Unable to update reservation fields: ${reservationError.message}`);
  }

  const { error: submissionError } = await supabase
    .from("submissions")
    .update(submissionUpdates)
    .eq("id", existing.id);

  if (submissionError) {
    throw new Error(`Unable to update submission: ${submissionError.message}`);
  }

  const { error: paymentError } = await supabase
    .from("payment_verifications")
    .upsert({
      is_verified: paymentStatus === "verified",
      reservation_id: reservationId,
      verified_at: paymentStatus === "verified" ? new Date().toISOString() : null,
    }, { onConflict: "reservation_id" });

  if (paymentError) {
    throw new Error(`Unable to update payment verification: ${paymentError.message}`);
  }

  const noteBody = getFormValue(formData, "admin_note");

  if (noteBody) {
    const { error: noteError } = await supabase.from("submission_notes").insert({
      author_admin_user_id: admin.id,
      body: noteBody,
      submission_id: existing.id,
    });

    if (noteError) {
      throw new Error(`Unable to add admin note: ${noteError.message}`);
    }
  }

  const metadata = {
    admin_id: admin.id,
    changed_fields: getChangedFields({
      existing,
      reservationUpdates,
      submissionUpdates,
    }),
    note_added: Boolean(noteBody),
    public_id: publicId,
  };

  await supabase.from("audit_events").insert([
    {
      action: "submission_edited",
      actor_type: "admin",
      entity_id: existing.id,
      entity_type: "submission",
      metadata,
    },
    ...(existing.status !== status
      ? [{
          action: "submission_status_changed",
          actor_type: "admin",
          entity_id: existing.id,
          entity_type: "submission",
          metadata: {
            admin_id: admin.id,
            from: existing.status,
            public_id: publicId,
            to: status,
          },
        }]
      : []),
    ...(noteBody
      ? [{
          action: "submission_note_added",
          actor_type: "admin",
          entity_id: existing.id,
          entity_type: "submission",
          metadata: {
            admin_id: admin.id,
            public_id: publicId,
          },
        }]
      : []),
  ]);

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${publicId}`);
  redirect(`/admin/submissions/${publicId}?saved=1`);
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseEnum<T extends string>(value: string, allowed: readonly T[]) {
  return allowed.includes(value as T) ? (value as T) : null;
}

function getChangedFields({
  existing,
  reservationUpdates,
  submissionUpdates,
}: {
  existing: {
    fuel_level_percent: number | null;
    form_payload: Record<string, unknown> | null;
    mileage: number | null;
    payment_status: string;
    reservations:
      | {
          guest_first_name: string | null;
          guest_last_name: string | null;
          member_number: string | null;
          reservation_number: string | null;
          vehicle_color: string | null;
          vehicle_make_model: string | null;
          vehicle_plate: string | null;
        }
      | Array<{
          guest_first_name: string | null;
          guest_last_name: string | null;
          member_number: string | null;
          reservation_number: string | null;
          vehicle_color: string | null;
          vehicle_make_model: string | null;
          vehicle_plate: string | null;
        }>
      | null;
    status: string;
    submission_type: string;
  };
  reservationUpdates: Record<string, string | null>;
  submissionUpdates: {
    fuel_level_percent: number | null;
    form_payload: Record<string, unknown>;
    mileage: number | null;
    payment_status: PaymentStatus;
    status: SubmissionStatus;
  };
}) {
  const reservation = Array.isArray(existing.reservations)
    ? existing.reservations[0] ?? null
    : existing.reservations;
  const changedFields: string[] = [];

  for (const [key, value] of Object.entries(reservationUpdates)) {
    if ((reservation?.[key as keyof typeof reservation] ?? null) !== value) {
      changedFields.push(key);
    }
  }

  for (const [key, value] of Object.entries(submissionUpdates)) {
    if (key === "form_payload") {
      continue;
    }

    if (existing[key as keyof typeof submissionUpdates] !== value) {
      changedFields.push(key);
    }
  }

  if (existing.form_payload?.[`${existing.submission_type}-admin-mileage-fuel`] !== submissionUpdates.form_payload[`${existing.submission_type}-admin-mileage-fuel`]) {
    changedFields.push("mileage_fuel");
  }

  return changedFields;
}

function getUpdatedFormPayload({
  existingPayload,
  mileageFuel,
  submissionType,
}: {
  existingPayload: Record<string, unknown> | null;
  mileageFuel: string;
  submissionType: string;
}) {
  const payload = { ...(existingPayload ?? {}) };
  const adminKey = `${submissionType}-admin-mileage-fuel`;

  if (mileageFuel) {
    payload[adminKey] = mileageFuel;

    if (submissionType === "delivery") {
      payload["delivery-vehicle-mileage-fuel-level"] = mileageFuel;
    }
  } else {
    delete payload[adminKey];
  }

  return payload;
}

function parseMileage(value: string) {
  const match = value.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function parseFuelLevel(value: string) {
  const percentMatch = value.match(/(\d{1,3})\s*%/);

  if (!percentMatch) {
    return null;
  }

  const fuelLevel = Number(percentMatch[1]);
  return fuelLevel >= 0 && fuelLevel <= 100 ? fuelLevel : null;
}
