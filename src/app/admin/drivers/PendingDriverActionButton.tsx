"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

type PendingDriverActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "type"
> & {
  className?: string;
  label: string;
  pendingLabel: string;
  size?: "default" | "small";
  variant?: "primary" | "secondary" | "link";
};

export function PendingDriverActionButton({
  label,
  pendingLabel,
  ...props
}: PendingDriverActionButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
