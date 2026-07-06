import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, Field, Input, Tag } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { getAdminDriverAuditEvents, getAdminDrivers } from "@/lib/admin-drivers";
import { getAdminAlertSummary } from "@/lib/admin-submissions";
import styles from "../admin-pages.module.css";
import { adminLogoutAction } from "../actions";
import {
  disableDriverAction,
  reenableDriverAction,
  resetDriverPasswordAction,
} from "./actions";
import { PendingDriverActionButton } from "./PendingDriverActionButton";

export const dynamic = "force-dynamic";

type AdminDriversPageProps = {
  searchParams?: Promise<{
    disable?: string;
    error?: string;
    q?: string;
    reset?: string;
    saved?: string;
  }>;
};

export default async function AdminDriversPage({ searchParams }: AdminDriversPageProps) {
  await requireActiveAdmin();
  const notices = await searchParams;
  const drivers = adminPortal.drivers;
  const searchQuery = notices?.q?.trim() ?? "";
  const [rows, alertSummary, auditEvents] = await Promise.all([
    getAdminDrivers(searchQuery),
    getAdminAlertSummary(),
    getAdminDriverAuditEvents(),
  ]);
  const resetDriver = notices?.reset
    ? rows.find((driver) => driver.id === notices.reset)
    : null;
  const disableDriver = notices?.disable
    ? rows.find((driver) => driver.id === notices.disable)
    : null;
  const baseDriversHref = searchQuery
    ? `/admin/drivers?q=${encodeURIComponent(searchQuery)}`
    : "/admin/drivers";

  return (
    <AdminShell title={drivers.title} alertSummary={alertSummary} logoutAction={adminLogoutAction}>
      <PageIntro
        tagline={adminPortal.label}
        title={drivers.title}
        lead={drivers.lead}
        centered
        headingLevel={2}
        leadSize="large"
      />

      <form action="/admin/drivers" className={styles.toolbar}>
        <Field label={drivers.searchLabel} htmlFor="driver-search" className={styles.toolbarField}>
          {({ describedBy, hasError }) => (
            <Input
              id="driver-search"
              name="q"
              placeholder={drivers.searchPlaceholder}
              defaultValue={searchQuery}
              aria-describedby={describedBy}
              hasError={hasError}
            />
          )}
        </Field>
        <div className={styles.toolbarActions}>
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {searchQuery ? (
            <Button href="/admin/drivers" variant="secondary">
              Clear
            </Button>
          ) : null}
          <Button href="/admin/drivers/new">{drivers.createAction}</Button>
        </div>
      </form>

      {notices?.saved ? (
        <p className={styles.successNotice}>{getSavedMessage(notices.saved)}</p>
      ) : null}
      {notices?.error ? (
        <p className={styles.errorNotice}>{notices.error}</p>
      ) : null}

      {resetDriver ? (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-driver-title"
        >
          <a href={baseDriversHref} className={styles.modalBackdrop} aria-label="Cancel reset" />
          <Card
            className={styles.modalCard}
            title={`Reset password for ${resetDriver.name}`}
            titleId="reset-driver-title"
            titleVariant="subheading"
          >
            <form action={resetDriverPasswordAction} className={styles.inlineForm}>
              <input type="hidden" name="driver_id" value={resetDriver.id} />
              <Input
                id="temporary_password"
                name="temporary_password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter temporary password"
                aria-label="New temporary password"
                required
              />
              <div className={styles.actions}>
                <PendingDriverActionButton
                  label="Reset password"
                  pendingLabel="Resetting..."
                />
                <Button href={baseDriversHref} variant="secondary">
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {disableDriver ? (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="disable-driver-title"
        >
          <a href={baseDriversHref} className={styles.modalBackdrop} aria-label="Cancel disable" />
          <Card
            className={styles.modalCard}
            title={`Disable ${disableDriver.name}?`}
            titleId="disable-driver-title"
            titleVariant="subheading"
          >
            <form action={disableDriverAction} className={styles.inlineForm}>
              <input type="hidden" name="driver_id" value={disableDriver.id} />
              <p className={styles.emptyText}>
                This driver will no longer be able to sign in or submit reports until an admin
                re-enables the account.
              </p>
              <div className={styles.actions}>
                <PendingDriverActionButton
                  label="Confirm disable"
                  pendingLabel="Disabling..."
                />
                <Button href={baseDriversHref} variant="secondary">
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      <Card title={drivers.accountsTitle} titleVariant="subheading">
        {rows.length ? (
          <div className={styles.list}>
            {rows.map((driver) => (
              <div key={driver.id} className={`${styles.listRow} ${styles.staticListRow}`}>
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
                  {driver.active ? (
                    <Button
                      href={getDriverActionHref("reset", driver.id, searchQuery)}
                      variant="secondary"
                      size="small"
                      className={styles.rowButton}
                    >
                      Reset password
                    </Button>
                  ) : null}
                  {driver.active ? (
                    <Button
                      href={getDriverActionHref("disable", driver.id, searchQuery)}
                      variant="secondary"
                      size="small"
                      className={styles.rowButton}
                    >
                      Disable
                    </Button>
                  ) : (
                    <form action={reenableDriverAction}>
                      <input type="hidden" name="driver_id" value={driver.id} />
                      <PendingDriverActionButton
                        label="Re-enable"
                        pendingLabel="Re-enabling..."
                        variant="secondary"
                        size="small"
                        className={styles.rowButton}
                      />
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>
            {searchQuery ? "No drivers match your search." : "No drivers found."}
          </p>
        )}
      </Card>

      <Card title="Driver audit history" titleVariant="subheading" className={styles.listCard}>
        {auditEvents.length ? (
          <div className={styles.list}>
            {auditEvents.map((event) => (
              <div key={event.id} className={`${styles.listRow} ${styles.staticListRow}`}>
                <div>
                  <div className={styles.listHeading}>
                    <strong className={styles.listTitle}>{event.action}</strong>
                    <Tag>{event.actor}</Tag>
                  </div>
                  <p className={styles.listMeta}>
                    {event.driver} - {event.meta}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No driver account history recorded yet.</p>
        )}
      </Card>
    </AdminShell>
  );
}

function getSavedMessage(value: string) {
  const messages: Record<string, string> = {
    disabled: "Driver account disabled.",
    "password-reset": "Driver password reset.",
    reenabled: "Driver account re-enabled.",
  };

  return messages[value] ?? "Driver account updated.";
}

function getDriverActionHref(action: "disable" | "reset", driverId: string, searchQuery: string) {
  const params = new URLSearchParams({ [action]: driverId });

  if (searchQuery) {
    params.set("q", searchQuery);
  }

  return `/admin/drivers?${params.toString()}`;
}
