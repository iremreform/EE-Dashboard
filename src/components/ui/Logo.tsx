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
    <Image
      src="/company-logo.svg"
      alt="Energetic Exotics"
      width={width}
      height={height}
      className={cn(styles.image, className)}
      priority={priority}
    />
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
