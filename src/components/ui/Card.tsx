import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Card.module.css";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  centered?: boolean;
  compact?: boolean;
  children: ReactNode;
};

export function Card({
  title,
  centered = false,
  compact = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <section
      className={cn(styles.card, centered && styles.centered, compact && styles.compact, className)}
      {...props}
    >
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {children}
    </section>
  );
}
