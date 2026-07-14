import { adminPasswordRecovery, areas } from "@/content/portal";
import { Button } from "@/components/ui";
import { PageIntro, PageShell } from "@/components/layout";
import styles from "@/components/layout/PageContent.module.css";
import { verifyAdminRecoveryAction } from "./actions";
import { VerifyRecoveryButton } from "./VerifyRecoveryButton";

type AdminResetPasswordPageProps = {
  searchParams?: Promise<{
    token_hash?: string;
    type?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminResetPasswordPage({
  searchParams,
}: AdminResetPasswordPageProps) {
  const params = await searchParams;
  const tokenHash = params?.token_hash ?? "";
  const recoveryType = params?.type ?? "";
  const hasRecoveryToken = Boolean(tokenHash && recoveryType === "recovery");

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
        lead={
          hasRecoveryToken
            ? adminPasswordRecovery.verifyLead
            : adminPasswordRecovery.errors.invalid
        }
        centered
        headingLevel={2}
      />

      {hasRecoveryToken ? (
        <form action={verifyAdminRecoveryAction}>
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="type" value={recoveryType} />
          <div className={styles.loginActions}>
            <VerifyRecoveryButton />
          </div>
        </form>
      ) : (
        <div className={styles.loginActions}>
          <Button href="/admin/forgot-password" variant="secondary">
            Request a new link
          </Button>
        </div>
      )}
    </PageShell>
  );
}
