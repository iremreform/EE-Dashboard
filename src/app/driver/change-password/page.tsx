import { areas } from "@/content/portal";
import { Button, Card, Field, PasswordInput } from "@/components/ui";
import { PageIntro, PageShell } from "@/components/layout";
import { requireActiveDriver } from "@/lib/driver-auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";
import styles from "@/components/layout/PageContent.module.css";
import { driverLogoutAction } from "../actions";
import { changeDriverPasswordAction } from "./actions";
import { ChangePasswordSubmitButton } from "./ChangePasswordSubmitButton";

type DriverChangePasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    required?: string;
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DriverChangePasswordPage({
  searchParams,
}: DriverChangePasswordPageProps) {
  await requireActiveDriver({ allowPasswordChangeRequired: true });
  const notices = await searchParams;

  return (
    <PageShell
      backHref="/driver/dashboard"
      backLabel="Dashboard"
      logoutAction={driverLogoutAction}
      width="narrow"
      centerContent
    >
      <PageIntro
        tagline={`${areas.driver} Portal`}
        title="Change Password"
        lead={notices?.required ? "Create a new password before continuing." : undefined}
        headingLevel={2}
        centered
      />

      <Card className={styles.formCard}>
        <form action={changeDriverPasswordAction} className={styles.formStack} noValidate>
          {notices?.saved ? (
            <p className={styles.successNotice} role="status">
              Password updated.
            </p>
          ) : null}
          {notices?.error ? (
            <p className={styles.loginError} role="alert">
              {notices.error}
            </p>
          ) : null}

          <Field label="Current password" htmlFor="current_password">
            {({ describedBy, hasError }) => (
              <PasswordInput
                id="current_password"
                name="current_password"
                autoComplete="current-password"
                placeholder="Current password"
                aria-describedby={describedBy}
                hasError={hasError}
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
            )}
          </Field>

          <Field label="New password" htmlFor="new_password">
            {({ describedBy, hasError }) => (
              <PasswordInput
                id="new_password"
                name="new_password"
                autoComplete="new-password"
                placeholder="New password"
                aria-describedby={describedBy}
                hasError={hasError}
                minLength={MIN_PASSWORD_LENGTH}
                required
              />
            )}
          </Field>

          <Field label="Confirm new password" htmlFor="confirm_password">
            {({ describedBy, hasError }) => (
              <PasswordInput
                id="confirm_password"
                name="confirm_password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                aria-describedby={describedBy}
                hasError={hasError}
                required
              />
            )}
          </Field>

          <div className={styles.loginActions}>
            <ChangePasswordSubmitButton />
            {notices?.required ? null : (
              <Button href="/driver/dashboard" variant="secondary">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
