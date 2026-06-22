import { driverForms, nav } from "@/content/portal";
import { DriverReportForm } from "@/components/driver";
import { PageIntro, PageShell } from "@/components/layout";

export default function DriverPickupPage() {
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
