import "server-only";

export function getSupabaseSecretKey() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing SUPABASE_SECRET_KEY");
  }

  return secretKey;
}

