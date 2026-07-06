import Link from "next/link";
import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Card, ChoiceCard } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { getAdminAlertSummary, getRecentAdminSubmissions } from "@/lib/admin-submissions";
import styles from "./page.module.css";
import { adminLogoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { admin } = await requireActiveAdmin();
  const dashboard = adminPortal.dashboard;
  const adminName = [admin.first_name, admin.last_name].filter(Boolean).join(" ");
  const [recentSubmissions, alertSummary] = await Promise.all([
    getRecentAdminSubmissions(),
    getAdminAlertSummary(),
  ]);

  return (
    <AdminShell title={dashboard.title} alertSummary={alertSummary} logoutAction={adminLogoutAction}>
      <PageIntro
        tagline={adminPortal.label}
        title={`Hello, ${adminName || "Admin"}`}
        lead={dashboard.lead}
        centered
        headingLevel={2}
        leadSize="large"
      />

      <div className={styles.choiceGrid}>
        <ChoiceCard
          href={dashboard.choices.drivers.href}
          title={dashboard.choices.drivers.title}
          description={dashboard.choices.drivers.description}
          actionLabel={dashboard.choices.drivers.actionLabel}
          variant="panel"
        />

        <ChoiceCard
          href={dashboard.choices.submissions.href}
          title={dashboard.choices.submissions.title}
          description={dashboard.choices.submissions.description}
          actionLabel={dashboard.choices.submissions.actionLabel}
          variant="panel"
        />
      </div>

      <Card title={dashboard.recentTitle} titleVariant="subheading" className={styles.recentCard}>
        {recentSubmissions.length ? (
          <div className={styles.list}>
            {recentSubmissions.map((submission) => (
              <Link key={submission.href} href={submission.href} className={styles.listRow}>
                <div>
                  <strong className={styles.listTitle}>{submission.title}</strong>
                  <p className={styles.listMeta}>{submission.meta}</p>
                </div>
                <span className={styles.rowButton}>
                  {submission.status}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No recent submissions found.</p>
        )}
      </Card>
    </AdminShell>
  );
}
