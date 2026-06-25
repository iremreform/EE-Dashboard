import { areas, nav, pages, passwordHelp } from "@/content/portal";
import { Button, Card } from "@/components/ui";
import { PageIntro, PageShell } from "@/components/layout";
import styles from "@/components/layout/PageContent.module.css";

export default function DriverForgotPasswordPage() {
  return (
    <PageShell
      backHref="/driver/login"
      backLabel={nav.login}
      centerContent
      width="narrow"
    >
      <PageIntro
        tagline={areas.driver}
        title={pages.passwordHelp}
        centered
      />

      <Card centered className={styles.formCard}>
        <p className={styles.bodyCopy}>
          {passwordHelp.bodyBeforeEmail}{" "}
          <a href={`mailto:${passwordHelp.email}`}>{passwordHelp.email}</a>{" "}
          {passwordHelp.bodyAfterEmail}
        </p>
        <div className={styles.pageActions}>
          <Button href="/driver/login" variant="link" arrow="left">
            Back to {nav.login.toLowerCase()}
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}
