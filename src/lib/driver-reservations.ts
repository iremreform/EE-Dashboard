import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ReservationRow = {
  id: string;
  guest_first_name: string | null;
  guest_last_name: string | null;
  member_number: string | null;
  reservation_number: string | null;
  vehicle_color: string | null;
  vehicle_make_model: string | null;
  vehicle_plate: string | null;
};

type DeliveryBaselineRow = {
  fuel_level_percent: number | null;
  mileage: number | null;
};

export type DriverReservationLookup = {
  deliveryBaseline: {
    fuelLevelPercent: number | null;
    mileage: number | null;
  } | null;
  guestFirstName: string;
  guestLastName: string;
  memberNumber: string;
  paymentVerified: boolean;
  reservationNumber: string;
  vehicleColorPlate: string;
  vehicleMakeModel: string;
};

const RESERVATION_SELECT = `
  id,
  reservation_number,
  guest_first_name,
  guest_last_name,
  member_number,
  vehicle_make_model,
  vehicle_color,
  vehicle_plate
`;

export async function lookupDriverReservation(query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return null;
  }

  const reservation = await findReservation(normalizedQuery);

  if (!reservation) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const [paymentResult, deliveryResult] = await Promise.all([
    supabase
      .from("payment_verifications")
      .select("is_verified")
      .eq("reservation_id", reservation.id)
      .maybeSingle(),
    supabase
      .from("submissions")
      .select("mileage, fuel_level_percent")
      .eq("reservation_id", reservation.id)
      .eq("submission_type", "delivery")
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (paymentResult.error) {
    throw new Error(`Unable to load payment status: ${paymentResult.error.message}`);
  }

  if (deliveryResult.error) {
    throw new Error(`Unable to load delivery baseline: ${deliveryResult.error.message}`);
  }

  const deliveryBaseline = deliveryResult.data as DeliveryBaselineRow | null;

  return {
    deliveryBaseline: deliveryBaseline
      ? {
          fuelLevelPercent: deliveryBaseline.fuel_level_percent,
          mileage: deliveryBaseline.mileage,
        }
      : null,
    guestFirstName: reservation.guest_first_name ?? "",
    guestLastName: reservation.guest_last_name ?? "",
    memberNumber: reservation.member_number ?? "",
    paymentVerified: Boolean(paymentResult.data?.is_verified),
    reservationNumber: reservation.reservation_number ?? "",
    vehicleColorPlate: [reservation.vehicle_color, reservation.vehicle_plate]
      .filter(Boolean)
      .join(" - "),
    vehicleMakeModel: reservation.vehicle_make_model ?? "",
  } satisfies DriverReservationLookup;
}

async function findReservation(query: string) {
  const supabase = createSupabaseAdminClient();
  const byReservationNumber = await supabase
    .from("reservations")
    .select(RESERVATION_SELECT)
    .eq("reservation_number", query)
    .maybeSingle();

  if (byReservationNumber.error) {
    throw new Error(`Unable to lookup reservation: ${byReservationNumber.error.message}`);
  }

  if (byReservationNumber.data) {
    return byReservationNumber.data as ReservationRow;
  }

  const byMemberNumber = await supabase
    .from("reservations")
    .select(RESERVATION_SELECT)
    .eq("member_number", query)
    .limit(1)
    .maybeSingle();

  if (byMemberNumber.error) {
    throw new Error(`Unable to lookup reservation: ${byMemberNumber.error.message}`);
  }

  return (byMemberNumber.data as ReservationRow | null) ?? null;
}
