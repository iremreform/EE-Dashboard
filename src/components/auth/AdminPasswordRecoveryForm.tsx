"use client";

import { FormEvent, useState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";
import { PageIntro, PageShell } from "@/components/layout";
import { adminPasswordRecovery, areas } from "@/content/portal";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import styles from "@/components/layout/PageContent.module.css";

type AdminPasswordRecoveryFormProps = {
  initialError?: string;
};

export function AdminPasswordRecoveryForm({
  initialError,
}: AdminPasswordRecoveryFormProps) {
  const [error, setError] = useState(initialError ?? "");
  const [isPending, setIsPending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    if (!email) {
      setError(adminPasswordRecovery.errors.required);
      return;
    }

    setIsPending(true);

    const resetUrl = new URL("/admin/reset-password", window.location.origin);

    const supabase = createSupabaseBrowserClient();
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl.toString(),
    });

    setIsPending(false);

    if (recoveryError) {
      setError(
        recoveryError.status === 429
          ? adminPasswordRecovery.errors.rateLimit
          : adminPasswordRecovery.errors.unknown,
      );
      return;
    }

    form.reset();
    setIsSent(true);
  }

  return (
    <PageShell
      backHref="/admin/login"
      backLabel="Sign in"
      centerContent
      width="narrow"
    >
      <PageIntro
        tagline={`${areas.admin} Portal`}
        title={adminPasswordRecovery.title}
        lead={adminPasswordRecovery.lead}
        centered
        headingLevel={2}
      />

      <Card centered className={styles.formCard}>
        {isSent ? (
          <div className={styles.formStack}>
            <p className={styles.successNotice} role="status">
              {adminPasswordRecovery.success}
            </p>
            <div className={styles.loginActions}>
              <Button href="/admin/login" variant="link" arrow="left">
                Back to sign in
              </Button>
            </div>
          </div>
        ) : (
          <form className={styles.formStack} onSubmit={handleSubmit} noValidate>
            {error ? (
              <p className={styles.loginError} role="alert">
                {error}
              </p>
            ) : null}

            <Field label="Email" htmlFor="email">
              {({ describedBy, hasError }) => (
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@energeticexotics.com"
                  aria-describedby={describedBy}
                  hasError={hasError}
                  disabled={isPending}
                  required
                />
              )}
            </Field>

            <div className={styles.loginActions}>
              <Button type="submit" disabled={isPending}>
                {isPending ? adminPasswordRecovery.pendingAction : adminPasswordRecovery.action}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </PageShell>
  );
}
