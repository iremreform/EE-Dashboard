import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { TypographyLevel } from "@/lib/typography";
import { Heading, Tagline } from "@/components/ui";
import styles from "./PageIntro.module.css";

type PageIntroProps = {
  tagline?: string;
  title: string;
  lead?: string;
  centered?: boolean;
  headingLevel?: TypographyLevel;
  leadSize?: "default" | "large";
  taglineRule?: boolean;
};

export function PageIntro({
  tagline,
  title,
  lead,
  centered = false,
  headingLevel = 1,
  leadSize = "default",
  taglineRule = false,
}: PageIntroProps) {
  return (
    <div className={cn(styles.intro, centered && styles.introCentered)}>
      {tagline ? (
        <div className={cn(taglineRule && styles.taglineRow)}>
          <Tagline level={headingLevel}>{tagline}</Tagline>
          {taglineRule ? <span className={styles.taglineRule} aria-hidden="true" /> : null}
        </div>
      ) : null}
      <Heading level={headingLevel}>{title}</Heading>
      {lead ? <p className={cn(styles.lead, leadSize === "large" && styles.leadLarge)}>{lead}</p> : null}
    </div>
  );
}

type PageSectionProps = {
  children: ReactNode;
  className?: string;
};

export function ChoiceGrid({ children, className }: PageSectionProps) {
  return <div className={cn(styles.choiceGrid, className)}>{children}</div>;
}

export function PageGrid({ children, className }: PageSectionProps) {
  return <div className={cn(styles.gridTwo, className)}>{children}</div>;
}
