import { notFound } from "next/navigation";
import { areas } from "@/content/portal";
import { Button, Card, ClickZoomImage, Field, Tag, Textarea } from "@/components/ui";
import { PageIntro, PageShell } from "@/components/layout";
import { requireActiveDriver } from "@/lib/driver-auth";
import {
  type DriverReportMediaView,
  getDriverReportDetail,
} from "@/lib/driver-reports";
import { driverLogoutAction } from "../../actions";
import { addDriverReportNoteAction } from "../actions";
import styles from "../reports.module.css";

type DriverReportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DriverReportDetailPage({
  params,
  searchParams,
}: DriverReportDetailPageProps) {
  const { driver } = await requireActiveDriver();
  const { id } = await params;
  const notices = await searchParams;
  const report = await getDriverReportDetail(id, driver.id);

  if (!report) {
    notFound();
  }

  return (
    <PageShell
      backHref="/driver/reports"
      backLabel={report.backLabel}
      logoutAction={driverLogoutAction}
      width="default"
    >
      <PageIntro
        tagline={`${areas.driver} Portal`}
        title={report.title}
        headingLevel={2}
        taglineRule
      />

      <div className={styles.tagToolbar}>
        <div className={styles.tagGroup}>
          <Tag>{report.type}</Tag>
          <Tag>{report.reservation}</Tag>
          <Tag>{report.status}</Tag>
        </div>
      </div>

      <div className={styles.stack}>
        {notices?.saved ? (
          <p className={styles.successNotice}>Note added to the submitted report.</p>
        ) : null}
        {notices?.error ? (
          <p className={styles.errorNotice}>Note could not be added. Please try again.</p>
        ) : null}

        <Card title="Locked report" titleVariant="subheading" surface="transparent">
          <p className={styles.notice}>Report fields are locked after submission. You can add notes below.</p>
        </Card>

        <Card title="Report summary" titleVariant="subheading" surface="transparent">
          <div className={styles.detailGrid}>
            {report.summary.map(([label, value]) => (
              <ReadOnlyField key={label} label={label} value={value} />
            ))}
          </div>
        </Card>

        {report.detailSections.map((section) => (
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

        <Card title="Uploaded media" titleVariant="subheading" surface="transparent">
          <MediaPreviewGrid items={report.media} emptyText="No photos or videos uploaded." />
        </Card>

        <Card title="Verification & signature" titleVariant="subheading" surface="transparent">
          <MediaPreviewGrid
            items={report.licenses}
            emptyText="No license photos uploaded."
            variant="compact"
          />
          <div className={`${styles.signatureBox} ${styles.spacedField}`}>
            {report.signature.url ? (
              <ClickZoomImage
                className={styles.signatureImage}
                src={report.signature.url}
                alt={report.signature.label}
              />
            ) : (
              report.signature.label
            )}
          </div>
        </Card>

        <Card title="Notes" titleVariant="subheading" surface="transparent">
          {report.notes.length ? (
            <div className={styles.notesList}>
              {report.notes.map((note) => (
                <article className={styles.noteItem} key={`${note.createdAt}-${note.body}`}>
                  <p>{note.body}</p>
                  <time>{note.createdAt}</time>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No notes have been added yet.</p>
          )}
        </Card>

        <Card title="Add note" titleVariant="subheading" surface="transparent">
          <form action={addDriverReportNoteAction} className={styles.noteForm}>
            <input type="hidden" name="public_id" value={report.publicId} />
            <Field label="Note" htmlFor="driver_note">
              {({ describedBy, hasError }) => (
                <Textarea
                  id="driver_note"
                  name="driver_note"
                  placeholder="Add a note about this submitted report..."
                  aria-describedby={describedBy}
                  hasError={hasError}
                />
              )}
            </Field>
            <div className={styles.actions}>
              <Button type="submit">Add note</Button>
            </div>
          </form>
        </Card>
      </div>
    </PageShell>
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

function MediaPreviewGrid({
  emptyText,
  items,
  variant = "default",
}: {
  emptyText: string;
  items: DriverReportMediaView[];
  variant?: "default" | "compact";
}) {
  if (!items.length) {
    return <p className={styles.emptyText}>{emptyText}</p>;
  }

  return (
    <div className={variant === "compact" ? styles.detailGrid : styles.mediaGrid}>
      {items.map((item, index) => (
        <MediaPreviewItem item={item} key={`${item.kind}-${item.label}-${index}`} />
      ))}
    </div>
  );
}

function MediaPreviewItem({ item }: { item: DriverReportMediaView }) {
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
