import { areas, driverWorkflows, nav, pages } from "@/content/portal";
import { ChoiceCard } from "@/components/ui";
import { ChoiceGrid, PageIntro, PageShell } from "@/components/layout";
import { requireActiveDriver } from "@/lib/driver-auth";
import { driverLogoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function DriverDashboardPage() {
  await requireActiveDriver();

  return (
    <PageShell
      backAction={driverLogoutAction}
      backLabel={nav.logout}
      width="default"
      centerContent
    >
      <PageIntro
        tagline={`${areas.driver} Portal`}
        title={pages.driverDashboardGreeting}
        lead={pages.driverDashboardLead}
        centered
        headingLevel={2}
        leadSize="large"
      />

      <ChoiceGrid>
        <ChoiceCard
          href={driverWorkflows.delivery.href}
          title={driverWorkflows.delivery.title}
          description={driverWorkflows.delivery.description}
          actionLabel={driverWorkflows.delivery.actionLabel}
        />

        <ChoiceCard
          href={driverWorkflows.pickup.href}
          title={driverWorkflows.pickup.title}
          description={driverWorkflows.pickup.description}
          actionLabel={driverWorkflows.pickup.actionLabel}
        />
      </ChoiceGrid>
    </PageShell>
  );
}
