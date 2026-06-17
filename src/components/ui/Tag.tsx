import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "./Tag.module.css";

type TagProps = HTMLAttributes<HTMLSpanElement> & {
  active?: boolean;
};

export function Tag({ active = false, className, children, ...props }: TagProps) {
  return (
    <span className={cn(styles.tag, active && styles.active, className)} {...props}>
      {children}
    </span>
  );
}
