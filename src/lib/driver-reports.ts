import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null;
type SubmissionStatus = "submitted" | "completed" | "archived";

type ReservationRow = {
  guest_first_name: string | null;
  guest_last_name: string | null;
  member_number: string | null;
  reservation_number: string | null;
  vehicle_color: string | null;
  vehicle_make_model: string | null;
  vehicle_plate: string | null;
};

type DriverReportRow = {
  form_payload: Record<string, unknown> | null;
  fuel_level_percent: number | null;
  mileage: number | null;
  payment_status: "verified" | "not_verified";
  public_id: string;
  status: SubmissionStatus;
  submitted_at: string;
  submission_type: "delivery" | "pickup";
  reservations: Relation<ReservationRow>;
  submission_notes?: Array<{
    body: string;
    created_at: string;
  }> | null;
};

export type DriverReportListItem = {
  href: string;
  meta: string;
  status: string;
  title: string;
};

export type DriverReportDetailView = {
  backLabel: string;
  notes: Array<{
    body: string;
    createdAt: string;
  }>;
  publicId: string;
  reservation: string;
  status: string;
  summary: Array<[string, string]>;
  title: string;
  type: string;
};

const DRIVER_REPORT_SELECT = `
  form_payload,
  fuel_level_percent,
  mileage,
  payment_status,
  public_id,
  status,
  submitted_at,
  submission_type,
  reservations (
    guest_first_name,
    guest_last_name,
    member_number,
    reservation_number,
    vehicle_color,
    vehicle_make_model,
    vehicle_plate
  )
`;

export async function getDriverReports(driverId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(DRIVER_REPORT_SELECT)
    .eq("driver_id", driverId)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load driver reports: ${error.message}`);
  }

  return (data ?? []).map((row) => toListItem(row as unknown as DriverReportRow));
}

export async function getDriverReportDetail(publicId: string, driverId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(`
      ${DRIVER_REPORT_SELECT},
      submission_notes (
        body,
        created_at
      )
    `)
    .eq("public_id", publicId)
    .eq("driver_id", driverId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load driver report: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return toDetailView(data as unknown as DriverReportRow);
}

function toListItem(row: DriverReportRow): DriverReportListItem {
  const reservation = one(row.reservations);
  const reservationNumber = reservation?.reservation_number ?? row.public_id;
  const reportType = formatSubmissionType(row.submission_type);

  return {
    href: `/driver/reports/${row.public_id}`,
    meta: [
      formatDateTime(row.submitted_at),
      formatVehicle(reservation),
    ].filter(Boolean).join(" - "),
    status: formatStatus(row.status),
    title: `${reportType} - Res #${reservationNumber}`,
  };
}

function toDetailView(row: DriverReportRow): DriverReportDetailView {
  const reservation = one(row.reservations);
  const notes = [...(row.submission_notes ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const reservationNumber = reservation?.reservation_number ?? row.public_id;

  return {
    backLabel: "Reports",
    notes: notes.map((note) => ({
      body: note.body,
      createdAt: formatDateTime(note.created_at),
    })),
    publicId: row.public_id,
    reservation: `Res #${reservationNumber}`,
    status: formatStatus(row.status),
    summary: [
      ["Submitted", formatDateTime(row.submitted_at)],
      ["Guest", fullName({
        first_name: reservation?.guest_first_name,
        last_name: reservation?.guest_last_name,
      })],
      [
        "Member / reservation",
        [reservation?.member_number, reservation?.reservation_number ? `Res #${reservation.reservation_number}` : null]
          .filter(Boolean)
          .join(" - "),
      ],
      ["Vehicle", formatVehicle(reservation)],
      ["Mileage / fuel", getMileageFuelDisplay(row)],
      ["Payment verified", row.payment_status === "verified" ? "Verified" : "Not verified"],
    ],
    title: formatSubmissionType(row.submission_type),
    type: formatSubmissionType(row.submission_type).replace(" / Return", ""),
  };
}

function one<T>(value: Relation<T> | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function fullName(person: { first_name?: string | null; last_name?: string | null } | null | undefined) {
  return [person?.first_name, person?.last_name].filter(Boolean).join(" ");
}

function formatSubmissionType(type: DriverReportRow["submission_type"]) {
  return type === "pickup" ? "Pickup / Return" : "Delivery";
}

function formatStatus(status: SubmissionStatus) {
  const statusMap: Record<SubmissionStatus, string> = {
    archived: "Archived",
    completed: "Completed",
    submitted: "Submitted",
  };

  return statusMap[status];
}

function formatVehicle(reservation: ReservationRow | null) {
  return [
    reservation?.vehicle_make_model,
    reservation?.vehicle_color,
    reservation?.vehicle_plate,
  ]
    .filter(Boolean)
    .join(" - ");
}

function getMileageFuelDisplay(row: DriverReportRow) {
  const payload = row.form_payload ?? {};
  const combinedKeys = [
    `${row.submission_type}-admin-mileage-fuel`,
    `${row.submission_type}-vehicle-mileage-fuel-level`,
  ];

  for (const key of combinedKeys) {
    const value = getPayloadString(payload, key);

    if (value) {
      return value;
    }
  }

  const mileage = getPayloadString(payload, `${row.submission_type}-checklist-mileage`);
  const fuel = getPayloadString(payload, `${row.submission_type}-checklist-fuel-level`);
  const rawValue = [mileage, fuel].filter(Boolean).join(" - ");

  return rawValue || formatMileageFuel(row.mileage, row.fuel_level_percent);
}

function getPayloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function formatMileageFuel(mileage: number | null, fuelLevel: number | null) {
  return [
    mileage === null ? null : `${new Intl.NumberFormat("en-US").format(mileage)} mi`,
    fuelLevel === null ? null : `${fuelLevel}% fuel`,
  ]
    .filter(Boolean)
    .join(" - ");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}
