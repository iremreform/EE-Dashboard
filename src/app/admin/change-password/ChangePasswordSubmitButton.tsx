"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

export function ChangePasswordSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save password"}
    </Button>
  );
}
