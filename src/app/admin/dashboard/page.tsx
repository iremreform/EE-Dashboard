import Link from "next/link";
import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Card, ChoiceCard } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import styles from "./page.module.css";

export default function AdminDashboardPage() {
  const dashboard = adminPortal.dashboard;

  return (
    <AdminShell title={dashboard.title}>
      <PageIntro
        tagline={adminPortal.label}
        title={dashboard.greeting}
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
        <div className={styles.list}>
          {dashboard.recentSubmissions.map((submission) => (
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
      </Card>
    </AdminShell>
  );
}
