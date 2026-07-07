import { areas } from "@/content/portal";
import { Button, Card, Field, PasswordInput } from "@/components/ui";
import { PageIntro, PageShell } from "@/components/layout";
import { requireActiveAdmin } from "@/lib/admin-auth";
import styles from "@/components/layout/PageContent.module.css";
import { changeAdminPasswordAction } from "./actions";
import { ChangePasswordSubmitButton } from "./ChangePasswordSubmitButton";

type AdminChangePasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    required?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminChangePasswordPage({
  searchParams,
}: AdminChangePasswordPageProps) {
  await requireActiveAdmin({ allowPasswordChangeRequired: true });
  const notices = await searchParams;

  return (
    <PageShell backHref="/" centerContent width="narrow">
      <PageIntro
        tagline={areas.admin}
        title="Change Password"
        lead={notices?.required ? "Create a new password before continuing." : undefined}
        centered
        headingLevel={2}
      />

      <Card className={styles.formCard}>
        <form action={changeAdminPasswordAction} className={styles.formStack} noValidate>
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
              <Button href="/admin/dashboard" variant="secondary">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
