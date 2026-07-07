"use client";

import type {
  ChangeEvent,
  FormHTMLAttributes,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Card, Checkbox, Field, Input, Select, Textarea } from "@/components/ui";
import { SUPABASE_BUCKETS } from "@/lib/supabase/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "./DriverReportForm.module.css";

type ReportType = "delivery" | "pickup";
type MediaKind = "photo" | "video" | "license";
type FieldTuple = readonly [label: string, placeholder: string];
type UploadTuple = readonly [label: string, meta: string];

type SharedSections = {
  guest: {
    title: string;
    note?: string;
    fields: readonly FieldTuple[];
  };
  vehicle: {
    title: string;
    note?: string;
    fields: readonly FieldTuple[];
  };
  media: {
    title: string;
    uploads: readonly UploadTuple[];
    videoLabel: string;
  };
  signature: {
    title: string;
    confirmation: string;
  };
  driver: {
    title: string;
    confirmation: string;
  };
};

type DeliverySections = SharedSections & {
  verification: {
    title: string;
    uploads: readonly string[];
  };
  payment: {
    title: string;
    label: string;
    placeholder: string;
  };
};

type PickupSections = SharedSections & {
  search: {
    title: string;
    label: string;
    placeholder: string;
    note: string;
  };
  checklist: {
    title: string;
    fields: readonly FieldTuple[];
    toggles: readonly string[];
    notesLabel: string;
    notesPlaceholder: string;
  };
};

type DriverReportFormProps =
  | {
      type: "delivery";
      hasError?: boolean;
      submitLabel: string;
      sections: DeliverySections;
      submitAction?: FormHTMLAttributes<HTMLFormElement>["action"];
    }
  | {
      type: "pickup";
      hasError?: boolean;
      submitLabel: string;
      sections: PickupSections;
      submitAction?: FormHTMLAttributes<HTMLFormElement>["action"];
    };

