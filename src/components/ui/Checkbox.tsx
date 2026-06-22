import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Checkbox.module.css";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  children: ReactNode;
  className?: string;
};

export function Checkbox({ children, className, ...props }: CheckboxProps) {
  return (
    <label className={cn(styles.root, className)}>
      <input className={styles.input} type="checkbox" {...props} />
      <span className={styles.box} aria-hidden="true">
        <svg
          className={styles.icon}
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M7.57181 12.6549L4.37339 9.45649L3 10.8299L7.57181 15.4017L17 5.97348L15.6266 4.6001L7.57181 12.6549Z"
            fill="white"
          />
        </svg>
      </span>
      <span className={styles.label}>{children}</span>
    </label>
  );
}
