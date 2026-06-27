import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null;

type DriverRow = {
  first_name: string | null;
  last_name: string | null;
};

type ReservationRow = {
  reservation_number: string | null;
  guest_first_name: string | null;
  guest_last_name: string | null;
  member_number: string | null;
  vehicle_make_model: string | null;
  vehicle_color: string | null;
  vehicle_plate: string | null;
};

type SubmissionRow = {
  public_id: string;
  submission_type: "delivery" | "pickup";
  status: "submitted" | "completed" | "archived";
  submitted_at: string;
  mileage: number | null;
  fuel_level_percent: number | null;
  payment_status: "verified" | "not_verified";
  reservations: Relation<ReservationRow>;
  drivers: Relation<DriverRow>;
  submission_media?: Array<{
    label: string;
    media_kind: "photo" | "video" | "license" | "signature" | "pdf";
  }> | null;
  submission_notes?: Array<{
    body: string;
    created_at: string;
  }> | null;
};

export type AdminSubmissionListItem = {
  href: string;
  meta: string;
  status: string;
  title: string;
};

export type AdminAlertSummary = {
  count: number;
  item: {
    href: string;
    meta: string;
    title: string;
  } | null;
};

export type AdminSubmissionDetailView = {
  backLabel: string;
  downloadAction: string;
  licenses: string[];
  media: string[];
  mediaTitle: string;
  notes: string;
  notesTitle: string;
  payment: [string, string];
  reservation: string;
  signature: string;
  summary: Array<[string, string]>;
  summaryTitle: string;
  title: string;
  type: string;
  verificationTitle: string;
  videoLabel: string;
};

const SUBMISSION_SELECT = `
  public_id,
  submission_type,
  status,
  submitted_at,
  mileage,
  fuel_level_percent,
  payment_status,
  reservations (
    reservation_number,
    guest_first_name,
    guest_last_name,
    member_number,
    vehicle_make_model,
    vehicle_color,
    vehicle_plate
  ),
  drivers (
    first_name,
    last_name
  )
`;

export async function getAdminSubmissions() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSION_SELECT)
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load submissions: ${error.message}`);
  }

  return (data ?? []).map((row) => toListItem(row as unknown as SubmissionRow, "full"));
}

export async function getRecentAdminSubmissions(limit = 3) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSION_SELECT)
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Unable to load recent submissions: ${error.message}`);
  }

  return (data ?? []).map((row) => toListItem(row as unknown as SubmissionRow, "compact"));
}

