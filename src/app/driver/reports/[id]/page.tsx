import { notFound } from "next/navigation";
import { areas } from "@/content/portal";
import { Button, Card, Field, Tag, Textarea } from "@/components/ui";
import { PageIntro, PageShell } from "@/components/layout";
import { requireActiveDriver } from "@/lib/driver-auth";
import { getDriverReportDetail } from "@/lib/driver-reports";
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
