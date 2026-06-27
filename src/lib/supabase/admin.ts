import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./env";
import { getSupabaseSecretKey } from "./server-env";

export function createSupabaseAdminClient() {
  const { url } = getSupabasePublicConfig();

  return createClient(url, getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

