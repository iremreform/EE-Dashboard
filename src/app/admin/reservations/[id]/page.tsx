import Link from "next/link";
import { notFound } from "next/navigation";
import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, Tag } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { getAdminReservationDetail } from "@/lib/admin-reservations";
import { getAdminAlertSummary } from "@/lib/admin-submissions";
import styles from "../../admin-pages.module.css";
import { adminLogoutAction } from "../../actions";

type AdminReservationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminReservationDetailPage({
  params,
}: AdminReservationDetailPageProps) {
  await requireActiveAdmin();
  const { id } = await params;
  const [detail, alertSummary] = await Promise.all([
    getAdminReservationDetail(id),
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
      topbarBackLink={{ href: "/admin/reservations", label: detail.backLabel }}
    >
      <Button
        href="/admin/reservations"
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

      <div className={styles.formStack}>
        {detail.sections.map((section) => (
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

        <Card
          title="Linked submissions"
          titleVariant="subheading"
          className={`${styles.listCard} ${styles.bleedListCard} ${styles.linkedListCard}`}
        >
          {detail.submissions.length ? (
            <div className={styles.list}>
              {detail.submissions.map((submission) => (
                <Link
                  key={submission.href}
                  href={submission.href}
                  className={`${styles.listRow} ${styles.interactiveListRow}`}
                >
                  <div>
                    <div className={styles.listHeading}>
                      <strong className={styles.listTitle}>{submission.title}</strong>
                    </div>
                    <p className={styles.listMeta}>{submission.meta}</p>
                  </div>
                  <Tag className={styles.rowTag}>{submission.status}</Tag>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No delivery or pickup reports linked yet.</p>
          )}
        </Card>

        <Card title="Source information" titleVariant="subheading" surface="transparent">
          <div className={styles.detailGrid}>
            {detail.sourceFields.map(([label, value]) => (
              <ReadOnlyField key={label} label={label} value={value} />
            ))}
          </div>
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
