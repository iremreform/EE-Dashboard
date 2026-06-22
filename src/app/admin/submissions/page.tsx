import Link from "next/link";
import { adminPortal } from "@/content/portal";
import { AdminShell } from "@/components/admin";
import { Button, Card, Field, Input } from "@/components/ui";
import { PageIntro } from "@/components/layout";
import styles from "../admin-pages.module.css";

export default function AdminSubmissionsPage() {
  const submissions = adminPortal.submissions;

  return (
    <AdminShell title={submissions.title}>
      <PageIntro
        tagline={adminPortal.label}
        title={submissions.title}
        lead={submissions.lead}
        centered
        headingLevel={2}
        leadSize="large"
      />

      <Card title={submissions.filterTitle} titleVariant="subheading" className={styles.filterCard}>
        <div className={styles.filters}>
          {submissions.filters.map(([label, placeholder]) => {
            const id = `submission-filter-${slugify(label)}`;
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
        <div className={styles.actions}>
          <Button href="#" size="small">
            {submissions.applyAction}
          </Button>
          <Button href="#" variant="secondary" size="small">
            {submissions.clearAction}
          </Button>
        </div>
      </Card>

      <Card title={submissions.listTitle} titleVariant="subheading" className={styles.listCard}>
        <div className={styles.list}>
          {submissions.rows.map((submission) => (
            <Link
              key={submission.href}
              href={submission.href}
              className={`${styles.listRow} ${styles.interactiveListRow}`}
            >
              <div>
                <strong className={styles.listTitle}>{submission.title}</strong>
                <p className={styles.listMeta}>{submission.meta}</p>
              </div>
              <span className={styles.rowButton}>
                {submission.status}
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </AdminShell>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
