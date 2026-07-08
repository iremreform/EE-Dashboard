"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type RecoveryTargetResponse = {
  target?: string;
};

const EXPIRED_RECOVERY_MESSAGE =
  "Password reset link is invalid or expired. Please ask an administrator to send a new reset link.";

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
      window.location.assign(`/admin/login?error=${encodeURIComponent(message)}`);
      return;
    }

    if (params.get("type") !== "recovery") {
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      return;
    }

    const recoveryAccessToken = accessToken;
    const recoveryRefreshToken = refreshToken;
    let isMounted = true;

    async function handleRecovery() {
      const supabase = createSupabaseBrowserClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: recoveryAccessToken,
        refresh_token: recoveryRefreshToken,
      });

      window.history.replaceState(null, "", window.location.pathname);

      if (sessionError || !isMounted) {
        window.location.assign(`/admin/login?error=${encodeURIComponent(EXPIRED_RECOVERY_MESSAGE)}`);
        return;
      }

      const response = await fetch("/api/auth/recovery-target", { cache: "no-store" });
      const body = await response.json().catch(() => ({})) as RecoveryTargetResponse;

      window.location.assign(body.target ?? "/admin/change-password?recovery=1");
    }

    void handleRecovery();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
