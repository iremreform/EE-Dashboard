import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "./form-controls.module.css";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export function Input({ className, hasError = false, ...props }: InputProps) {
  return (
    <input
      className={cn(styles.control, hasError && styles.error, className)}
      {...props}
    />
  );
}
