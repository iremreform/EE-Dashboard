import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "./form-controls.module.css";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export function Select({ className, hasError = false, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(styles.control, styles.select, hasError && styles.error, className)}
      {...props}
    >
      {children}
    </select>
  );
}
