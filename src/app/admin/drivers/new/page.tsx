import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, Field, FormDraftManager, Input, PasswordInput } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { getAdminAlertSummary } from "@/lib/admin-submissions";
import styles from "../../admin-pages.module.css";
import { adminLogoutAction } from "../../actions";
import { PendingDriverActionButton } from "../PendingDriverActionButton";
import { createDriverAction } from "./actions";

type AdminCreateDriverPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminCreateDriverPage({
  searchParams,
}: AdminCreateDriverPageProps) {
  await requireActiveAdmin();
  const createDriver = adminPortal.createDriver;
  const [{ error }, alertSummary] = await Promise.all([
    searchParams ?? Promise.resolve({} as { error?: string }),
    getAdminAlertSummary(),
  ]);

  return (
    <AdminShell
      title={createDriver.title}
      alertSummary={alertSummary}
      logoutAction={adminLogoutAction}
      topbarBackLink={{ href: "/admin/drivers", label: createDriver.backLabel }}
    >
      <Button
        href="/admin/drivers"
        variant="link"
        arrow="left"
        className={styles.mobileBackLink}
      >
        {createDriver.backLabel}
      </Button>

      <div className={styles.pageHeader}>
        <PageIntro
          tagline={adminPortal.label}
          title={createDriver.title}
          headingLevel={2}
          taglineRule
        />
      </div>

      {error ? (
        <p className={styles.errorNotice} role="alert">
          {error}
        </p>
      ) : null}

      <form action={createDriverAction} className={styles.formStack} noValidate>
        <FormDraftManager restore={Boolean(error)} storageKey="ee-admin-create-driver-draft" />
        <Card
          title={createDriver.sections.account.title}
          titleVariant="subheading"
          surface="transparent"
        >
          <div className={styles.gridTwo}>
            {createDriver.sections.account.fields.map(([label, placeholder]) => {
              const id = `driver-${slugify(label)}`;
              return (
                <Field key={id} label={label} htmlFor={id}>
                  {({ describedBy, hasError }) => (
                    <Input
                      id={id}
                      name={id}
                      placeholder={placeholder}
                      aria-describedby={describedBy}
                      hasError={hasError}
                    />
                  )}
                </Field>
              );
            })}
          </div>
        </Card>

        <Card
          title={createDriver.sections.access.title}
          titleVariant="subheading"
          surface="transparent"
        >
          <div className={styles.fieldStack}>
            <Field label={createDriver.sections.access.roleLabel} htmlFor="driver-role">
              {({ describedBy, hasError }) => (
                <Input
                  id="driver-role"
                  name="driver-role"
                  value={createDriver.sections.access.roleValue}
                  aria-describedby={describedBy}
                  hasError={hasError}
                  readOnly
                />
              )}
            </Field>

            <Field label={createDriver.sections.access.passwordLabel} htmlFor="driver-password">
              {({ describedBy, hasError }) => (
                <PasswordInput
                  id="driver-password"
                  name="driver-password"
                  placeholder={createDriver.sections.access.passwordPlaceholder}
                  aria-describedby={describedBy}
                  hasError={hasError}
                />
              )}
            </Field>

          </div>
        </Card>

        <div className={styles.actions}>
          <PendingDriverActionButton
            label={createDriver.saveAction}
            pendingLabel="Saving..."
          />
          <Button href="/admin/drivers" variant="secondary">
            {createDriver.cancelAction}
          </Button>
        </div>
      </form>
    </AdminShell>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
