import Link from "next/link";
import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, Field, Input, Select, Tag } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import { requireActiveAdmin } from "@/lib/admin-auth";
import {
  type AdminReservationFilters,
  getAdminReservations,
} from "@/lib/admin-reservations";
import { getAdminAlertSummary } from "@/lib/admin-submissions";
import styles from "../admin-pages.module.css";
import { adminLogoutAction } from "../actions";

export const dynamic = "force-dynamic";

type AdminReservationsPageProps = {
  searchParams?: Promise<{
    dates?: string;
    payment?: string;
    q?: string;
  }>;
};

export default async function AdminReservationsPage({
  searchParams,
}: AdminReservationsPageProps) {
  await requireActiveAdmin();
  const params = await searchParams;
  const reservations = adminPortal.reservations;
  const filters: AdminReservationFilters = {
    dateStatus: parseDateStatus(params?.dates),
    payment: parsePaymentFilter(params?.payment),
    search: params?.q,
  };
  const hasActiveFilters = Boolean(
    (filters.dateStatus && filters.dateStatus !== "all") ||
      (filters.payment && filters.payment !== "all") ||
      filters.search?.trim(),
  );
  const filterKey = [
    filters.dateStatus ?? "all",
    filters.payment ?? "all",
    filters.search ?? "",
  ].join(":");
  const [rows, alertSummary] = await Promise.all([
    getAdminReservations(filters),
    getAdminAlertSummary(),
  ]);

  return (
    <AdminShell
      title={reservations.title}
      alertSummary={alertSummary}
      logoutAction={adminLogoutAction}
    >
      <PageIntro
        tagline={adminPortal.label}
        title={reservations.title}
        lead={reservations.lead}
        centered
        headingLevel={2}
        leadSize="large"
      />

      <Card
        title={reservations.filterTitle}
        titleVariant="subheading"
        className={styles.filterCard}
      >
        <form
          key={filterKey}
          action="/admin/reservations"
          className={styles.filterForm}
          method="get"
        >
          <div className={styles.filters}>
            <Field label="Payment" htmlFor="reservation-filter-payment">
              {({ describedBy, hasError }) => (
                <Select
                  id="reservation-filter-payment"
                  name="payment"
                  defaultValue={filters.payment ?? "all"}
                  aria-describedby={describedBy}
                  hasError={hasError}
                >
                  <option value="all">All payments</option>
                  <option value="verified">Payment verified</option>
                  <option value="not_verified">Payment pending</option>
                </Select>
              )}
            </Field>

            <Field label="Dates" htmlFor="reservation-filter-dates">
              {({ describedBy, hasError }) => (
                <Select
                  id="reservation-filter-dates"
                  name="dates"
                  defaultValue={filters.dateStatus ?? "all"}
                  aria-describedby={describedBy}
                  hasError={hasError}
                >
                  <option value="all">All date records</option>
                  <option value="with_dates">With dates</option>
                  <option value="missing_dates">Missing dates</option>
                </Select>
              )}
            </Field>

            <Field label="Search" htmlFor="reservation-filter-search">
              {({ describedBy, hasError }) => (
                <Input
                  id="reservation-filter-search"
                  name="q"
                  placeholder="Guest, reservation, phone, vehicle..."
                  defaultValue={filters.search ?? ""}
                  aria-describedby={describedBy}
                  hasError={hasError}
                />
              )}
            </Field>
          </div>
          <div className={`${styles.actions} ${styles.filterActions}`}>
            <Button type="submit">{reservations.applyAction}</Button>
            {hasActiveFilters ? (
              <Button href="/admin/reservations" variant="secondary">
                {reservations.clearAction}
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card
        title={reservations.listTitle}
        titleVariant="subheading"
        className={`${styles.listCard} ${styles.bleedListCard}`}
      >
        {rows.length ? (
          <div className={styles.list}>
            {rows.map((reservation) => (
              <Link
                key={reservation.id}
                href={reservation.href}
                className={`${styles.listRow} ${styles.interactiveListRow}`}
              >
                <div>
                  <div className={styles.listHeading}>
                    <strong className={styles.listTitle}>
                      {reservation.reservationNumber === "No reservation #"
                        ? reservation.reservationNumber
                        : `Res #${reservation.reservationNumber}`}
                    </strong>
                    <Tag active={reservation.paymentVerified}>{reservation.paymentLabel}</Tag>
                  </div>
                  <p className={styles.listMeta}>
                    {reservation.guest} - {reservation.vehicle}
                  </p>
                </div>
                <span className={styles.rowMeta}>{reservation.dates}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No reservations found.</p>
        )}
      </Card>
    </AdminShell>
  );
}

function parseDateStatus(value: string | undefined): AdminReservationFilters["dateStatus"] {
  return value === "with_dates" || value === "missing_dates" ? value : "all";
}

function parsePaymentFilter(value: string | undefined): AdminReservationFilters["payment"] {
  return value === "verified" || value === "not_verified" ? value : "all";
}
