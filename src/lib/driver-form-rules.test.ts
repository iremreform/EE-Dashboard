import { describe, expect, it } from "vitest";
import { driverForms } from "@/content/portal";
import {
  formDataToPayload,
  getDriverReportValidationError,
  getFormValue,
  parseFuelLevel,
  parseMileage,
  parseYesNo,
} from "@/lib/driver-form-rules";

const validSignature = `data:image/png;base64,${"a".repeat(100)}`;

function createValidDeliveryForm() {
  const formData = new FormData();
  const values: Record<string, string> = {
    "delivery-guest-guest-first-name": "Alex",
    "delivery-guest-guest-last-name": "Turner",
    "delivery-guest-member-number": "555-0100",
    "delivery-guest-reservation-number": "1042",
    "delivery-vehicle-make-model": "Lamborghini Huracan",
    "delivery-vehicle-color-plate": "Black - ABC 1234",
    "delivery-vehicle-vin-or-fleet-id": "ZHWUC1ZD8GLA12345",
    "delivery-vehicle-mileage-fuel-level": "4,210 mi - 85% fuel",
    "delivery-guest-signature": validSignature,
    "payment-status": "Verified",
  };

  for (const [name, value] of Object.entries(values)) {
    formData.set(name, value);
  }

  return formData;
}

function createValidDeliveryMedia() {
  return [
    ...driverForms.delivery.sections.media.uploads
      .filter(([label]) => label !== "Existing damage")
      .map(([label]) => ({ label, mediaKind: "photo" as const })),
    {
      label: driverForms.delivery.sections.media.videoLabel,
      mediaKind: "video" as const,
    },
    ...driverForms.delivery.sections.verification.uploads.map((label) => ({
      label,
      mediaKind: "license" as const,
    })),
  ];
}

describe("driver form parsing", () => {
  it("parses mileage and fuel from a combined value", () => {
    expect(parseMileage("4,210 mi - 85% fuel")).toBe(4_210);
    expect(parseFuelLevel("4,210 mi - 85% fuel")).toBe(85);
  });

  it("rejects invalid fuel values and handles yes/no values", () => {
    expect(parseFuelLevel("150% fuel")).toBeUndefined();
    expect(parseFuelLevel("not recorded")).toBeUndefined();
    expect(parseYesNo("Yes")).toBe(true);
    expect(parseYesNo("No")).toBe(false);
    expect(parseYesNo("Unknown")).toBeNull();
  });

  it("trims string values and omits upload descriptors from the stored payload", () => {
    const formData = new FormData();
    formData.set("guest-name", "  Alex Turner  ");
    formData.set("uploaded-media", "pending/path.jpg");

    expect(getFormValue(formData, "guest-name")).toBe("Alex Turner");
    expect(formDataToPayload(formData)).toEqual({ "guest-name": "  Alex Turner  " });
  });

  it("rejects oversized report fields", () => {
    const formData = new FormData();
    formData.set("notes", "a".repeat(5_001));

    expect(() => formDataToPayload(formData)).toThrow(
      "A report field exceeds the allowed size.",
    );
  });
});

describe("delivery report validation", () => {
  it("accepts a complete report with all required media", () => {
    expect(getDriverReportValidationError({
      formData: createValidDeliveryForm(),
      media: createValidDeliveryMedia(),
      type: "delivery",
    })).toBe("");
  });

  it("reports missing required fields before signature or media errors", () => {
    const formData = createValidDeliveryForm();
    formData.delete("delivery-guest-reservation-number");

    expect(getDriverReportValidationError({
      formData,
      media: [],
      type: "delivery",
    })).toBe("Please complete all required report fields before submitting.");
  });

  it("rejects an invalid signature", () => {
    const formData = createValidDeliveryForm();
    formData.set("delivery-guest-signature", "not-a-signature");

    expect(getDriverReportValidationError({
      formData,
      media: createValidDeliveryMedia(),
      type: "delivery",
    })).toBe("Please capture a valid guest signature before submitting.");
  });

  it("reports missing required media", () => {
    const media = createValidDeliveryMedia().filter(({ label }) => label !== "Front");

    expect(getDriverReportValidationError({
      formData: createValidDeliveryForm(),
      media,
      type: "delivery",
    })).toBe(
      "Please upload all required photos, video, and verification files before submitting.",
    );
  });
});
