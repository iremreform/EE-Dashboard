import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, Field, Input, Tag } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import { getAdminDrivers } from "@/lib/admin-drivers";
import { getAdminAlertSummary } from "@/lib/admin-submissions";
import styles from "../admin-pages.module.css";

export const dynamic = "force-dynamic";

export default async function AdminDriversPage() {
  const drivers = adminPortal.drivers;
  const [rows, alertSummary] = await Promise.all([
    getAdminDrivers(),
    getAdminAlertSummary(),
  ]);

  return (
    <AdminShell title={drivers.title} alertSummary={alertSummary}>
      <PageIntro
        tagline={adminPortal.label}
        title={drivers.title}
        lead={drivers.lead}
        centered
        headingLevel={2}
        leadSize="large"
      />

      <div className={styles.toolbar}>
        <Field label={drivers.searchLabel} htmlFor="driver-search" className={styles.toolbarField}>
          {({ describedBy, hasError }) => (
            <Input
              id="driver-search"
              name="driver-search"
              placeholder={drivers.searchPlaceholder}
              aria-describedby={describedBy}
              hasError={hasError}
            />
          )}
        </Field>
        <div className={styles.toolbarActions}>
          <Button href="/admin/drivers/new">{drivers.createAction}</Button>
        </div>
      </div>

      <Card title={drivers.accountsTitle} titleVariant="subheading">
        {rows.length ? (
          <div className={styles.list}>
            {rows.map((driver) => (
              <div key={driver.name} className={`${styles.listRow} ${styles.staticListRow}`}>
                <div>
                  <div className={styles.listHeading}>
                    <strong className={`${styles.listTitle} ${styles.driverName}`}>
                      {driver.name}
                    </strong>
                    <Tag active={driver.active}>{driver.status}</Tag>
                  </div>
                  <p className={styles.listMeta}>{driver.meta}</p>
                </div>
                <div className={styles.listActions}>
                  {driver.actions.map((action) => (
                    <Button
                      key={action}
                      href="#"
                      variant="secondary"
                      size="small"
                      className={styles.rowButton}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No drivers found.</p>
        )}
      </Card>
    </AdminShell>
  );
}
