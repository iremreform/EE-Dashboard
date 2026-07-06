import Link from "next/link";
import { areas } from "@/content/portal";
import { Card, Tag } from "@/components/ui";
import { PageIntro, PageShell } from "@/components/layout";
import { requireActiveDriver } from "@/lib/driver-auth";
import { getDriverReports } from "@/lib/driver-reports";
import { driverLogoutAction } from "../actions";
import styles from "./reports.module.css";

export const dynamic = "force-dynamic";

export default async function DriverReportsPage() {
  const { driver } = await requireActiveDriver();
  const reports = await getDriverReports(driver.id);

  return (
    <PageShell
      backHref="/driver/dashboard"
      backLabel="Dashboard"
      logoutAction={driverLogoutAction}
      width="default"
    >
      <PageIntro
        tagline={`${areas.driver} Portal`}
        title="Submitted Reports"
        lead="View locked reports and add follow-up notes when needed."
        headingLevel={2}
        taglineRule
      />

      <Card title="Reports" titleVariant="subheading" surface="transparent">
        {reports.length ? (
          <div className={styles.list}>
            {reports.map((report) => (
              <Link key={report.href} href={report.href} className={styles.listRow}>
                <div>
                  <strong className={styles.listTitle}>{report.title}</strong>
                  <p className={styles.listMeta}>{report.meta}</p>
                </div>
                <Tag>{report.status}</Tag>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No submitted reports yet.</p>
        )}
      </Card>
    </PageShell>
  );
}
