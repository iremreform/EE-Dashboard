import { driverForms, nav } from "@/content/portal";
import { DriverReportForm } from "@/components/driver";
import { PageIntro, PageShell } from "@/components/layout";
import { requireActiveDriver } from "@/lib/driver-auth";

export const dynamic = "force-dynamic";

export default async function DriverPickupPage() {
  await requireActiveDriver();
  const form = driverForms.pickup;

  return (
    <PageShell
      backHref="/driver/dashboard"
      backLabel={nav.dashboard}
      width="wide"
      showFooter={false}
    >
      <PageIntro
        tagline={form.tagline}
        title={form.title}
        headingLevel={2}
        taglineRule
      />

      <DriverReportForm type="pickup" submitLabel={form.submitLabel} sections={form.sections} />
    </PageShell>
  );
}
