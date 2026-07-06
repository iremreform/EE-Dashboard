import { areas, driverWorkflows, pages } from "@/content/portal";
import { ChoiceCard } from "@/components/ui";
import { PageIntro, PageShell } from "@/components/layout";
import { requireActiveDriver } from "@/lib/driver-auth";
import { driverLogoutAction } from "../actions";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function DriverDashboardPage() {
  const { driver } = await requireActiveDriver();
  const driverName = [driver.first_name, driver.last_name].filter(Boolean).join(" ");

  return (
    <PageShell
      logoutAction={driverLogoutAction}
      width="default"
      centerContent
    >
      <PageIntro
        tagline={`${areas.driver} Portal`}
        title={`Hello, ${driverName || "Driver"}`}
        lead={pages.driverDashboardLead}
        centered
        headingLevel={2}
        leadSize="large"
      />

      <div className={styles.workflowGrid}>
        <ChoiceCard
          href={driverWorkflows.delivery.href}
          title={driverWorkflows.delivery.title}
          description={driverWorkflows.delivery.description}
          actionLabel={driverWorkflows.delivery.actionLabel}
          variant="panel"
        />

        <ChoiceCard
          href={driverWorkflows.pickup.href}
          title={driverWorkflows.pickup.title}
          description={driverWorkflows.pickup.description}
          actionLabel={driverWorkflows.pickup.actionLabel}
          variant="panel"
        />

        <ChoiceCard
          href={driverWorkflows.reports.href}
          title={driverWorkflows.reports.title}
          description={driverWorkflows.reports.description}
          actionLabel={driverWorkflows.reports.actionLabel}
          variant="panel"
        />
      </div>
    </PageShell>
  );
}
