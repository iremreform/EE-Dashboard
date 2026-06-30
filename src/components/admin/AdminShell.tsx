"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FormHTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";
import { adminPortal } from "@/content/portal";
import type { AdminAlertSummary } from "@/lib/admin-submissions";
import { cn } from "@/lib/cn";
import { ArrowIcon, Logo } from "@/components/ui";
import styles from "./AdminShell.module.css";

type AdminShellProps = {
  alertSummary?: AdminAlertSummary;
  logoutAction?: FormHTMLAttributes<HTMLFormElement>["action"];
  title: string;
  topbarBackLink?: {
    href: string;
    label: string;
  };
  children: ReactNode;
};

export function AdminShell({
  alertSummary,
  logoutAction,
  title,
  topbarBackLink,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const dashboardAlert = alertSummary?.item ?? adminPortal.dashboard.notification;
  const alertCount = alertSummary?.count ?? adminPortal.alertCount;

  useEffect(() => {
    if (!isSidebarOpen && !isAlertsOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
        setIsAlertsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen, isAlertsOpen]);

  return (
    <div className={styles.shell}>
      <button
        type="button"
        className={cn(styles.overlay, isSidebarOpen && styles.overlayOpen)}
        aria-label="Close admin menu overlay"
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className={styles.layout}>
        <aside
          className={cn(styles.sidebar, isSidebarOpen && styles.sidebarOpen)}
          id="admin-sidebar"
          aria-label="Admin navigation"
        >
          <div className={styles.sidebarHead}>
            <div className={styles.sidebarLogo}>
              <Logo />
            </div>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Close menu"
              onClick={() => setIsSidebarOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M18 6 6 18M6 6l12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>

          <p className={styles.sidebarLabel}>{adminPortal.label}</p>

          <nav className={styles.nav}>
            {adminPortal.nav.map((item) => {
              const isLogout = item.href === "/admin/login" && "muted" in item && item.muted;
              const isActive =
                item.href === "/admin/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              if (isLogout) {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  className={cn(
                    styles.navLink,
                    isActive && styles.navLinkActive,
                    "muted" in item && item.muted && styles.navLinkMuted,
                  )}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className={styles.mainArea}>
          <header className={styles.topbar} aria-label={title}>
            <div className={styles.topbarLeft}>
              <button
                type="button"
                className={styles.menuButton}
                aria-expanded={isSidebarOpen}
                aria-controls="admin-sidebar"
                onClick={() => setIsSidebarOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
              {topbarBackLink ? (
                <Link className={styles.topbarBackLink} href={topbarBackLink.href}>
                  <ArrowIcon direction="left" className={styles.topbarBackIcon} />
                  {topbarBackLink.label}
                </Link>
              ) : null}
            </div>
            <Logo href="/admin/dashboard" className={styles.mobileLogo} />
            <div className={styles.topbarActions}>
              {logoutAction ? (
                <form action={logoutAction}>
                  <button type="submit" className={styles.logoutButton} aria-label="Logout">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M16 17l5-5-5-5M21 12H9"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                </form>
              ) : null}

              <div className={styles.alertMenu}>
                <button
                  type="button"
                  className={styles.alertButton}
                  aria-expanded={isAlertsOpen}
                  aria-label={`${alertCount} alert${alertCount === 1 ? "" : "s"}`}
                  onClick={() => setIsAlertsOpen((isOpen) => !isOpen)}
                >
                  <svg
                    className={styles.alertIcon}
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 18 18"
                    aria-hidden="true"
                  >
                    <path
                      d="M15.75 12.75C14.645 12.75 13.75 11.855 13.75 10.75V6.5C13.75 3.877 11.623 1.75 9 1.75C6.377 1.75 4.25 3.877 4.25 6.5V10.75C4.25 11.855 3.355 12.75 2.25 12.75H15.75Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M10.5 15.3843C10.2005 15.9018 9.6409 16.25 9 16.25C8.3591 16.25 7.7995 15.9018 7.5 15.3843"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                  {alertCount > 0 ? <span className={styles.alertBadge}>{alertCount}</span> : null}
                </button>

                {isAlertsOpen ? (
                  <div className={styles.alertDropdown}>
                    <p className={styles.alertDropdownTitle}>Alerts</p>
                    {dashboardAlert ? (
                      <Link
                        className={styles.alertItem}
                        href={dashboardAlert.href}
                        onClick={() => setIsAlertsOpen(false)}
                      >
                        <strong>{dashboardAlert.title}</strong>
                        <span>{dashboardAlert.meta}</span>
                      </Link>
                    ) : (
                      <p className={styles.alertEmpty}>No open alerts.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </div>
  );
}
