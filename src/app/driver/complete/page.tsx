import { driverWorkflows, submissionComplete } from "@/content/portal";
import { Button, Card, DotLottieAnimation } from "@/components/ui";
import { PageShell } from "@/components/layout";
import { requireActiveDriver } from "@/lib/driver-auth";
import styles from "@/components/layout/PageContent.module.css";
import pageStyles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function DriverCompletePage() {
  await requireActiveDriver();

  return (
    <PageShell centerContent width="narrow">
      <Card centered className={pageStyles.successCard}>
        <DotLottieAnimation
          className={pageStyles.successAnimation}
          src="/icons/Tick%20success.lottie"
          label={submissionComplete.title}
        />
        <h2 className={pageStyles.successTitle}>{submissionComplete.title}</h2>
        <p className={styles.bodyCopy}>{submissionComplete.message}</p>
        <p className={pageStyles.successMeta}>{submissionComplete.meta}</p>
      </Card>

      <Card className={pageStyles.nextCard} title={submissionComplete.nextTitle}>
        <div className={pageStyles.actions}>
          <Button href={driverWorkflows.delivery.href}>
            {submissionComplete.actions.delivery}
          </Button>
          <Button href={driverWorkflows.pickup.href}>
            {submissionComplete.actions.pickup}
          </Button>
          <Button href="/driver/dashboard" variant="secondary">
            {submissionComplete.actions.dashboard}
          </Button>
          <Button href="/" variant="secondary">
            {submissionComplete.actions.portal}
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}
