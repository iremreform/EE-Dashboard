import type { FormHTMLAttributes } from "react";
import { Button, Card, Checkbox, Field, Input, Textarea } from "@/components/ui";
import styles from "./DriverReportForm.module.css";

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
      submitLabel: string;
      sections: DeliverySections;
      submitAction?: FormHTMLAttributes<HTMLFormElement>["action"];
    }
  | {
      type: "pickup";
      submitLabel: string;
      sections: PickupSections;
      submitAction?: FormHTMLAttributes<HTMLFormElement>["action"];
    };

export function DriverReportForm({
  type,
  submitLabel,
  sections,
  submitAction,
}: DriverReportFormProps) {
  return (
    <form action={submitAction} className={styles.formStack} noValidate>
      {type === "pickup" ? <SearchSection section={sections.search} /> : null}

      <FieldsSection
        title={sections.guest.title}
        note={sections.guest.note}
        fields={sections.guest.fields}
        idPrefix={`${type}-guest`}
      />

      <FieldsSection
        title={sections.vehicle.title}
        note={sections.vehicle.note}
        fields={sections.vehicle.fields}
        idPrefix={`${type}-vehicle`}
      />

      <MediaSection section={sections.media} />

      {type === "delivery" ? (
        <>
          <VerificationSection section={sections.verification} />
          <PaymentSection section={sections.payment} />
        </>
      ) : (
        <ChecklistSection section={sections.checklist} />
      )}

      <SignatureSection section={sections.signature} type={type} />
      <DriverConfirmationSection
        section={sections.driver}
        submitAction={submitAction}
        submitLabel={submitLabel}
        type={type}
      />
    </form>
  );
}

function SearchSection({ section }: { section: PickupSections["search"] }) {
  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <Field label={section.label} htmlFor="pickup-search">
        {({ describedBy, hasError }) => (
          <Input
            id="pickup-search"
            name="pickup-search"
            placeholder={section.placeholder}
            aria-describedby={describedBy}
            hasError={hasError}
          />
        )}
      </Field>
      <p className={`${styles.sectionNote} ${styles.searchNote}`}>{section.note}</p>
    </Card>
  );
}

function FieldsSection({
  title,
  note,
  fields,
  idPrefix,
}: {
  title: string;
  note?: string;
  fields: readonly FieldTuple[];
  idPrefix: string;
}) {
  return (
    <Card title={title} titleVariant="subheading" surface="transparent">
      {note ? <p className={styles.sectionNote}>{note}</p> : null}
      <div className={styles.gridTwo}>
        {fields.map(([label, placeholder]) => {
          const id = `${idPrefix}-${slugify(label)}`;
          return (
            <Field key={id} label={label} htmlFor={id}>
              {({ describedBy, hasError }) => (
                <Input
                  id={id}
                  name={id}
                  placeholder={placeholder}
                  aria-describedby={describedBy}
                  hasError={hasError}
                />
              )}
            </Field>
          );
        })}
      </div>
    </Card>
  );
}

function MediaSection({ section }: { section: SharedSections["media"] }) {
  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <div className={styles.gridThree}>
        {section.uploads.map(([label, meta]) => (
          <UploadTile key={`${label}-${meta}`} label={label} meta={meta} accept="image/*" />
        ))}
      </div>
      <UploadTile
        label={section.videoLabel}
        meta="Tap to record or upload"
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
          <UploadTile key={label} label={label} accept="image/*" tall />
        ))}
      </div>
    </Card>
  );
}

function PaymentSection({ section }: { section: DeliverySections["payment"] }) {
  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <Field label={section.label} htmlFor="payment-status">
        {({ describedBy, hasError }) => (
          <Input
            id="payment-status"
            name="payment-status"
            placeholder={section.placeholder}
            aria-describedby={describedBy}
            hasError={hasError}
          />
        )}
      </Field>
    </Card>
  );
}

function ChecklistSection({ section }: { section: PickupSections["checklist"] }) {
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
                />
              )}
            </Field>
          );
        })}
      </div>

      <div className={styles.toggleStack}>
        {section.toggles.map((label) => (
          <YesNoToggle key={label} label={label} name={`pickup-${slugify(label)}`} />
        ))}
      </div>

      <Field label={section.notesLabel} htmlFor="pickup-notes">
        {({ describedBy, hasError }) => (
          <Textarea
            id="pickup-notes"
            name="pickup-notes"
            placeholder={section.notesPlaceholder}
            aria-describedby={describedBy}
            hasError={hasError}
          />
        )}
      </Field>
    </Card>
  );
}

function SignatureSection({
  section,
  type,
}: {
  section: SharedSections["signature"];
  type: "delivery" | "pickup";
}) {
  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <div className={styles.signatureBox}>Digital signature box</div>
      <Checkbox className={styles.checkboxRow} name={`${type}-guest-confirmation`}>
        {section.confirmation}
      </Checkbox>
      <p className={styles.caption}>Date / time stamp - captured automatically on submit</p>
    </Card>
  );
}

function DriverConfirmationSection({
  section,
  submitAction,
  submitLabel,
  type,
}: {
  section: SharedSections["driver"];
  submitAction?: FormHTMLAttributes<HTMLFormElement>["action"];
  submitLabel: string;
  type: "delivery" | "pickup";
}) {
  return (
    <Card title={section.title} titleVariant="subheading" surface="transparent">
      <Checkbox className={styles.checkboxRow} name={`${type}-driver-confirmation`}>
        {section.confirmation}
      </Checkbox>
      <div className={styles.actions}>
        {submitAction ? (
          <Button type="submit" className={styles.actionButton}>
            {submitLabel}
          </Button>
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

function UploadTile({
  label,
  meta = "Tap to upload",
  accept,
  tall = false,
  spaced = false,
}: {
  label: string;
  meta?: string;
  accept: string;
  tall?: boolean;
  spaced?: boolean;
}) {
  return (
    <label
      className={[
        styles.uploadTile,
        tall ? styles.uploadTall : "",
        spaced ? styles.uploadSpaced : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input className={styles.fileInput} type="file" accept={accept} />
      <span className={styles.uploadLabel}>{label}</span>
      <span className={styles.uploadMeta}>{meta}</span>
    </label>
  );
}

function YesNoToggle({ label, name }: { label: string; name: string }) {
  return (
    <fieldset className={styles.toggleGroup}>
      <legend className={styles.toggleLegend}>{label}</legend>
      <div className={styles.toggleOptions}>
        {["Yes", "No"].map((option) => (
          <label key={option} className={styles.toggleOption}>
            <input className={styles.radioInput} type="radio" name={name} value={option} />
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
