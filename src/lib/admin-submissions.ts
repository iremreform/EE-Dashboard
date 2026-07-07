import "server-only";
import { driverForms } from "@/content/portal";
import { SUPABASE_BUCKETS } from "@/lib/supabase/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Relation<T> = T | T[] | null;
type SubmissionStatus = "submitted" | "completed" | "archived";
type PaymentStatus = "verified" | "not_verified";
type SubmissionType = "delivery" | "pickup";
type SubmissionDatePreset = "24h" | "7d" | "30d" | "all";

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
  submission_type: SubmissionType;
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

export type AdminSubmissionFilters = {
  driverId?: string;
  reportType?: SubmissionType | "all";
  search?: string;
  submitted?: SubmissionDatePreset;
};

export type AdminSubmissionListItem = {
  href: string;
  meta: string;
  status: string;
  title: string;
};

export type AdminAlertSummary = {
  count: number;
  items: Array<{
    deleteHref: string;
    href: string;
    id: string;
    markUnreadHref: string;
    meta: string;
    status: "open" | "resolved";
    title: string;
  }>;
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
  detailSections: Array<{
    fields: Array<[string, string]>;
    title: string;
  }>;
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

export async function getAdminSubmissions(filters: AdminSubmissionFilters = {}) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("submissions")
    .select(SUBMISSION_SELECT)
    .order("submitted_at", { ascending: false })
    .order("public_id", { ascending: false });

  if (filters.driverId && filters.driverId !== "all") {
    query = query.eq("driver_id", filters.driverId);
  }

  if (filters.reportType && filters.reportType !== "all") {
    query = query.eq("submission_type", filters.reportType);
  }

  const submittedAfter = getSubmittedAfter(filters.submitted);

  if (submittedAfter) {
    query = query.gte("submitted_at", submittedAfter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Unable to load submissions: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => row as unknown as SubmissionRow)
    .filter((row) => matchesSubmissionSearch(row, filters.search))
    .map((row) => toListItem(row, "full"));
}

export async function getRecentAdminSubmissions(limit = 3) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(SUBMISSION_SELECT)
    .order("submitted_at", { ascending: false })
    .order("public_id", { ascending: false })
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
  const [countResult, alertsResult] = await Promise.all([
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("alerts")
      .select(`
        id,
        status,
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
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (countResult.error) {
    throw new Error(`Unable to load alert count: ${countResult.error.message}`);
  }

  if (alertsResult.error) {
    throw new Error(`Unable to load alert summary: ${alertsResult.error.message}`);
  }

  const alerts = (alertsResult.data ?? []) as Array<{
    id: string;
    message: string | null;
    status: "open" | "resolved" | string | null;
    submissions: Relation<
      Pick<SubmissionRow, "public_id" | "submitted_at"> & {
        reservations: Relation<Pick<ReservationRow, "reservation_number" | "vehicle_make_model">>;
        drivers: Relation<DriverRow>;
      }
    >;
    title: string;
      }>;

  return {
    count: countResult.count ?? 0,
    items: alerts.map((alert) => {
      const submission = one(alert.submissions);
      const driver = one(submission?.drivers);
      const submissionHref = submission?.public_id
        ? `/admin/submissions/${submission.public_id}`
        : "/admin/submissions";
      const status = alert.status === "resolved" ? "resolved" : "open";

      return {
        deleteHref: `/admin/alerts/${alert.id}/delete`,
        href: status === "open" ? `/admin/alerts/${alert.id}` : submissionHref,
        id: alert.id,
        markUnreadHref: `/admin/alerts/${alert.id}/mark-unread`,
        meta: [
          fullName(driver),
          submission?.submitted_at ? formatRelativeTime(submission.submitted_at) : null,
        ]
          .filter(Boolean)
          .join(" - "),
        status,
        title: alert.title,
      };
    }),
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

function getSubmittedAfter(preset: SubmissionDatePreset | undefined) {
  if (!preset || preset === "all") {
    return null;
  }

  const hoursByPreset: Record<Exclude<SubmissionDatePreset, "all">, number> = {
    "24h": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
  };
  const date = new Date();
  date.setHours(date.getHours() - hoursByPreset[preset]);

  return date.toISOString();
}

function matchesSubmissionSearch(row: SubmissionRow, search: string | undefined) {
  const term = search?.trim().toLowerCase();

  if (!term) {
    return true;
  }

  const reservation = one(row.reservations);
  const driver = one(row.drivers);
  const searchableText = [
    row.public_id,
    row.submission_type,
    row.status,
    reservation?.reservation_number,
    reservation?.guest_first_name,
    reservation?.guest_last_name,
    reservation?.member_number,
    reservation?.vehicle_make_model,
    reservation?.vehicle_color,
    reservation?.vehicle_plate,
    driver?.first_name,
    driver?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(term);
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
    detailSections: getDetailSections(row, reservation),
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

function getDetailSections(row: SubmissionRow, reservation: ReservationRow | null) {
  const payload = row.form_payload ?? {};
  const type = row.submission_type;
  const form = driverForms[type];
  const sections: AdminSubmissionDetailView["detailSections"] = [
    {
      title: form.sections.guest.title,
      fields: fieldsFromTuples(payload, `${type}-guest`, form.sections.guest.fields, {
        [`${type}-guest-guest-first-name`]: reservation?.guest_first_name,
        [`${type}-guest-guest-last-name`]: reservation?.guest_last_name,
        [`${type}-guest-member-number`]: reservation?.member_number,
        [`${type}-guest-reservation-number`]: reservation?.reservation_number,
      }),
    },
    {
      title: form.sections.vehicle.title,
      fields: fieldsFromTuples(payload, `${type}-vehicle`, form.sections.vehicle.fields, {
        [`${type}-vehicle-color-plate`]: [
          reservation?.vehicle_color,
          reservation?.vehicle_plate,
        ].filter(Boolean).join(" - "),
        [`${type}-vehicle-make-model`]: reservation?.vehicle_make_model,
        [`${type}-vehicle-mileage-fuel-level`]: getMileageFuelDisplay(row),
      }),
    },
  ];

  if (type === "delivery") {
    const deliveryForm = driverForms.delivery;

    sections.push({
      title: deliveryForm.sections.payment.title,
      fields: [
        [
          deliveryForm.sections.payment.label,
          getPayloadString(payload, "payment-status") || formatPaymentStatus(row.payment_status),
        ],
      ],
    });
  } else {
    const pickupForm = driverForms.pickup;

    sections.push({
      title: pickupForm.sections.checklist.title,
      fields: [
        ...fieldsFromTuples(payload, "pickup-checklist", pickupForm.sections.checklist.fields),
        ...pickupForm.sections.checklist.toggles.map((label) => [
          label,
          getPayloadString(payload, `pickup-${slugify(label)}`) || "Not provided",
        ] as [string, string]),
        [
          pickupForm.sections.checklist.notesLabel,
          getPayloadString(payload, "pickup-notes") || "Not provided",
        ],
      ],
    });
  }

  sections.push({
    title: form.sections.driver.title,
    fields: [
      [
        form.sections.signature.title,
        payload[`${type}-guest-confirmation`] === "on" ? "Confirmed" : "Not confirmed",
      ],
      [
        form.sections.driver.title,
        payload[`${type}-driver-confirmation`] === "on" ? "Confirmed" : "Not confirmed",
      ],
    ],
  });

  return sections;
}

function fieldsFromTuples(
  payload: Record<string, unknown>,
  prefix: string,
  fields: readonly (readonly [string, string])[],
  fallbacks: Record<string, string | null | undefined> = {},
) {
  return fields.map(([label]) => {
    const key = `${prefix}-${slugify(label)}`;
    return [label, getPayloadString(payload, key) || fallbacks[key] || "Not provided"] as [
      string,
      string,
    ];
  });
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
