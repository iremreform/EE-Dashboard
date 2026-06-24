import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import styles from "./Logo.module.css";

type LogoProps = {
  href?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function Logo({
  href = "/",
  width = 140,
  height = 28,
  className,
  priority = false,
}: LogoProps) {
  const image = (
    <span className={cn(styles.logoMark, className)}>
      <Image
        src="/company-logo.svg"
        alt="Energetic Exotics"
        width={width}
        height={height}
        className={cn(styles.image, styles.fullLogo)}
        priority={priority}
      />
      <Image
        src="/ee%20logo%20small.png"
        alt=""
        width={60}
        height={40}
        className={cn(styles.image, styles.smallLogo)}
        priority={priority}
        aria-hidden="true"
      />
    </span>
  );

  if (!href) {
    return image;
  }

  return (
    <Link href={href} className={styles.logoLink}>
      {image}
    </Link>
  );
}
