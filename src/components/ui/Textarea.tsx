import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import styles from "./form-controls.module.css";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export function Textarea({ className, hasError = false, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(styles.control, styles.textarea, hasError && styles.error, className)}
      {...props}
    />
  );
}
