import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./form-controls.module.css";

type FieldRenderProps = {
  describedBy?: string;
  hasError: boolean;
};

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode | ((props: FieldRenderProps) => ReactNode);
};

export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  const errorId = error ? `${htmlFor}-error` : undefined;
  const hintId = !error && hint ? `${htmlFor}-hint` : undefined;
  const describedBy = errorId ?? hintId;
  const hasError = Boolean(error);

  return (
    <div className={cn(styles.field, className)}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
      </label>
      {typeof children === "function" ? children({ describedBy, hasError }) : children}
      {error ? (
        <p id={errorId} className={styles.fieldError} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
