import { NextRequest, NextResponse } from "next/server";
import { getAdminAccessByAuthUserId } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const INVALID_LINK_MESSAGE =
  "Password reset link is invalid or expired. Please request a new link.";
const INACTIVE_ACCOUNT_MESSAGE =
  "This admin account is not active. Please contact another administrator.";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const callbackUrl = new URL(request.url);
  const errorCode = callbackUrl.searchParams.get("error_code");
  const authCode = callbackUrl.searchParams.get("code");
  const tokenHash = callbackUrl.searchParams.get("token_hash");
  const recoveryType = callbackUrl.searchParams.get("type");

  if (errorCode || (!authCode && !tokenHash)) {
    return redirectToRecovery(request, INVALID_LINK_MESSAGE);
  }

  const supabase = await createSupabaseServerClient();
  const { error: exchangeError } = tokenHash && recoveryType === "recovery"
    ? await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      })
    : authCode
      ? await supabase.auth.exchangeCodeForSession(authCode)
      : { error: new Error("Invalid recovery type.") };

  if (exchangeError) {
    return redirectToRecovery(request, INVALID_LINK_MESSAGE);
  }

  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    await supabase.auth.signOut();
    return redirectToRecovery(request, INVALID_LINK_MESSAGE);
  }

  const admin = await getAdminAccessByAuthUserId(data.user.id);

  if (!admin || admin.status !== "active") {
    await supabase.auth.signOut();
    return redirectToRecovery(request, INACTIVE_ACCOUNT_MESSAGE);
  }

  const destination = new URL("/admin/change-password", request.url);
  destination.searchParams.set("recovery", "1");

  return noStoreRedirect(destination);
}

function redirectToRecovery(request: NextRequest, message: string) {
  const destination = new URL("/admin/forgot-password", request.url);
  destination.searchParams.set("error", message);
  return noStoreRedirect(destination);
}

function noStoreRedirect(destination: URL) {
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