type ReservationLookupResponse = {
  reservation: {
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
};

type UploadedMediaRef = {
  label: string;
  mediaKind: MediaKind;
  mimeType: string;
  originalName: string;
  path: string;
  sizeBytes: number;
};

type SignedUploadResponse = {
  path: string;
  token: string;
};

export function DriverReportForm({
  hasError = false,
  type,
  submitLabel,
  sections,
  submitAction,
}: DriverReportFormProps) {
  const draftKey = `ee-driver-${type}-form-draft`;
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    readStoredDraft(draftKey, hasError),
  );
  const [lookupMessage, setLookupMessage] = useState("");
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [matchedReservationNumber, setMatchedReservationNumber] = useState(() => {
    const values = readStoredDraft(draftKey, hasError);

    if (type !== "pickup") {
      return "";
    }

    return values[`${type}-guest-reservation-number`] ?? values["pickup-search"] ?? "";
  });
  const [clientError, setClientError] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  const updateFieldValue = (name: string, value: string) => {
    setFieldValues((current) => ({ ...current, [name]: value }));
  };

  useEffect(() => {
    if (!hasError) {
      window.sessionStorage.removeItem(draftKey);
    }
  }, [draftKey, hasError]);

  const saveDraft = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    const draft: Record<string, string> = {};

    for (const [name, value] of formData.entries()) {
      if (
        typeof value !== "string" ||
        name === "uploaded-media" ||
        name.endsWith("-guest-signature")
      ) {
        continue;
      }

      draft[name] = value;
    }

    window.sessionStorage.setItem(draftKey, JSON.stringify(draft));
  };

  const handleSubmit = (form: HTMLFormElement) => {
    const validationError = getValidationError({
      form,
      mediaLabels: getRequiredMediaLabels(type, sections),
      sections,
      type,
    });

    if (validationError) {
      setClientError(validationError);
      window.requestAnimationFrame(() => {
        errorRef.current?.focus({ preventScroll: true });
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return false;
    }

    setClientError("");
    saveDraft(form);
    return true;
  };

  const clearPickupLookup = () => {
    if (type !== "pickup") {
      return;
    }

    setMatchedReservationNumber("");
    setLookupMessage("");
    setFieldValues((current) => {
      const next = { ...current };

      delete next["pickup-search"];

      for (const [label] of sections.guest.fields) {
        delete next[`pickup-guest-${slugify(label)}`];
      }

      for (const [label] of sections.vehicle.fields) {
        delete next[`pickup-vehicle-${slugify(label)}`];
      }

      return next;
    });
  };

  const handleLookup = async () => {
    const reservationQuery = getReservationQuery(type, fieldValues);

    if (!reservationQuery) {
      setLookupMessage("Enter a reservation number first.");
      return;
    }

    setIsLookupLoading(true);
    setLookupMessage("");

    try {
      const response = await fetch(
        `/api/driver/reservations?query=${encodeURIComponent(reservationQuery)}`,
      );

      if (response.status === 404) {
        setLookupMessage("Reservation not found.");
        return;
      }

      if (!response.ok) {
        setLookupMessage("Reservation lookup failed.");
        return;
      }

      const data = (await response.json()) as ReservationLookupResponse;
      setFieldValues((current) => ({
        ...current,
        ...mapReservationToFields(type, data.reservation),
      }));
      setMatchedReservationNumber(data.reservation.reservationNumber);
      setLookupMessage("Reservation found.");
    } catch {
      setLookupMessage("Reservation lookup failed.");
    } finally {
      setIsLookupLoading(false);
    }
  };

  return (
    <form
      action={submitAction}
      className={styles.formStack}
      noValidate
      onSubmit={(event) => {
        if (!handleSubmit(event.currentTarget)) {
          event.preventDefault();
        }
      }}
    >
      {clientError ? (
        <p className={styles.errorNotice} ref={errorRef} role="alert" tabIndex={-1}>
          {clientError}
        </p>
      ) : null}

      {type === "pickup" ? (
        <SearchSection
          canClearLookup={Boolean(matchedReservationNumber)}
          isLookupLoading={isLookupLoading}
          lookupMessage={lookupMessage}
          onClearLookup={clearPickupLookup}
          onFieldChange={updateFieldValue}
          onLookup={handleLookup}
          section={sections.search}
          value={fieldValues["pickup-search"] ?? ""}
        />
      ) : null}

      <FieldsSection
        title={sections.guest.title}
        note={type === "pickup" && !matchedReservationNumber ? undefined : sections.guest.note}
        fields={sections.guest.fields}
        idPrefix={`${type}-guest`}
        lookup={
          type === "delivery"
            ? {
                isLoading: isLookupLoading,
                message: lookupMessage,
                onLookup: handleLookup,
              }
            : undefined
        }
        onFieldChange={updateFieldValue}
        values={fieldValues}
      />

      <FieldsSection
        title={sections.vehicle.title}
        note={type === "pickup" && !matchedReservationNumber ? undefined : sections.vehicle.note}
        fields={sections.vehicle.fields}
        idPrefix={`${type}-vehicle`}
        onFieldChange={updateFieldValue}
        readOnly={type === "pickup"}
        values={fieldValues}
      />

      <MediaSection section={sections.media} />

      {type === "delivery" ? (
        <>
          <VerificationSection section={sections.verification} />
          <PaymentSection
            onFieldChange={updateFieldValue}
            section={sections.payment}
            value={fieldValues["payment-status"] ?? ""}
          />
        </>
      ) : (
        <ChecklistSection
          onFieldChange={updateFieldValue}
          section={sections.checklist}
          values={fieldValues}
        />
      )}

      <SignatureSection
        onFieldChange={updateFieldValue}
        section={sections.signature}
        type={type}
        values={fieldValues}
      />
      <DriverConfirmationSection
        onFieldChange={updateFieldValue}
        section={sections.driver}
        submitAction={submitAction}
        submitLabel={submitLabel}
        type={type}
        values={fieldValues}
      />
    </form>
  );
}

function SearchSection({
  canClearLookup,
  isLookupLoading,
  lookupMessage,
  onClearLookup,
  onFieldChange,
  onLookup,
  section,
  value,
}: {
  canClearLookup: boolean;
  isLookupLoading: boolean;
  lookupMessage: string;
  onClearLookup: () => void;
  onFieldChange: (name: string, value: string) => void;
  onLookup: () => void;
  section: PickupSections["search"];
  value: string;
}) {
  const isLookupError = Boolean(lookupMessage && lookupMessage !== "Reservation found.");

  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <div className={styles.lookupRow}>
        <Field label={section.label} htmlFor="pickup-search">
          {({ describedBy, hasError }) => (
            <Input
              id="pickup-search"
              name="pickup-search"
              placeholder={section.placeholder}
              aria-describedby={describedBy}
              hasError={hasError}
              onChange={(event) => onFieldChange("pickup-search", event.target.value)}
              value={value}
            />
          )}
        </Field>
        <Button
          type="button"
          variant={canClearLookup ? "secondary" : "primary"}
          className={styles.lookupButton}
          disabled={isLookupLoading && !canClearLookup}
          onClick={canClearLookup ? onClearLookup : onLookup}
        >
          {canClearLookup ? "Clear match" : isLookupLoading ? "Looking up..." : "Lookup"}
        </Button>
      </div>
      {lookupMessage ? (
        <p className={`${styles.lookupMessage} ${isLookupError ? styles.lookupMessageError : ""}`}>
          {lookupMessage}
        </p>
      ) : null}
      <p className={`${styles.sectionNote} ${styles.searchNote}`}>{section.note}</p>
    </Card>
  );
}

