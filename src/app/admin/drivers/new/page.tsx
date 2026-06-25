import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, Checkbox, Field, Input } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import styles from "../../admin-pages.module.css";

export default function AdminCreateDriverPage() {
  const createDriver = adminPortal.createDriver;

  return (
    <AdminShell
      title={createDriver.title}
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

      <form className={styles.formStack} noValidate>
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
                <Input
                  id="driver-password"
                  name="driver-password"
                  type="password"
                  placeholder={createDriver.sections.access.passwordPlaceholder}
                  aria-describedby={describedBy}
                  hasError={hasError}
                />
              )}
            </Field>

            {createDriver.sections.access.options.map((option) => (
              <Checkbox key={option} className={styles.checkboxRow}>
                {option}
              </Checkbox>
            ))}
          </div>
        </Card>

        <div className={styles.actions}>
          <Button href="/admin/drivers">{createDriver.saveAction}</Button>
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
