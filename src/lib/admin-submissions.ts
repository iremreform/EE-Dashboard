import "server-only";
import { SUPABASE_BUCKETS } from "@/lib/supabase/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null;
type SubmissionStatus = "submitted" | "completed" | "archived";
type PaymentStatus = "verified" | "not_verified";

type DriverRow = {
  first_name: string | null;
  last_name: string | null;
};

type ReservationRow = {
  id: string;
  reservation_number: string | null;
  guest_first_name: string | null;
  guest_last_name: string | null;
  member_number: string | null;
  vehicle_make_model: string | null;
  vehicle_color: string | null;
  vehicle_plate: string | null;
};

type SubmissionRow = {
  form_payload: Record<string, unknown> | null;
  public_id: string;
  submission_type: "delivery" | "pickup";
  status: SubmissionStatus;
  submitted_at: string;
  mileage: number | null;
  fuel_level_percent: number | null;
  payment_status: PaymentStatus;
  reservations: Relation<ReservationRow>;
  drivers: Relation<DriverRow>;
  submission_media?: Array<{
    label: string;
    media_kind: "photo" | "video" | "license" | "signature" | "pdf";
    mime_type: string | null;
    size_bytes: number | null;
    storage_bucket: string | null;
    storage_path: string | null;
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

export type AdminSubmissionMediaView = {
  kind: "photo" | "video" | "license" | "signature" | "pdf";
  label: string;
  mimeType: string | null;
  sizeLabel: string | null;
  url: string | null;
};

export type AdminSubmissionDetailView = {
  backLabel: string;
  downloadAction: string;
  edit: {
    guestFirstName: string;
    guestLastName: string;
    memberNumber: string;
    mileageFuel: string;
    paymentStatus: PaymentStatus;
    publicId: string;
    reservationNumber: string;
    status: SubmissionStatus;
    vehicleColor: string;
    vehicleMakeModel: string;
    vehiclePlate: string;
  };
  licenses: AdminSubmissionMediaView[];
  media: AdminSubmissionMediaView[];
  mediaTitle: string;
  notes: Array<{
    body: string;
    createdAt: string;
  }>;
  notesTitle: string;
  payment: [string, string];
  reservation: string;
  signature: {
    label: string;
    url: string | null;
  };
  summary: Array<[string, string]>;
  summaryTitle: string;
  title: string;
  type: string;
  status: string;
  verificationTitle: string;
};

const SUBMISSION_SELECT = `
  form_payload,
  public_id,
  submission_type,
  status,
  submitted_at,
  mileage,
  fuel_level_percent,
  payment_status,
  reservations (
    id,
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
        media_kind,
        mime_type,
        size_bytes,
        storage_bucket,
        storage_path
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

  return toDetailView(data as unknown as SubmissionRow, supabase);
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

async function toDetailView(
  row: SubmissionRow,
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<AdminSubmissionDetailView> {
  const reservation = one(row.reservations);
  const driver = one(row.drivers);
  const mediaItems = await Promise.all(
    (row.submission_media ?? []).map((item) => toMediaView(item, supabase)),
  );
  const media = mediaItems.filter((item) => item.kind === "photo" || item.kind === "video");
  const licenses = mediaItems.filter((item) => item.kind === "license");
  const notes = [...(row.submission_notes ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );

  return {
    backLabel: "Submissions",
    downloadAction: "Download PDF",
    edit: {
      guestFirstName: reservation?.guest_first_name ?? "",
      guestLastName: reservation?.guest_last_name ?? "",
      memberNumber: reservation?.member_number ?? "",
      mileageFuel: getMileageFuelDisplay(row),
      paymentStatus: row.payment_status,
      publicId: row.public_id,
      reservationNumber: reservation?.reservation_number ?? "",
      status: row.status,
      vehicleColor: reservation?.vehicle_color ?? "",
      vehicleMakeModel: reservation?.vehicle_make_model ?? "",
      vehiclePlate: reservation?.vehicle_plate ?? "",
    },
    licenses,
    media,
    mediaTitle: "Uploaded media",
    notes: notes.map((note) => ({
      body: note.body,
      createdAt: formatDateTime(note.created_at),
    })),
    notesTitle: "Notes",
    payment: ["Payment verified status", formatPaymentStatus(row.payment_status)],
    reservation: `Res #${reservation?.reservation_number ?? row.public_id}`,
    signature: {
      label: "Guest signature",
      url: getSignatureDataUrl(row),
    },
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
      ["Mileage / fuel", getMileageFuelDisplay(row)],
    ],
    summaryTitle: "Report summary",
    title: "Submission Detail",
    type: formatSubmissionType(row.submission_type).replace(" / Return", ""),
    status: formatStatus(row.status),
    verificationTitle: "Verification & signature",
  };
}

function getSignatureDataUrl(row: SubmissionRow) {
  const key = `${row.submission_type}-guest-signature`;
  const value = row.form_payload?.[key];

  if (typeof value !== "string" || !value.startsWith("data:image/")) {
    return null;
  }

  return value;
}

function getMileageFuelDisplay(row: SubmissionRow) {
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

async function toMediaView(
  item: NonNullable<SubmissionRow["submission_media"]>[number],
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<AdminSubmissionMediaView> {
  const bucket = item.storage_bucket || SUPABASE_BUCKETS.submissionMedia;
  const url = item.storage_path
    ? await createSignedMediaUrl({ bucket, path: item.storage_path, supabase })
    : null;

  return {
    kind: item.media_kind,
    label: item.label,
    mimeType: item.mime_type,
    sizeLabel: formatFileSize(item.size_bytes),
    url,
  };
}

async function createSignedMediaUrl({
  bucket,
  path,
  supabase,
}: {
  bucket: string;
  path: string;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
}) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
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

function formatStatus(status: SubmissionStatus) {
  const statusMap: Record<SubmissionStatus, string> = {
    archived: "Archived",
    completed: "Completed",
    submitted: "Submitted",
  };

  return statusMap[status];
}

function formatPaymentStatus(status: PaymentStatus) {
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

function formatFileSize(sizeBytes: number | null) {
  if (!sizeBytes) {
    return null;
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const isMegabyte = sizeBytes >= 1024 * 1024;
  const divisor = isMegabyte ? 1024 * 1024 : 1024;

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: isMegabyte ? 1 : 0,
  }).format(sizeBytes / divisor).concat(isMegabyte ? " MB" : " KB");
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