function FieldsSection({
  title,
  note,
  fields,
  idPrefix,
  lookup,
  onFieldChange,
  readOnly = false,
  values,
}: {
  title: string;
  note?: string;
  fields: readonly FieldTuple[];
  idPrefix: string;
  lookup?: {
    isLoading: boolean;
    message: string;
    onLookup: () => void;
  };
  onFieldChange: (name: string, value: string) => void;
  readOnly?: boolean;
  values: Record<string, string>;
}) {
  return (
    <Card title={title} titleVariant="subheading" surface="transparent">
      {note ? <p className={styles.sectionNote}>{note}</p> : null}
      <div className={styles.gridTwo}>
        {fields.map(([label, placeholder]) => {
          const id = `${idPrefix}-${slugify(label)}`;
          const isLookupField = Boolean(lookup && label.toLowerCase() === "reservation number");

          return (
            <Field key={id} label={label} htmlFor={id}>
              {({ describedBy, hasError }) => (
                <div className={isLookupField ? styles.lookupFieldRow : undefined}>
                  <Input
                    id={id}
                    name={id}
                    placeholder={placeholder}
                    aria-describedby={describedBy}
                    className={readOnly ? styles.readOnlyInput : undefined}
                    hasError={hasError}
                    onChange={(event) => onFieldChange(id, event.target.value)}
                    readOnly={readOnly}
                    value={values[id] ?? ""}
                  />
                  {isLookupField && lookup ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className={styles.lookupButton}
                      disabled={lookup.isLoading}
                      onClick={lookup.onLookup}
                    >
                      {lookup.isLoading ? "Searching" : "Search"}
                    </Button>
                  ) : null}
                </div>
              )}
            </Field>
          );
        })}
      </div>
      {lookup ? (
        <div className={styles.lookupActions}>
          {lookup.message ? <p className={styles.lookupMessage}>{lookup.message}</p> : null}
        </div>
      ) : null}
    </Card>
  );
}