export async function getAdminSubmissionDetail(publicId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(`
      ${SUBMISSION_SELECT},
      submission_media (
        label,
        media_kind
      ),
      submission_notes (
        body,
        created_at
      )
    `)
    .eq("public_id", publicId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load submission ${publicId}: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return toDetailView(data as unknown as SubmissionRow);
}

export async function getAdminAlertSummary(): Promise<AdminAlertSummary> {
  const supabase = createSupabaseAdminClient();
  const [countResult, latestResult] = await Promise.all([
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("alerts")
      .select(`
        title,
        message,
        submissions (
          public_id,
          submitted_at,
          reservations (
            reservation_number,
            vehicle_make_model
          ),
          drivers (
            first_name,
            last_name
          )
        )
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (countResult.error) {
    throw new Error(`Unable to load alert count: ${countResult.error.message}`);
  }

  if (latestResult.error) {
    throw new Error(`Unable to load alert summary: ${latestResult.error.message}`);
  }

  const latest = latestResult.data as
    | {
        title: string;
        message: string | null;
        submissions: Relation<
          Pick<SubmissionRow, "public_id" | "submitted_at"> & {
            reservations: Relation<Pick<ReservationRow, "reservation_number" | "vehicle_make_model">>;
            drivers: Relation<DriverRow>;
          }
        >;
      }
    | null;

  const submission = one(latest?.submissions);
  const reservation = one(submission?.reservations);
  const driver = one(submission?.drivers);

  return {
    count: countResult.count ?? 0,
    item: latest
      ? {
          href: submission?.public_id
            ? `/admin/submissions/${submission.public_id}`
            : "/admin/submissions",
          meta: [
            fullName(driver),
            reservation?.reservation_number ? `Res #${reservation.reservation_number}` : null,
            reservation?.vehicle_make_model,
            submission?.submitted_at ? formatRelativeTime(submission.submitted_at) : null,
          ]
            .filter(Boolean)
            .join(" - "),
          title: latest.title,
        }
      : null,
  };
}

function toListItem(row: SubmissionRow, variant: "compact" | "full"): AdminSubmissionListItem {
  const reservation = one(row.reservations);
  const driver = one(row.drivers);
  const guest = fullName({
    first_name: reservation?.guest_first_name,
    last_name: reservation?.guest_last_name,
  });
  const vehicle = formatVehicle(reservation);
  const reportType = formatSubmissionType(row.submission_type);
  const reservationNumber = reservation?.reservation_number ?? row.public_id;
  const status = formatStatus(row.status);
  const time = formatRelativeTime(row.submitted_at);

  return {
    href: `/admin/submissions/${row.public_id}`,
    meta:
      variant === "compact"
        ? [fullName(driver), time].filter(Boolean).join(" - ")
        : [
            fullName(driver),
            guest ? `Guest: ${guest}` : null,
            time,
            vehicle,
          ]
            .filter(Boolean)
            .join(" - "),
    status,
    title: `${reportType} - Res #${reservationNumber}`,
  };
}

function toDetailView(row: SubmissionRow): AdminSubmissionDetailView {
  const reservation = one(row.reservations);
  const driver = one(row.drivers);
  const media = row.submission_media ?? [];
  const photos = media
    .filter((item) => item.media_kind === "photo")
    .map((item) => item.label);
  const licenses = media
    .filter((item) => item.media_kind === "license")
    .map((item) => item.label);
  const video = media.find((item) => item.media_kind === "video");
  const latestNote = [...(row.submission_notes ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0];

  return {
    backLabel: "Submissions",
    downloadAction: "Download PDF",
    licenses: licenses.length ? licenses : ["License front", "License back"],
    media: photos.length ? photos : ["Front", "Rear", "Interior", "Odometer"],
    mediaTitle: "Uploaded media",
    notes: latestNote?.body ?? "No additional notes recorded.",
    notesTitle: "Notes",
    payment: ["Payment verified status", formatPaymentStatus(row.payment_status)],
    reservation: `Res #${reservation?.reservation_number ?? row.public_id}`,
    signature: "Guest signature",
    summary: [
      ["Driver", fullName(driver) || "Unassigned"],
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
      ["Mileage / fuel", formatMileageFuel(row.mileage, row.fuel_level_percent)],
    ],
    summaryTitle: "Report summary",
    title: "Submission Detail",
    type: formatSubmissionType(row.submission_type).replace(" / Return", ""),
    verificationTitle: "Verification & signature",
    videoLabel: video?.label ?? "Walkaround video",
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

function formatSubmissionType(type: SubmissionRow["submission_type"]) {
  return type === "pickup" ? "Pickup / Return" : "Delivery";
}

function formatStatus(status: SubmissionRow["status"]) {
  const statusMap: Record<SubmissionRow["status"], string> = {
    archived: "Archived",
    completed: "Completed",
    submitted: "Open",
  };

  return statusMap[status];
}

function formatPaymentStatus(status: SubmissionRow["payment_status"]) {
  return status === "verified" ? "Verified" : "Not verified";
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

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const today = dateKey(now);
  const submittedDay = dateKey(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(date);

  if (submittedDay === today) {
    return `Today ${time}`;
  }

  if (submittedDay === dateKey(yesterday)) {
    return `Yesterday ${time}`;
  }

  return formatDateTime(value);
}

function dateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).format(value);
}
