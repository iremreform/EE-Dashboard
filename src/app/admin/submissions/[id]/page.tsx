import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, Tag } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import styles from "../../admin-pages.module.css";

type AdminSubmissionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminSubmissionDetailPage({
  params,
}: AdminSubmissionDetailPageProps) {
  await params;
  const detail = adminPortal.submissionDetail;

  return (
    <AdminShell title={detail.title}>
      <div className={styles.backLink}>
        <Button href="/admin/submissions" variant="link" arrow="left">
          {detail.backLabel}
        </Button>
      </div>

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
        </div>
        <Button href="#" size="small">{detail.downloadAction}</Button>
      </div>

      <div className={styles.formStack}>
        <Card title={detail.summaryTitle} titleVariant="subheading" surface="transparent">
          <div className={styles.detailGrid}>
            {detail.summary.map(([label, value]) => (
              <ReadOnlyField key={label} label={label} value={value} />
            ))}
          </div>
        </Card>

        <Card title={detail.mediaTitle} titleVariant="subheading" surface="transparent">
          <div className={styles.mediaGrid}>
            {detail.media.map((item) => (
              <div key={item} className={styles.mediaThumb}>
                {item}
              </div>
            ))}
          </div>
          <div className={`${styles.mediaThumb} ${styles.mediaVideo}`}>{detail.videoLabel}</div>
        </Card>

        <Card title={detail.verificationTitle} titleVariant="subheading" surface="transparent">
          <div className={styles.gridTwo}>
            {detail.licenses.map((item) => (
              <div key={item} className={styles.mediaThumb}>
                {item}
              </div>
            ))}
          </div>
          <div className={styles.spacedField}>
            <ReadOnlyField label={detail.payment[0]} value={detail.payment[1]} />
          </div>
          <div className={`${styles.signatureBox} ${styles.spacedField}`}>{detail.signature}</div>
        </Card>

        <Card title={detail.notesTitle} titleVariant="subheading" surface="transparent">
          <div className={styles.notesBox}>{detail.notes}</div>
        </Card>
      </div>
    </AdminShell>
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
