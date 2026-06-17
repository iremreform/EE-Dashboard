import { cn } from "@/lib/cn";
import styles from "./ArrowIcon.module.css";

type ArrowIconProps = {
  direction: "left" | "right";
  className?: string;
};

export function ArrowIcon({ direction, className }: ArrowIconProps) {
  return (
    <span
      className={cn(
        styles.arrow,
        direction === "left" ? styles.left : styles.right,
        className,
      )}
      aria-hidden="true"
    />
  );
}
