import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import type { TypographyLevel } from "@/lib/typography";
import styles from "./Tagline.module.css";

type TaglineProps = HTMLAttributes<HTMLParagraphElement> & {
  level?: TypographyLevel;
};

export function Tagline({ level = 1, className, children, ...props }: TaglineProps) {
  return (
    <p className={cn(styles.tagline, styles[`h${level}`], className)} {...props}>
      {children}
    </p>
  );
}
