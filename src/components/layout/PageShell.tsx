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
  width?: "narrow" | "default" | "wide";
  centerContent?: boolean;
  showFooter?: boolean;
};

export function PageShell({
  children,
  backAction,
  backHref,
  backLabel = nav.home,
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

        <div aria-hidden="true" className={styles.topBarEnd} />
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
