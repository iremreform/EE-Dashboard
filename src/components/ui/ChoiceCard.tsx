import Link from "next/link";
import { cn } from "@/lib/cn";
import styles from "./ChoiceCard.module.css";

type ChoiceCardProps = {
  href: string;
  title: string;
  description: string;
  actionLabel: string;
  variant?: "square" | "panel";
};

export function ChoiceCard({
  href,
  title,
  description,
  actionLabel,
  variant = "square",
}: ChoiceCardProps) {
  return (
    <Link className={cn(styles.choiceCard, variant === "panel" && styles.panel)} href={href}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
      <span className={styles.actionLabel}>{actionLabel}</span>
    </Link>
  );
}