function MediaSection({ section }: { section: SharedSections["media"] }) {
  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <div className={styles.gridThree}>
        {section.uploads.map(([label, meta]) => (
          <UploadTile
            key={`${label}-${meta}`}
            label={label}
            mediaKind="photo"
            accept="image/*"
          />
        ))}
      </div>
      <UploadTile
        label={section.videoLabel}
        mediaKind="video"
        accept="video/*"
        tall
        spaced
      />
    </Card>
  );
}

function VerificationSection({ section }: { section: DeliverySections["verification"] }) {
  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <div className={styles.gridTwo}>
        {section.uploads.map((label) => (
          <UploadTile
            key={label}
            label={label}
            mediaKind="license"
            accept="image/*"
            tall
          />
        ))}
      </div>
    </Card>
  );
}

function PaymentSection({
  onFieldChange,
  section,
  value,
}: {
  onFieldChange: (name: string, value: string) => void;
  section: DeliverySections["payment"];
  value: string;
}) {
  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <Field label={section.label} htmlFor="payment-status">
        {({ describedBy, hasError }) => (
          <Select
            id="payment-status"
            name="payment-status"
            aria-describedby={describedBy}
            hasError={hasError}
            onChange={(event) => onFieldChange("payment-status", event.target.value)}
            value={value}
          >
            <option value="" disabled>
              {section.placeholder}
            </option>
            <option value="Verified">Verified</option>
            <option value="Not verified">Not verified</option>
          </Select>
        )}
      </Field>
    </Card>
  );
}

function ChecklistSection({
  onFieldChange,
  section,
  values,
}: {
  onFieldChange: (name: string, value: string) => void;
  section: PickupSections["checklist"];
  values: Record<string, string>;
}) {
  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <div className={styles.gridTwo}>
        {section.fields.map(([label, placeholder]) => {
          const id = `pickup-checklist-${slugify(label)}`;
          return (
            <Field key={id} label={label} htmlFor={id}>
              {({ describedBy, hasError }) => (
                <Input
                  id={id}
                  name={id}
                  placeholder={placeholder}
                  aria-describedby={describedBy}
                  hasError={hasError}
                  onChange={(event) => onFieldChange(id, event.target.value)}
                  value={values[id] ?? ""}
                />
              )}
            </Field>
          );
        })}
      </div>

      <div className={styles.toggleStack}>
        {section.toggles.map((label) => {
          const name = `pickup-${slugify(label)}`;

          return (
            <YesNoToggle
              key={label}
              label={label}
              name={name}
              onChange={onFieldChange}
              value={values[name] ?? ""}
            />
          );
        })}
      </div>

      <Field label={section.notesLabel} htmlFor="pickup-notes">
        {({ describedBy, hasError }) => (
          <Textarea
            id="pickup-notes"
            name="pickup-notes"
            placeholder={section.notesPlaceholder}
            aria-describedby={describedBy}
            hasError={hasError}
            onChange={(event) => onFieldChange("pickup-notes", event.target.value)}
            value={values["pickup-notes"] ?? ""}
          />
        )}
      </Field>
    </Card>
  );
}

function SignatureSection({
  onFieldChange,
  section,
  type,
  values,
}: {
  onFieldChange: (name: string, value: string) => void;
  section: SharedSections["signature"];
  type: ReportType;
  values: Record<string, string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [signatureValue, setSignatureValue] = useState("");
  const confirmationName = `${type}-guest-confirmation`;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * scale));
      canvas.height = Math.max(1, Math.floor(rect.height * scale));

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.scale(scale, scale);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2;
      context.strokeStyle = "#ffffff";
      setSignatureValue("");
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const point = getCanvasPoint(canvas, event);
    isDrawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context || !isDrawingRef.current) {
      return;
    }

    const point = getCanvasPoint(canvas, event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas || !isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;
    canvas.releasePointerCapture(event.pointerId);
    setSignatureValue(canvas.toDataURL("image/png"));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureValue("");
  };

  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <div className={styles.signaturePad}>
        <canvas
          ref={canvasRef}
          className={styles.signatureCanvas}
          aria-label="Guest signature"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        <input type="hidden" name={`${type}-guest-signature`} value={signatureValue} />
      </div>
      <div className={styles.signatureActions}>
        <Button type="button" variant="secondary" size="small" onClick={clearSignature}>
          Clear signature
        </Button>
        {signatureValue ? <p className={styles.signatureStatus}>Signature captured</p> : null}
      </div>
      <Checkbox
        checked={values[confirmationName] === "on"}
        className={styles.checkboxRow}
        name={confirmationName}
        onChange={(event) =>
          onFieldChange(confirmationName, event.target.checked ? "on" : "")
        }
      >
        {section.confirmation}
      </Checkbox>
    </Card>
  );
}

