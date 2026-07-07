import Link from "next/link";
import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, Field, Input, Select, Tag } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { getAdminDrivers } from "@/lib/admin-drivers";
import type { AdminSubmissionFilters } from "@/lib/admin-submissions";
import { getAdminAlertSummary, getAdminSubmissions } from "@/lib/admin-submissions";
import styles from "../admin-pages.module.css";
import { adminLogoutAction } from "../actions";

export const dynamic = "force-dynamic";

type AdminSubmissionsPageProps = {
  searchParams?: Promise<{
    driver?: string;
    q?: string;
    submitted?: string;
    type?: string;
  }>;
};

export default async function AdminSubmissionsPage({ searchParams }: AdminSubmissionsPageProps) {
  await requireActiveAdmin();
  const params = await searchParams;
  const submissions = adminPortal.submissions;
  const filters: AdminSubmissionFilters = {
    driverId: params?.driver,
    reportType: parseReportType(params?.type),
    search: params?.q,
    submitted: parseSubmittedPreset(params?.submitted),
  };
  const hasActiveFilters = Boolean(
    (filters.driverId && filters.driverId !== "all") ||
      (filters.reportType && filters.reportType !== "all") ||
      (filters.submitted && filters.submitted !== "all") ||
      filters.search?.trim(),
  );
  const filterKey = [
    filters.submitted ?? "all",
    filters.driverId ?? "all",
    filters.reportType ?? "all",
    filters.search ?? "",
  ].join(":");
  const [rows, alertSummary, drivers] = await Promise.all([
    getAdminSubmissions(filters),
    getAdminAlertSummary(),
    getAdminDrivers(),
  ]);

  return (
    <AdminShell
      title={submissions.title}
      alertSummary={alertSummary}
      logoutAction={adminLogoutAction}
    >
      <PageIntro
        tagline={adminPortal.label}
        title={submissions.title}
        lead={submissions.lead}
        centered
        headingLevel={2}
        leadSize="large"
      />

      <Card title={submissions.filterTitle} titleVariant="subheading" className={styles.filterCard}>
        <form
          key={filterKey}
          action="/admin/submissions"
          className={styles.filterForm}
          method="get"
        >
          <div className={styles.filters}>
            <Field label="Submitted" htmlFor="submission-filter-submitted">
              {({ describedBy, hasError }) => (
                <Select
                  id="submission-filter-submitted"
                  name="submitted"
                  defaultValue={filters.submitted ?? "all"}
                  aria-describedby={describedBy}
                  hasError={hasError}
                >
                  <option value="all">All time</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </Select>
              )}
            </Field>

            <Field label="Driver" htmlFor="submission-filter-driver">
              {({ describedBy, hasError }) => (
                <Select
                  id="submission-filter-driver"
                  name="driver"
                  defaultValue={filters.driverId ?? "all"}
                  aria-describedby={describedBy}
                  hasError={hasError}
                >
                  <option value="all">All drivers</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Report type" htmlFor="submission-filter-type">
              {({ describedBy, hasError }) => (
                <Select
                  id="submission-filter-type"
                  name="type"
                  defaultValue={filters.reportType ?? "all"}
                  aria-describedby={describedBy}
                  hasError={hasError}
                >
                  <option value="all">All types</option>
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup / Return</option>
                </Select>
              )}
            </Field>

            <Field label="Search" htmlFor="submission-filter-search">
              {({ describedBy, hasError }) => (
                <Input
                  id="submission-filter-search"
                  name="q"
                  placeholder="Guest, reservation, vehicle..."
                  defaultValue={filters.search ?? ""}
                  aria-describedby={describedBy}
                  hasError={hasError}
                />
              )}
            </Field>
          </div>
          <div className={`${styles.actions} ${styles.filterActions}`}>
            <Button type="submit">
              {submissions.applyAction}
            </Button>
            {hasActiveFilters ? (
              <Button href="/admin/submissions" variant="secondary">
                {submissions.clearAction}
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card
        title={submissions.listTitle}
        titleVariant="subheading"
        className={`${styles.listCard} ${styles.bleedListCard}`}
      >
        {rows.length ? (
          <div className={styles.list}>
            {rows.map((submission) => (
              <Link
                key={submission.href}
                href={submission.href}
                className={`${styles.listRow} ${styles.interactiveListRow}`}
              >
                <div>
                  <strong className={styles.listTitle}>{submission.title}</strong>
                  <p className={styles.listMeta}>{submission.meta}</p>
                </div>
                <Tag className={styles.rowTag}>{submission.status}</Tag>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No submissions found.</p>
        )}
      </Card>
    </AdminShell>
  );
}

function parseReportType(value: string | undefined): AdminSubmissionFilters["reportType"] {
  return value === "delivery" || value === "pickup" ? value : "all";
}

function parseSubmittedPreset(value: string | undefined): AdminSubmissionFilters["submitted"] {
  return value === "24h" || value === "7d" || value === "30d" ? value : "all";
}
