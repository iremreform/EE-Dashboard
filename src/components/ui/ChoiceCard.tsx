import Link from "next/link";
import styles from "./ChoiceCard.module.css";

type ChoiceCardProps = {
  href: string;
  title: string;
  description: string;
  actionLabel: string;
};

export function ChoiceCard({ href, title, description, actionLabel }: ChoiceCardProps) {
  return (
    <Link href={href} className={styles.choiceCard}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
      <span className={styles.actionLabel}>{actionLabel}</span>
    </Link>
  );
}
