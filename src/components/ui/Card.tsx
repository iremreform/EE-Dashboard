import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Card.module.css";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  titleVariant?: "heading" | "subheading";
  surface?: "filled" | "transparent";
  centered?: boolean;
  compact?: boolean;
  children: ReactNode;
};

export function Card({
  title,
  titleVariant = "heading",
  surface = "filled",
  centered = false,
  compact = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <section
      className={cn(
        styles.card,
        surface === "transparent" && styles.transparent,
        centered && styles.centered,
        compact && styles.compact,
        className,
      )}
      {...props}
    >
      {title ? (
        <h2 className={cn(styles.title, titleVariant === "subheading" && styles.titleSubheading)}>
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
