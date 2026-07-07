import type { ReactNode } from "react";
import type { FormHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { nav } from "@/content/portal";
import { Button, Logo } from "@/components/ui";
import { SiteFooter } from "./SiteFooter";
import styles from "./PageShell.module.css";

type PageShellProps = {
  children: ReactNode;
  backAction?: FormHTMLAttributes<HTMLFormElement>["action"];
  backHref?: string;
  backLabel?: string;
  logoutAction?: FormHTMLAttributes<HTMLFormElement>["action"];
  logoutLabel?: string;
  width?: "narrow" | "default" | "wide";
  centerContent?: boolean;
  showFooter?: boolean;
};

export function PageShell({
  children,
  backAction,
  backHref,
  backLabel = nav.home,
  logoutAction,
  logoutLabel = nav.logout,
  width = "default",
  centerContent = false,
  showFooter = true,
}: PageShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.topBarStart}>
          {backAction ? (
            <form action={backAction}>
              <Button type="submit" variant="link" arrow="left">
                {backLabel}
              </Button>
            </form>
          ) : backHref ? (
            <Button href={backHref} variant="link" arrow="left">
              {backLabel}
            </Button>
          ) : null}
        </div>

        <div className={styles.topBarCenter}>
          <Logo priority />
        </div>

        <div className={styles.topBarEnd}>
          {logoutAction ? (
            <form action="/driver/logout" method="post">
              <button type="submit" className={styles.logoutButton} aria-label={logoutLabel}>
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
        </div>
      </header>

      <main
        className={cn(
          styles.main,
          width === "narrow" && styles.mainNarrow,
          width === "default" && styles.mainDefault,
          width === "wide" && styles.mainWide,
          centerContent && styles.mainCentered,
        )}
      >
        {children}
      </main>

      {showFooter ? <SiteFooter /> : null}
    </div>
  );
}
