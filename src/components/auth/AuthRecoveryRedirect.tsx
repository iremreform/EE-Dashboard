"use client";

import { useEffect } from "react";

const EXPIRED_RECOVERY_MESSAGE =
  "Password reset link is invalid or expired. Please request a new link.";

export function AuthRecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";

    if (!hash) {
      return;
    }

    const params = new URLSearchParams(hash);
    const error = params.get("error");
    const errorCode = params.get("error_code");

    if (error) {
      const message = errorCode === "otp_expired"
        ? EXPIRED_RECOVERY_MESSAGE
        : params.get("error_description") || "Password reset link could not be used.";

      window.history.replaceState(null, "", window.location.pathname);
      window.location.assign(`/admin/forgot-password?error=${encodeURIComponent(message)}`);
      return;
    }

    if (params.get("type") !== "recovery") {
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);
    window.location.assign(
      `/admin/forgot-password?error=${encodeURIComponent(EXPIRED_RECOVERY_MESSAGE)}`,
    );
  }, []);

  return null;
}
