import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSupabaseSecretKey } from "@/lib/supabase/server-env";

const ADMIN_RECOVERY_COOKIE = "ee_admin_recovery";
const ADMIN_RECOVERY_MAX_AGE_SECONDS = 15 * 60;

type RecoveryProof = {
  expiresAt: number;
  userId: string;
};

export async function setAdminRecoveryProof(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_RECOVERY_MAX_AGE_SECONDS;
  const payload = Buffer.from(JSON.stringify({ expiresAt, userId } satisfies RecoveryProof))
    .toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_RECOVERY_COOKIE, value, {
    httpOnly: true,
    maxAge: ADMIN_RECOVERY_MAX_AGE_SECONDS,
    path: "/admin/change-password",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function hasAdminRecoveryProof(userId: string) {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_RECOVERY_COOKIE)?.value;

  if (!value) {
    return false;
  }

  const [payload, signature, ...extra] = value.split(".");

  if (!payload || !signature || extra.length || !hasValidSignature(payload, signature)) {
    return false;
  }

  try {
    const proof = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as RecoveryProof;
    return proof.userId === userId
      && Number.isSafeInteger(proof.expiresAt)
      && proof.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function clearAdminRecoveryProof() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_RECOVERY_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/admin/change-password",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

function hasValidSignature(payload: string, signature: string) {
  const expected = Buffer.from(sign(payload), "base64url");
  const received = Buffer.from(signature, "base64url");

  return expected.length === received.length && timingSafeEqual(expected, received);
}

function sign(payload: string) {
  return createHmac("sha256", getSupabaseSecretKey())
    .update(`admin-password-recovery:${payload}`)
    .digest("base64url");
}
