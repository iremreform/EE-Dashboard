import { notFound } from "next/navigation";
import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, Tag } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { getAdminAlertSummary, getAdminSubmissionDetail } from "@/lib/admin-submissions";
import styles from "../../admin-pages.module.css";
import { adminLogoutAction } from "../../actions";

type AdminSubmissionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminSubmissionDetailPage({
  params,
}: AdminSubmissionDetailPageProps) {
  await requireActiveAdmin();
  const { id } = await params;
  const [detail, alertSummary] = await Promise.all([
    getAdminSubmissionDetail(id),
    getAdminAlertSummary(),
  ]);

  if (!detail) {
    notFound();
  }

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
        </div>
        <Button href="#">{detail.downloadAction}</Button>
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
