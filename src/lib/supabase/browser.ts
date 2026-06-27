import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./env";

export function createSupabaseBrowserClient() {
  const { publishableKey, url } = getSupabasePublicConfig();

  return createBrowserClient(url, publishableKey);
}

