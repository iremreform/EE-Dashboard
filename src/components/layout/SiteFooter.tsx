import Link from "next/link";
import { footer } from "@/content/portal";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.siteFooter}>
      <p className={styles.copyright}>{footer.copyright}</p>

      <p className={styles.credit}>
        {footer.credit}{" "}
        <Link className={styles.creditBrand} href={footer.creditHref} rel="noopener noreferrer" target="_blank">
          {footer.creditBrand}
        </Link>
      </p>
    </footer>
  );
}
