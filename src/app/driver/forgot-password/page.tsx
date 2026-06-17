import { areas, nav, pages } from "@/content/portal";
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
        lead="Contact Energetic Exotics and an administrator will reset your password."
        centered
      />

      <Card centered className={styles.formCard}>
        <p className={styles.bodyCopy}>
          For security, password resets are handled by your administrator. Email{" "}
          <a href="mailto:support@energeticexotics.com">support@energeticexotics.com</a>{" "}
          or contact your fleet manager directly.
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
