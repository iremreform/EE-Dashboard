import "server-only";
import { driverForms } from "@/content/portal";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_BUCKETS } from "@/lib/supabase/constants";

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

export type DriverReportListItem = {
  href: string;
  meta: string;
  status: string;
  title: string;
};

export type DriverReportDetailView = {
  backLabel: string;
  detailSections: Array<{
    fields: Array<[string, string]>;
    title: string;
  }>;
  licenses: DriverReportMediaView[];
  media: DriverReportMediaView[];
  notes: Array<{
    body: string;
    createdAt: string;
  }>;
  publicId: string;
  reservation: string;
  signature: {
    label: string;
    url: string | null;
  };
  status: string;
  summary: Array<[string, string]>;
  title: string;
  type: string;
};

export type DriverReportMediaView = {
  kind: "photo" | "video" | "license" | "signature" | "pdf";
  label: string;
  mimeType: string | null;
  sizeLabel: string | null;
  url: string | null;
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
    .eq("driver_id", driverId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load driver report: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return toDetailView(data as unknown as DriverReportRow, supabase);
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

async function toDetailView(
  row: DriverReportRow,
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<DriverReportDetailView> {
  const reservation = one(row.reservations);
  const notes = [...(row.submission_notes ?? [])].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const reservationNumber = reservation?.reservation_number ?? row.public_id;
  const mediaItems = await Promise.all(
    (row.submission_media ?? []).map((item) => toMediaView(item, supabase)),
  );

  return {
    backLabel: "Reports",
    detailSections: getDetailSections(row, reservation),
    licenses: mediaItems.filter((item) => item.kind === "license"),
    media: mediaItems.filter((item) => item.kind === "photo" || item.kind === "video"),
    notes: notes.map((note) => ({
      body: note.body,
      createdAt: formatDateTime(note.created_at),
    })),
    publicId: row.public_id,
    reservation: `Res #${reservationNumber}`,
    signature: {
      label: "Guest signature",
      url: getSignatureDataUrl(row),
    },
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

function getDetailSections(row: DriverReportRow, reservation: ReservationRow | null) {
  const payload = row.form_payload ?? {};
  const type = row.submission_type;
  const form = driverForms[type];
  const sections: DriverReportDetailView["detailSections"] = [
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

function getSignatureDataUrl(row: DriverReportRow) {
  const key = `${row.submission_type}-guest-signature`;
  const value = row.form_payload?.[key];

  if (typeof value !== "string" || !value.startsWith("data:image/")) {
    return null;
  }

  return value;
}

async function toMediaView(
  item: NonNullable<DriverReportRow["submission_media"]>[number],
  supabase: ReturnType<typeof createSupabaseAdminClient>,
): Promise<DriverReportMediaView> {
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatPaymentStatus(status: DriverReportRow["payment_status"]) {
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
