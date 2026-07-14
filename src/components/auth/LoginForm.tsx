"use client";

import type { FormEvent } from "react";
import type { FormHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, PasswordInput } from "@/components/ui";
import { PageIntro, PageShell } from "@/components/layout";
import styles from "@/components/layout/PageContent.module.css";

type LoginFormProps = {
  areaLabel: string;
  title: string;
  emailLabel: string;
  emailPlaceholder: string;
  error?: string;
  formAction?: FormHTMLAttributes<HTMLFormElement>["action"];
  submitHref: string;
  helpHref?: string;
  helpLabel?: string;
};

export function LoginForm({
  areaLabel,
  title,
  emailLabel,
  emailPlaceholder,
  error,
  formAction,
  submitHref,
  helpHref,
  helpLabel,
}: LoginFormProps) {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(submitHref);
  }

  return (
    <PageShell backHref="/" centerContent width="narrow">
      <PageIntro tagline={areaLabel} title={title} centered />

      <Card centered className={styles.formCard}>
        <form
          action={formAction}
          className={styles.formStack}
          noValidate
          onSubmit={formAction ? undefined : handleSubmit}
        >
          {error ? (
            <p className={styles.loginError} role="alert">
              {error}
            </p>
          ) : null}

          <Field label={emailLabel} htmlFor="email">
            {({ describedBy, hasError }) => (
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder={emailPlaceholder}
                aria-describedby={describedBy}
                hasError={hasError}
                required
              />
            )}
          </Field>

          <Field label="Password" htmlFor="password">
            {({ describedBy, hasError }) => (
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-describedby={describedBy}
                hasError={hasError}
                required
              />
            )}
          </Field>

          <div className={styles.loginActions}>
            <LoginSubmitButton label={title} />
          </div>

          {helpHref && helpLabel ? (
            <p className={styles.loginFooterLink}>
              <Link href={helpHref} className={styles.loginFooterAnchor}>
                {helpLabel}
              </Link>
            </p>
          ) : null}
        </form>
      </Card>

    </PageShell>
  );
}

function LoginSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Signing in..." : label}
    </Button>
  );
}
