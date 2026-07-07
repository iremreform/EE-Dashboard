import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ReservationRow = Record<string, unknown> & {
  guest_first_name?: string | null;
  guest_last_name?: string | null;
  id: string;
  member_number?: string | null;
  reservation_number?: string | null;
  vehicle_color?: string | null;
  vehicle_make_model?: string | null;
  vehicle_plate?: string | null;
};

type PaymentVerificationRow = {
  is_verified: boolean | null;
  reservation_id: string | null;
  verified_at?: string | null;
};

type ReservationSubmissionRow = {
  public_id: string;
  status: "submitted" | "completed" | "archived" | string | null;
  submission_type: "delivery" | "pickup" | string | null;
  submitted_at: string | null;
};

export type AdminReservationFilters = {
  dateStatus?: "all" | "with_dates" | "missing_dates";
  payment?: "all" | "verified" | "not_verified";
  search?: string;
};

export type AdminReservationListItem = {
  dates: string;
  guest: string;
  href: string;
  id: string;
  meta: string;
  paymentLabel: string;
  paymentVerified: boolean;
  reservationNumber: string;
  vehicle: string;
};

export type AdminReservationDetailView = {
  backLabel: string;
  dates: string;
  guestTitle: string;
  paymentLabel: string;
  paymentVerified: boolean;
  reservationNumber: string;
  sections: Array<{
    fields: Array<[string, string]>;
    title: string;
  }>;
  sourceFields: Array<[string, string]>;
  submissions: Array<{
    href: string;
    meta: string;
    status: string;
    title: string;
  }>;
  title: string;
};

export async function getAdminReservations(filters: AdminReservationFilters = {}) {
  const supabase = createSupabaseAdminClient();
  const [reservationsResult, paymentResult] = await Promise.all([
    supabase
      .from("reservations")
      .select("*")
      .order("reservation_number", { ascending: true }),
    supabase
      .from("payment_verifications")
      .select("reservation_id, is_verified"),
  ]);

  if (reservationsResult.error) {
    throw new Error(`Unable to load reservations: ${reservationsResult.error.message}`);
  }

  if (paymentResult.error) {
    throw new Error(`Unable to load reservation payment status: ${paymentResult.error.message}`);
  }

  const paymentByReservationId = new Map(
    ((paymentResult.data ?? []) as PaymentVerificationRow[]).map((payment) => [
      payment.reservation_id,
      Boolean(payment.is_verified),
    ]),
  );

  return ((reservationsResult.data ?? []) as ReservationRow[])
    .map((reservation) => toListItem(reservation, paymentByReservationId.get(reservation.id) ?? false))
    .filter((reservation) => matchesFilters(reservation, filters));
}

function toListItem(
  reservation: ReservationRow,
  paymentVerified: boolean,
): AdminReservationListItem {
  const guest = fullName({
    first_name: reservation.guest_first_name,
    last_name: reservation.guest_last_name,
  });
  const dates = formatReservationDates(reservation);

  return {
    dates,
    guest: guest || "Guest not set",
    href: `/admin/reservations/${reservation.id}`,
    id: reservation.id,
    meta: [
      getString(reservation.member_number) ? `Phone: ${getString(reservation.member_number)}` : null,
      dates,
    ]
      .filter(Boolean)
      .join(" - "),
    paymentLabel: paymentVerified ? "Payment verified" : "Payment pending",
    paymentVerified,
    reservationNumber: getString(reservation.reservation_number) || "No reservation #",
    vehicle: formatVehicle(reservation),
  };
}

export async function getAdminReservationDetail(id: string) {
  const supabase = createSupabaseAdminClient();
  const [reservationResult, paymentResult, submissionsResult] = await Promise.all([
    supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("payment_verifications")
      .select("reservation_id, is_verified, verified_at")
      .eq("reservation_id", id)
      .maybeSingle(),
    supabase
      .from("submissions")
      .select("public_id, status, submission_type, submitted_at")
      .eq("reservation_id", id)
      .order("submitted_at", { ascending: false }),
  ]);

  if (reservationResult.error) {
    throw new Error(`Unable to load reservation: ${reservationResult.error.message}`);
  }

  if (paymentResult.error) {
    throw new Error(`Unable to load reservation payment status: ${paymentResult.error.message}`);
  }

  if (submissionsResult.error) {
    throw new Error(`Unable to load linked submissions: ${submissionsResult.error.message}`);
  }

  if (!reservationResult.data) {
    return null;
  }

  return toDetailView(
    reservationResult.data as ReservationRow,
    paymentResult.data as PaymentVerificationRow | null,
    (submissionsResult.data ?? []) as ReservationSubmissionRow[],
  );
}

