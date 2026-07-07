import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  return logoutDriver(request);
}

export async function POST(request: Request) {
  return logoutDriver(request);
}

async function logoutDriver(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/driver/login", request.url), 303);
}
