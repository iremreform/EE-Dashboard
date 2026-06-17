import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowIcon } from "./ArrowIcon";
import { cn } from "@/lib/cn";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "link";
type ArrowDirection = "left" | "right";

type CommonProps = {
  variant?: ButtonVariant;
  iconOnly?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  arrow?: ArrowDirection;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = "primary",
  iconOnly = false,
  iconLeft,
  iconRight,
  arrow,
  className,
  children,
  href,
  ...props
}: ButtonProps) {
  const isTertiary = variant === "link";

  const classes = cn(
    isTertiary ? styles.link : styles.button,
    !isTertiary && styles[variant],
    iconOnly && styles.iconOnly,
    className,
  );

  const label = <span className={styles.linkLabel}>{children}</span>;

  const content =
    variant === "link" && arrow ? (
      <>
        {arrow === "left" ? (
          <ArrowIcon direction="left" className={cn(styles.linkIcon, styles.linkIconLeft)} />
        ) : null}
        {label}
        {arrow === "right" ? (
          <ArrowIcon direction="right" className={cn(styles.linkIcon, styles.linkIconRight)} />
        ) : null}
      </>
    ) : (
      <>
        {iconLeft}
        {children}
        {iconRight}
      </>
    );

  if (href) {
    return (
      <Link href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}
