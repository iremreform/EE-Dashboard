import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import type { TypographyLevel } from "@/lib/typography";
import styles from "./Heading.module.css";

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: TypographyLevel;
};

const tagMap = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;

export function Heading({ level = 1, className, children, ...props }: HeadingProps) {
  const Tag = tagMap[level];

  return (
    <Tag className={cn(styles.heading, styles[`h${level}`], className)} {...props}>
      {children}
    </Tag>
  );
}
