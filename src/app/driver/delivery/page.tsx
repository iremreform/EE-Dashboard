import { driverForms, nav } from "@/content/portal";
import { DriverReportForm } from "@/components/driver";
import { PageIntro, PageShell } from "@/components/layout";
import { requireActiveDriver } from "@/lib/driver-auth";
import styles from "@/components/driver/DriverReportForm.module.css";
import { createDeliverySubmissionAction } from "./actions";

type DriverDeliveryPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DriverDeliveryPage({ searchParams }: DriverDeliveryPageProps) {
  await requireActiveDriver();
  const { error } = await (searchParams ?? Promise.resolve({} as { error?: string }));
  const form = driverForms.delivery;

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

      {error ? (
        <p className={styles.errorNotice} role="alert">
          {error}
        </p>
      ) : null}

      <DriverReportForm
        type="delivery"
        submitAction={createDeliverySubmissionAction}
        submitLabel={form.submitLabel}
        sections={form.sections}
      />
    </PageShell>
  );
}