function toDetailView(
  reservation: ReservationRow,
  payment: PaymentVerificationRow | null,
  submissions: ReservationSubmissionRow[],
): AdminReservationDetailView {
  const listItem = toListItem(reservation, Boolean(payment?.is_verified));
  const reservationNumber = getString(reservation.reservation_number) || reservation.id;
  const guest = fullName({
    first_name: reservation.guest_first_name,
    last_name: reservation.guest_last_name,
  });

  return {
    backLabel: "Reservations",
    dates: listItem.dates,
    guestTitle: guest || "Guest not set",
    paymentLabel: listItem.paymentLabel,
    paymentVerified: listItem.paymentVerified,
    reservationNumber,
    sections: [
      {
        title: "Guest information",
        fields: [
          ["Guest first name", getString(reservation.guest_first_name) || "Not set"],
          ["Guest last name", getString(reservation.guest_last_name) || "Not set"],
          ["Phone / member number", getString(reservation.member_number) || "Not set"],
          ["Email", firstValue(reservation, ["guest_email", "email", "customer_email"]) || "Not set"],
        ],
      },
      {
        title: "Reservation details",
        fields: [
          ["Reservation number", getString(reservation.reservation_number) || "Not set"],
          ["Status", firstValue(reservation, ["status", "reservation_status"]) || "Not set"],
          ["Delivery address", firstValue(reservation, ["delivery_address", "dropoff_address", "drop_off_location"]) || "Not set"],
          ["Pickup address", firstValue(reservation, ["pickup_address", "return_address", "pickup_location"]) || "Not set"],
        ],
      },
      {
        title: "Vehicle details",
        fields: [
          ["Make / model", getString(reservation.vehicle_make_model) || "Not set"],
          ["Color", getString(reservation.vehicle_color) || "Not set"],
          ["Plate", getString(reservation.vehicle_plate) || "Not set"],
          ["VIN or fleet ID", firstValue(reservation, ["vin", "fleet_id", "vin_or_fleet_id"]) || "Not set"],
        ],
      },
      {
        title: "Dates",
        fields: [
          ["Delivery", firstDateLabel(reservation, ["delivery_date", "delivery_at", "dropoff_date", "drop_off_date", "start_date", "starts_at"])],
          ["Pickup", firstDateLabel(reservation, ["pickup_date", "pickup_at", "return_date", "end_date", "ends_at"])],
        ],
      },
      {
        title: "Payment",
        fields: [
          ["Payment verified", payment?.is_verified ? "Yes" : "No"],
          ["Verified at", payment?.verified_at ? formatDateTime(payment.verified_at) : "Not set"],
        ],
      },
    ],
    sourceFields: getSourceFields(reservation),
    submissions: submissions.map((submission) => ({
      href: `/admin/submissions/${submission.public_id}`,
      meta: submission.submitted_at ? formatDateTime(submission.submitted_at) : "Submitted date not set",
      status: formatStatus(submission.status),
      title: `${formatSubmissionType(submission.submission_type)} - ${submission.public_id}`,
    })),
    title: `Reservation ${reservationNumber}`,
  };
}

function matchesFilters(row: AdminReservationListItem, filters: AdminReservationFilters) {
  const search = filters.search?.trim().toLowerCase();

  if (search) {
    const haystack = [
      row.reservationNumber,
      row.guest,
      row.meta,
      row.vehicle,
      row.paymentLabel,
    ]
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(search)) {
      return false;
    }
  }

  if (filters.payment === "verified" && !row.paymentVerified) {
    return false;
  }

  if (filters.payment === "not_verified" && row.paymentVerified) {
    return false;
  }

  if (filters.dateStatus === "with_dates" && row.dates === "Dates not set") {
    return false;
  }

  if (filters.dateStatus === "missing_dates" && row.dates !== "Dates not set") {
    return false;
  }

  return true;
}

function formatReservationDates(row: ReservationRow) {
  const deliveryDate = firstDateValue(row, [
    "delivery_date",
    "delivery_at",
    "dropoff_date",
    "drop_off_date",
    "start_date",
    "starts_at",
  ]);
  const pickupDate = firstDateValue(row, [
    "pickup_date",
    "pickup_at",
    "return_date",
    "end_date",
    "ends_at",
  ]);

  if (deliveryDate && pickupDate) {
    return `${formatDate(deliveryDate)} - ${formatDate(pickupDate)}`;
  }

  if (deliveryDate) {
    return `Delivery ${formatDate(deliveryDate)}`;
  }

  if (pickupDate) {
    return `Pickup ${formatDate(pickupDate)}`;
  }

  return "Dates not set";
}

function firstDateValue(row: ReservationRow, keys: string[]) {
  for (const key of keys) {
    const value = getString(row[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function firstDateLabel(row: ReservationRow, keys: string[]) {
  const value = firstDateValue(row, keys);
  return value ? formatDateTime(value) : "Not set";
}

function firstValue(row: ReservationRow, keys: string[]) {
  for (const key of keys) {
    const value = getString(row[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "America/New_York",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "America/New_York",
    year: "numeric",
  }).format(date);
}

function formatVehicle(reservation: ReservationRow) {
  return [
    getString(reservation.vehicle_make_model),
    getString(reservation.vehicle_color),
    getString(reservation.vehicle_plate),
  ]
    .filter(Boolean)
    .join(" - ") || "Vehicle not set";
}

function fullName(person: { first_name?: string | null; last_name?: string | null }) {
  return [person.first_name, person.last_name].filter(Boolean).join(" ");
}

function getSourceFields(reservation: ReservationRow) {
  const sourceFields: Array<[string, string]> = [
    ["Source", firstValue(reservation, ["source", "external_source"]) || "Manual / Supabase"],
    ["External ID", firstValue(reservation, ["external_id", "google_sheet_row_id", "google_event_id"]) || "Not set"],
    ["Last synced", firstDateLabel(reservation, ["last_synced_at", "synced_at", "updated_at"])],
  ];

  return sourceFields;
}

function formatSubmissionType(value: string | null) {
  if (value === "pickup") {
    return "Pickup / Return";
  }

  return "Delivery";
}

function formatStatus(value: string | null) {
  if (!value) {
    return "Submitted";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
