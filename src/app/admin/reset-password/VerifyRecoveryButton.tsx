"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

export function VerifyRecoveryButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Verifying..." : "Continue"}
    </Button>
  );
}
