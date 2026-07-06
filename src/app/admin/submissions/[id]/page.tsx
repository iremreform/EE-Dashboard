import { notFound } from "next/navigation";
import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, ClickZoomImage, Field, Input, Select, Tag, Textarea } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import { requireActiveAdmin } from "@/lib/admin-auth";
import {
  type AdminSubmissionMediaView,
  getAdminAlertSummary,
  getAdminSubmissionDetail,
} from "@/lib/admin-submissions";
import styles from "../../admin-pages.module.css";
import { adminLogoutAction } from "../../actions";
import { updateAdminSubmissionAction } from "./actions";

type AdminSubmissionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    edit?: string;
    error?: string;
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminSubmissionDetailPage({
  params,
  searchParams,
}: AdminSubmissionDetailPageProps) {
  await requireActiveAdmin();
  const { id } = await params;
  const notices = await searchParams;
  const [detail, alertSummary] = await Promise.all([
    getAdminSubmissionDetail(id),
    getAdminAlertSummary(),
  ]);

  if (!detail) {
    notFound();
  }

  const isEditing = notices?.edit === "1";

  return (
    <AdminShell
      title={detail.title}
      alertSummary={alertSummary}
      logoutAction={adminLogoutAction}
      topbarBackLink={{ href: "/admin/submissions", label: detail.backLabel }}
    >
      <Button
        href="/admin/submissions"
        variant="link"
        arrow="left"
        className={styles.mobileBackLink}
      >
        {detail.backLabel}
      </Button>

      <PageIntro
        tagline={adminPortal.label}
        title={detail.title}
        headingLevel={2}
        taglineRule
      />

      <div className={styles.tagToolbar}>
        <div className={styles.tagGroup}>
          <Tag>{detail.type}</Tag>
          <Tag>{detail.reservation}</Tag>
          <Tag>{detail.status}</Tag>
        </div>
        <div className={styles.toolbarActions}>
          <Button
            href={isEditing ? `/admin/submissions/${detail.edit.publicId}` : `/admin/submissions/${detail.edit.publicId}?edit=1`}
            variant="secondary"
          >
            {isEditing ? "Cancel edit" : "Edit report"}
          </Button>
          <Button href="#">{detail.downloadAction}</Button>
        </div>
      </div>

      <div className={styles.formStack}>
        {notices?.saved ? (
          <p className={styles.successNotice}>Submission updated.</p>
        ) : null}
        {notices?.error ? (
          <p className={styles.errorNotice}>Submission could not be updated. Please try again.</p>
        ) : null}

        {isEditing ? (
          <Card title="Admin edit" titleVariant="subheading" surface="transparent">
            <form action={updateAdminSubmissionAction} className={styles.editForm}>
              <input type="hidden" name="public_id" value={detail.edit.publicId} />

              <div className={styles.editSection}>
                <h3 className={styles.editSectionTitle}>Report status</h3>
                <div className={styles.gridTwo}>
                  <Field label="Status" htmlFor="status">
                    {({ describedBy, hasError }) => (
                      <Select
                        id="status"
                        name="status"
                        defaultValue={detail.edit.status}
                        aria-describedby={describedBy}
                        hasError={hasError}
                      >
                        <option value="submitted">Submitted</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </Select>
                    )}
                  </Field>

                  <Field label="Payment verified" htmlFor="payment_status">
                    {({ describedBy, hasError }) => (
                      <Select
                        id="payment_status"
                        name="payment_status"
                        defaultValue={detail.edit.paymentStatus}
                        aria-describedby={describedBy}
                        hasError={hasError}
                      >
                        <option value="verified">Verified</option>
                        <option value="not_verified">Not verified</option>
                      </Select>
                    )}
                  </Field>
                </div>
              </div>

              <div className={styles.editSection}>
                <h3 className={styles.editSectionTitle}>Guest & reservation</h3>
                <div className={styles.detailGrid}>
                  <EditInput
                    id="guest_first_name"
                    label="Guest first name"
                    value={detail.edit.guestFirstName}
                  />
                  <EditInput
                    id="guest_last_name"
                    label="Guest last name"
                    value={detail.edit.guestLastName}
                  />
                  <EditInput id="member_number" label="Member / phone" value={detail.edit.memberNumber} />
                  <EditInput
                    id="reservation_number"
                    label="Reservation number"
                    value={detail.edit.reservationNumber}
                  />
                </div>
              </div>

              <div className={styles.editSection}>
                <h3 className={styles.editSectionTitle}>Vehicle details</h3>
                <div className={styles.detailGrid}>
                  <EditInput
                    id="vehicle_make_model"
                    label="Vehicle make / model"
                    value={detail.edit.vehicleMakeModel}
                  />
                  <EditInput id="vehicle_color" label="Vehicle color" value={detail.edit.vehicleColor} />
                  <EditInput id="vehicle_plate" label="Vehicle plate" value={detail.edit.vehiclePlate} />
                  <EditInput
                    id="mileage_fuel"
                    label="Mileage / fuel"
                    value={detail.edit.mileageFuel}
                  />
                </div>
              </div>

              <div className={styles.editSection}>
                <h3 className={styles.editSectionTitle}>Admin note</h3>
                <Field label="Note" htmlFor="admin_note">
                  {({ describedBy, hasError }) => (
                    <Textarea
                      id="admin_note"
                      name="admin_note"
                      placeholder="Add an internal note..."
                      aria-describedby={describedBy}
                      hasError={hasError}
                    />
                  )}
                </Field>
              </div>

              <div className={styles.actions}>
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </Card>
        ) : null}

        <Card title={detail.summaryTitle} titleVariant="subheading" surface="transparent">
          <div className={styles.detailGrid}>
            {detail.summary.map(([label, value]) => (
              <ReadOnlyField key={label} label={label} value={value} />
            ))}
          </div>
        </Card>

        {detail.detailSections.map((section) => (
          <Card
            key={section.title}
            title={section.title}
            titleVariant="subheading"
            surface="transparent"
          >
            <div className={styles.detailGrid}>
              {section.fields.map(([label, value]) => (
                <ReadOnlyField key={label} label={label} value={value} />
              ))}
            </div>
          </Card>
        ))}

        <Card title={detail.mediaTitle} titleVariant="subheading" surface="transparent">
          <MediaPreviewGrid items={detail.media} emptyText="No photos or videos uploaded." />
        </Card>

        <Card title={detail.verificationTitle} titleVariant="subheading" surface="transparent">
          <MediaPreviewGrid
            items={detail.licenses}
            emptyText="No license photos uploaded."
            variant="compact"
          />
          <div className={styles.spacedField}>
            <ReadOnlyField label={detail.payment[0]} value={detail.payment[1]} />
          </div>
          <div className={`${styles.signatureBox} ${styles.spacedField}`}>
            {detail.signature.url ? (
              <ClickZoomImage
                className={styles.signatureImage}
                src={detail.signature.url}
                alt={detail.signature.label}
              />
            ) : (
              detail.signature.label
            )}
          </div>
        </Card>

        <Card title={detail.notesTitle} titleVariant="subheading" surface="transparent">
          {detail.notes.length ? (
            <div className={styles.notesList}>
              {detail.notes.map((note) => (
                <article className={styles.noteItem} key={`${note.createdAt}-${note.body}`}>
                  <p>{note.body}</p>
                  <time>{note.createdAt}</time>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.notesBox}>No additional notes recorded.</div>
          )}
        </Card>

      </div>
    </AdminShell>
  );
}

function EditInput({
  id,
  label,
  value,
  ...props
}: {
  id: string;
  label: string;
  max?: string;
  min?: string;
  type?: string;
  value: string;
}) {
  return (
    <Field label={label} htmlFor={id}>
      {({ describedBy, hasError }) => (
        <Input
          id={id}
          name={id}
          defaultValue={value}
          aria-describedby={describedBy}
          hasError={hasError}
          {...props}
        />
      )}
    </Field>
  );
}

function MediaPreviewGrid({
  emptyText,
  items,
  variant = "default",
}: {
  emptyText: string;
  items: AdminSubmissionMediaView[];
  variant?: "default" | "compact";
}) {
  if (!items.length) {
    return <p className={styles.emptyText}>{emptyText}</p>;
  }

  return (
    <div className={variant === "compact" ? styles.gridTwo : styles.mediaGrid}>
      {items.map((item, index) => (
        <MediaPreviewItem item={item} key={`${item.kind}-${item.label}-${index}`} />
      ))}
    </div>
  );
}

function MediaPreviewItem({ item }: { item: AdminSubmissionMediaView }) {
  const isVideo = item.kind === "video" || item.mimeType?.startsWith("video/");

  return (
    <figure className={styles.mediaPreviewTile}>
      <div className={styles.mediaPreviewFrame}>
        {item.url && isVideo ? (
          <video className={styles.mediaPreview} controls playsInline preload="metadata">
            <source src={item.url} type={item.mimeType ?? undefined} />
          </video>
        ) : null}
        {item.url && !isVideo ? (
          <ClickZoomImage className={styles.mediaPreview} src={item.url} alt={item.label} />
        ) : null}
        {!item.url ? <span className={styles.mediaFallback}>{item.label}</span> : null}
      </div>
      <figcaption className={styles.mediaCaption}>
        <span>{item.label}</span>
        {item.sizeLabel ? <small>{item.sizeLabel}</small> : null}
      </figcaption>
    </figure>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className={styles.readOnlyLabel}>{label}</label>
      <div className={styles.readOnlyField}>{value}</div>
    </div>
  );
}
