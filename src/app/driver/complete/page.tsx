import { driverWorkflows, submissionComplete } from "@/content/portal";
import { Button, Card, DotLottieAnimation, Field, Textarea } from "@/components/ui";
import { PageShell } from "@/components/layout";
import { requireActiveDriver } from "@/lib/driver-auth";
import styles from "@/components/layout/PageContent.module.css";
import pageStyles from "./page.module.css";
import { driverLogoutAction } from "../actions";
import { addDriverSubmissionNoteAction } from "./actions";

export const dynamic = "force-dynamic";

type DriverCompletePageProps = {
  searchParams?: Promise<{
    noteError?: string;
    noteSaved?: string;
    report?: string;
  }>;
};

export default async function DriverCompletePage({ searchParams }: DriverCompletePageProps) {
  await requireActiveDriver();
  const params = await searchParams;
  const reportId = params?.report ?? "";

  return (
    <PageShell centerContent logoutAction={driverLogoutAction} width="narrow">
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

      {reportId ? (
        <Card className={pageStyles.noteCard} title="Driver note">
          {params?.noteSaved ? (
            <p className={pageStyles.successNotice}>Note added to the submitted report.</p>
          ) : null}
          {params?.noteError ? (
            <p className={pageStyles.errorNotice}>Note could not be added. Please try again.</p>
          ) : null}
          <form action={addDriverSubmissionNoteAction} className={pageStyles.noteForm}>
            <input type="hidden" name="public_id" value={reportId} />
            <Field label="Add note" htmlFor="driver_note">
              {({ describedBy, hasError }) => (
                <Textarea
                  id="driver_note"
                  name="driver_note"
                  placeholder="Add a note about this submission..."
                  aria-describedby={describedBy}
                  hasError={hasError}
                />
              )}
            </Field>
            <Button type="submit" variant="secondary" size="small">
              Add note
            </Button>
          </form>
        </Card>
      ) : null}

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
