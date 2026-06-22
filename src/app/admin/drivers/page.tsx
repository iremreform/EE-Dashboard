import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, Field, Input, Tag } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import styles from "../admin-pages.module.css";

export default function AdminDriversPage() {
  const drivers = adminPortal.drivers;

  return (
    <AdminShell title={drivers.title}>
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
        <div className={styles.list}>
          {drivers.rows.map((driver) => (
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
      </Card>
    </AdminShell>
  );
}