function DriverConfirmationSection({
  onFieldChange,
  section,
  submitAction,
  submitLabel,
  type,
  values,
}: {
  onFieldChange: (name: string, value: string) => void;
  section: SharedSections["driver"];
  submitAction?: FormHTMLAttributes<HTMLFormElement>["action"];
  submitLabel: string;
  type: ReportType;
  values: Record<string, string>;
}) {
  const confirmationName = `${type}-driver-confirmation`;

  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <Checkbox
        checked={values[confirmationName] === "on"}
        className={styles.checkboxRow}
        name={confirmationName}
        onChange={(event) =>
          onFieldChange(confirmationName, event.target.checked ? "on" : "")
        }
      >
        {section.confirmation}
      </Checkbox>
      <div className={styles.actions}>
        {submitAction ? (
          <ReportSubmitButton label={submitLabel} />
        ) : (
          <Button href="/driver/complete" className={styles.actionButton}>
            {submitLabel}
          </Button>
        )}
        <Button href="/driver/dashboard" variant="secondary" className={styles.actionButton}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

function ReportSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className={styles.actionButton} disabled={pending}>
      {pending ? "Submitting..." : label}
    </Button>
  );
}

function UploadTile({
  label,
  mediaKind,
  accept,
  tall = false,
  spaced = false,
}: {
  label: string;
  mediaKind: MediaKind;
  accept: string;
  tall?: boolean;
  spaced?: boolean;
}) {
  const inputId = useId();
  const [preview, setPreview] = useState<{
    name: string;
    type: string;
    url: string;
  } | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMediaRef | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "uploaded" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const isVideo = accept.startsWith("video");
  const captureLabel = isVideo ? "Record video" : "Take photo";

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview?.url]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPreview(null);
      return;
    }

    setPreview({
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file),
    });
    setUploadedMedia(null);
    setUploadStatus("uploading");
    setUploadError("");

    try {
      const signedUpload = await createSignedUpload(file, mediaKind);
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.storage
        .from(SUPABASE_BUCKETS.submissionMedia)
        .uploadToSignedUrl(signedUpload.path, signedUpload.token, file, {
          contentType: file.type || undefined,
        });

      if (error) {
        throw new Error(error.message);
      }

      setUploadedMedia({
        label,
        mediaKind,
        mimeType: file.type,
        originalName: file.name,
        path: signedUpload.path,
        sizeBytes: file.size,
      });
      setUploadStatus("uploaded");
    } catch {
      setUploadedMedia(null);
      setUploadStatus("error");
      setUploadError("Upload failed. Please try again.");
    }
  };

  const handleRemove = async () => {
    const captureInput = document.getElementById(`${inputId}-capture`) as HTMLInputElement | null;
    const uploadInput = document.getElementById(`${inputId}-upload`) as HTMLInputElement | null;

    if (captureInput) {
      captureInput.value = "";
    }

    if (uploadInput) {
      uploadInput.value = "";
    }

    if (uploadedMedia?.path) {
      await fetch("/api/driver/media", {
        body: JSON.stringify({ path: uploadedMedia.path }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
    }

    setPreview(null);
    setUploadedMedia(null);
    setUploadStatus("idle");
    setUploadError("");
  };

  return (
    <div
      className={[
        styles.uploadTile,
        tall ? styles.uploadTall : "",
        preview ? styles.uploadSelected : "",
        spaced ? styles.uploadSpaced : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        id={`${inputId}-capture`}
        className={styles.fileInput}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleFileChange}
      />
      <input
        id={`${inputId}-upload`}
        className={styles.fileInput}
        type="file"
        accept={accept}
        onChange={handleFileChange}
      />
      {uploadedMedia ? (
        <input
          type="hidden"
          name="uploaded-media"
          value={JSON.stringify(uploadedMedia)}
        />
      ) : null}
      {preview ? (
        <span className={styles.uploadPreviewFrame}>
          {preview.type.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.uploadPreview} src={preview.url} alt="" />
          ) : (
            <video className={styles.uploadPreview} src={preview.url} muted playsInline />
          )}
        </span>
      ) : null}
      <span className={styles.uploadLabel}>{label}</span>
      {preview ? (
        <span className={styles.uploadMeta}>
          {uploadStatus === "uploading" ? "Uploading..." : preview.name}
        </span>
      ) : null}
      {uploadError ? <span className={styles.uploadError}>{uploadError}</span> : null}
      {preview ? (
        <button
          type="button"
          className={styles.uploadRemoveButton}
          disabled={uploadStatus === "uploading"}
          onClick={handleRemove}
        >
          Remove
        </button>
      ) : (
        <>
          <label
            className={styles.uploadDesktopTrigger}
            htmlFor={`${inputId}-upload`}
            aria-label={`Upload ${label}`}
          />
          <span className={styles.uploadActions}>
            <label className={styles.uploadActionPrimary} htmlFor={`${inputId}-capture`}>
              {captureLabel}
            </label>
            <label className={styles.uploadActionSecondary} htmlFor={`${inputId}-upload`}>
              Upload
            </label>
          </span>
        </>
      )}
    </div>
  );
}

function YesNoToggle({
  label,
  name,
  onChange,
  value,
}: {
  label: string;
  name: string;
  onChange: (name: string, value: string) => void;
  value: string;
}) {
  return (
    <fieldset className={styles.toggleGroup}>
      <legend className={styles.toggleLegend}>{label}</legend>
      <div className={styles.toggleOptions}>
        {["Yes", "No"].map((option) => (
          <label key={option} className={styles.toggleOption}>
            <input
              checked={value === option}
              className={styles.radioInput}
              type="radio"
              name={name}
              onChange={() => onChange(name, option)}
              value={option}
            />
            <span className={styles.radioControl} aria-hidden="true" />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getReservationQuery(type: ReportType, values: Record<string, string>) {
  if (type === "pickup") {
    return values["pickup-search"] || values["pickup-guest-reservation-number"] || "";
  }

  return values["delivery-guest-reservation-number"] || "";
}

function mapReservationToFields(
  type: ReportType,
  reservation: ReservationLookupResponse["reservation"],
) {
  const deliveryBaseline = formatMileageFuel(
    reservation.deliveryBaseline?.mileage ?? null,
    reservation.deliveryBaseline?.fuelLevelPercent ?? null,
  );

  return {
    [`${type}-guest-guest-first-name`]: reservation.guestFirstName,
    [`${type}-guest-guest-last-name`]: reservation.guestLastName,
    [`${type}-guest-member-number`]: reservation.memberNumber,
    [`${type}-guest-reservation-number`]: reservation.reservationNumber,
    [`${type}-vehicle-color-plate`]: reservation.vehicleColorPlate,
    [`${type}-vehicle-make-model`]: reservation.vehicleMakeModel,
    ...(type === "delivery"
      ? {
          "payment-status": reservation.paymentVerified ? "Verified" : "Not verified",
        }
      : {
          "pickup-search": reservation.reservationNumber,
          "pickup-vehicle-mileage-at-delivery": deliveryBaseline,
        }),
  };
}

function formatMileageFuel(mileage: number | null, fuelLevel: number | null) {
  return [
    mileage === null ? null : `${new Intl.NumberFormat("en-US").format(mileage)} mi`,
    fuelLevel === null ? null : `${fuelLevel}% fuel`,
  ]
    .filter(Boolean)
    .join(" - ");
}

function readStoredDraft(storageKey: string, restore: boolean) {
  if (!restore || typeof window === "undefined") {
    return {};
  }

  const storedDraft = window.sessionStorage.getItem(storageKey);

  if (!storedDraft) {
    return {};
  }

  try {
    return JSON.parse(storedDraft) as Record<string, string>;
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return {};
  }
}

function getValidationError({
  form,
  mediaLabels,
  sections,
  type,
}: {
  form: HTMLFormElement;
  mediaLabels: string[];
  sections: DeliverySections | PickupSections;
  type: ReportType;
}) {
  const formData = new FormData(form);
  const missingField = getRequiredFieldNames(type, sections).some(
    (name) => !getFormDataValue(formData, name),
  );
  const missingConfirmation =
    formData.get(`${type}-guest-confirmation`) !== "on" ||
    formData.get(`${type}-driver-confirmation`) !== "on";
  const missingSignature = !getFormDataValue(formData, `${type}-guest-signature`);
  const missingMedia = getMissingMediaLabels(formData, mediaLabels).length > 0;

  if (missingField || missingConfirmation || missingSignature || missingMedia) {
    return "Please complete all required fields, photos, signature, and confirmations before submitting.";
  }

  return "";
}

function getRequiredFieldNames(type: ReportType, sections: DeliverySections | PickupSections) {
  const fields = [
    ...sections.guest.fields.map(([label]) => `${type}-guest-${slugify(label)}`),
    ...sections.vehicle.fields.map(([label]) => `${type}-vehicle-${slugify(label)}`),
  ];

  if (type === "delivery") {
    return [...fields, "payment-status"];
  }

  const pickupSections = sections as PickupSections;

  return [
    "pickup-search",
    ...fields,
    ...pickupSections.checklist.fields.map(([label]) => `pickup-checklist-${slugify(label)}`),
    ...pickupSections.checklist.toggles.map((label) => `pickup-${slugify(label)}`),
  ];
}

function getRequiredMediaLabels(type: ReportType, sections: DeliverySections | PickupSections) {
  const optionalLabels = new Set(["Existing damage", "Damage photos"]);
  const labels = [
    ...sections.media.uploads
      .map(([label]) => label)
      .filter((label) => !optionalLabels.has(label)),
    sections.media.videoLabel,
  ];

  if (type === "delivery") {
    labels.push(...(sections as DeliverySections).verification.uploads);
  }

  return labels;
}

function getMissingMediaLabels(formData: FormData, requiredLabels: string[]) {
  const uploadedLabels = new Set<string>();

  formData.getAll("uploaded-media").forEach((value) => {
    if (typeof value !== "string") {
      return;
    }

    try {
      const media = JSON.parse(value) as Partial<UploadedMediaRef>;

      if (media.label) {
        uploadedLabels.add(media.label);
      }
    } catch {
      // Invalid upload metadata should be treated as missing.
    }
  });

  return requiredLabels.filter((label) => !uploadedLabels.has(label));
}

function getFormDataValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  event: ReactPointerEvent<HTMLCanvasElement>,
) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

async function createSignedUpload(file: File, mediaKind: MediaKind) {
  const response = await fetch("/api/driver/media", {
    body: JSON.stringify({
      contentType: file.type,
      fileName: file.name,
      mediaKind,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to create upload URL.");
  }

  return (await response.json()) as SignedUploadResponse;
}
