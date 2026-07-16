import { driverForms } from "@/content/portal";

type ReportType = keyof typeof driverForms;
type UploadedMediaSummary = {
  label: string;
  mediaKind: "photo" | "video" | "license";
};

const MAX_FORM_FIELD_LENGTH = 5_000;
const MAX_FORM_FIELDS = 100;
const MAX_SIGNATURE_LENGTH = 1_000_000;

export function formDataToPayload(formData: FormData) {
  const entries = Array.from(formData.entries()).filter(
    ([name, value]) => name !== "uploaded-media" && typeof value === "string",
  ) as Array<[string, string]>;

  if (entries.length > MAX_FORM_FIELDS) {
    throw new Error("The report contains too many fields.");
  }

  for (const [name, value] of entries) {
    const maxLength = name.endsWith("-guest-signature")
      ? MAX_SIGNATURE_LENGTH
      : MAX_FORM_FIELD_LENGTH;

    if (name.length > 120 || value.length > maxLength) {
      throw new Error("A report field exceeds the allowed size.");
    }
  }

  return Object.fromEntries(entries);
}

export function getDriverReportValidationError({
  formData,
  media,
  type,
}: {
  formData: FormData;
  media: UploadedMediaSummary[];
  type: ReportType;
}) {
  const sections = driverForms[type].sections;
  const requiredFields = [
    ...sections.guest.fields.map(([label]) => `${type}-guest-${slugify(label)}`),
    ...sections.vehicle.fields.map(([label]) => `${type}-vehicle-${slugify(label)}`),
    ...(type === "delivery"
      ? ["payment-status"]
      : [
          "pickup-search",
          ...driverForms.pickup.sections.checklist.fields.map(
            ([label]) => `pickup-checklist-${slugify(label)}`,
          ),
          ...driverForms.pickup.sections.checklist.toggles.map(
            (label) => `pickup-${slugify(label)}`,
          ),
        ]),
  ];

  if (requiredFields.some((name) => !getFormValue(formData, name))) {
    return "Please complete all required report fields before submitting.";
  }

  const signature = getFormValue(formData, `${type}-guest-signature`);

  if (
    signature.length < 100
    || signature.length > MAX_SIGNATURE_LENGTH
    || !/^data:image\/png;base64,[a-z0-9+/]+={0,2}$/i.test(signature)
  ) {
    return "Please capture a valid guest signature before submitting.";
  }

  const requiredMedia = [
    ...sections.media.uploads
      .map(([label]) => label)
      .filter((label) => label !== "Existing damage" && label !== "Damage photos")
      .map((label) => ({ label, mediaKind: "photo" as const })),
    { label: sections.media.videoLabel, mediaKind: "video" as const },
    ...(type === "delivery"
      ? driverForms.delivery.sections.verification.uploads.map((label) => ({
          label,
          mediaKind: "license" as const,
        }))
      : []),
  ];

  if (
    requiredMedia.some((required) =>
      !media.some((item) =>
        item.label === required.label && item.mediaKind === required.mediaKind,
      ),
    )
  ) {
    return "Please upload all required photos, video, and verification files before submitting.";
  }

  return "";
}

export function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function parseFuelLevel(value: string) {
  const percentMatch = value.match(/(\d{1,3})\s*%/);
  const candidates = Array.from(value.replace(/,/g, "").matchAll(/\d+(\.\d+)?/g)).map(
    ([match]) => Number(match),
  );
  const fuelLevel = percentMatch
    ? Number(percentMatch[1])
    : candidates.length > 1
      ? candidates[candidates.length - 1]
      : candidates[0];

  if (typeof fuelLevel !== "number") {
    return undefined;
  }

  return fuelLevel >= 0 && fuelLevel <= 100 ? fuelLevel : undefined;
}

export function parseMileage(value: string) {
  const match = value.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : undefined;
}

export function parseYesNo(value: string) {
  if (value === "Yes") {
    return true;
  }

  if (value === "No") {
    return false;
  }

  return null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
