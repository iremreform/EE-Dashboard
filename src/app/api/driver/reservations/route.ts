import { NextResponse } from "next/server";
import { getDriverAccessByAuthUserId } from "@/lib/admin-drivers";
import { lookupDriverReservation } from "@/lib/driver-reservations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const driver = await getDriverAccessByAuthUserId(data.user.id);

  if (!driver || driver.status !== "active") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return jsonResponse({ error: "Missing reservation query" }, 400);
  }

  const reservation = await lookupDriverReservation(query);

  if (!reservation) {
    return jsonResponse({ error: "Reservation not found" }, 404);
  }

  return jsonResponse({ reservation });
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, no-store" },
    status,
  });
}
