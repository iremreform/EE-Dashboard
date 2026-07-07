import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  return logoutAdmin(request);
}

export async function POST(request: Request) {
  return logoutAdmin(request);
}

async function logoutAdmin(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
