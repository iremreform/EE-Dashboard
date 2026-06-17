import { Button, Card, Field, Input } from "@/components/ui";
import { PageIntro, PageShell } from "@/components/layout";
import styles from "@/components/layout/PageContent.module.css";

type LoginFormProps = {
  areaLabel: string;
  title: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitHref: string;
  secureNotice: string;
  helpHref?: string;
  helpLabel?: string;
};

export function LoginForm({
  areaLabel,
  title,
  emailLabel,
  emailPlaceholder,
  submitHref,
  secureNotice,
  helpHref,
  helpLabel,
}: LoginFormProps) {
  return (
    <PageShell backHref="/" centerContent width="narrow">
      <PageIntro tagline={areaLabel} title={title} centered />

      <Card centered className={styles.formCard}>
        <form className={styles.formStack}>
          <Field label={emailLabel} htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder={emailPlaceholder}
              required
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </Field>

          <div className={styles.loginActions}>
            <Button href={submitHref}>{title}</Button>
          </div>

          {helpHref && helpLabel ? (
            <p className={styles.loginFooterLink}>
              <Button href={helpHref} variant="link" arrow="right">
                {helpLabel}
              </Button>
            </p>
          ) : null}
        </form>
      </Card>

      <p className={styles.secureNotice}>{secureNotice}</p>
    </PageShell>
  );
}
