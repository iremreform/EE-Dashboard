import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DriverStatus = "active" | "disabled";

type DriverRow = {
  disabled_at: string | null;
  email: string;
  first_name: string;
  last_active_at: string | null;
  last_name: string;
  status: DriverStatus;
};

export type AdminDriverListItem = {
  actions: string[];
  active: boolean;
  meta: string;
  name: string;
  status: string;
};

export type CreateAdminDriverInput = {
  email: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
  phone?: string;
};

export async function getDriverAccessByAuthUserId(authUserId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("id, status")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to verify driver access: ${error.message}`);
  }

  return data as { id: string; status: DriverStatus } | null;
}

export async function getAdminDrivers() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("first_name, last_name, email, status, last_active_at, disabled_at")
    .order("status", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    throw new Error(`Unable to load drivers: ${error.message}`);
  }

  return (data ?? []).map((row) => toDriverListItem(row as DriverRow));
}

export async function createAdminDriver(input: CreateAdminDriverInput) {
  const supabase = createSupabaseAdminClient();
  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .insert({
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone || null,
      status: "active",
    })
    .select("id")
    .single();

  if (driverError) {
    throw new Error(`Unable to create driver: ${driverError.message}`);
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    email_confirm: true,
    password: input.temporaryPassword,
    user_metadata: {
      first_name: input.firstName,
      last_name: input.lastName,
      role: "driver",
    },
  });

  if (authError) {
    await supabase.from("drivers").delete().eq("id", driver.id);
    throw new Error(`Unable to create driver auth user: ${authError.message}`);
  }

  const { error: updateError } = await supabase
    .from("drivers")
    .update({ auth_user_id: authUser.user.id })
    .eq("id", driver.id);

  if (updateError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    await supabase.from("drivers").delete().eq("id", driver.id);
    throw new Error(`Unable to link driver auth user: ${updateError.message}`);
  }
}

function toDriverListItem(driver: DriverRow): AdminDriverListItem {
  const active = driver.status === "active";

  return {
    actions: active ? ["Reset password", "Disable"] : ["Re-enable"],
    active,
    meta: [driver.email, formatDriverActivity(driver)].filter(Boolean).join(" - "),
    name: [driver.first_name, driver.last_name].filter(Boolean).join(" "),
    status: active ? "Active" : "Disabled",
  };
}

function formatDriverActivity(driver: DriverRow) {
  if (driver.status === "disabled") {
    return driver.disabled_at ? `Disabled ${formatDate(driver.disabled_at)}` : "Disabled";
  }

  return driver.last_active_at
    ? `Last active ${formatRelativeTime(driver.last_active_at)}`
    : "No recent activity";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const today = dateKey(now);
  const submittedDay = dateKey(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(date);

  if (submittedDay === today) {
    return `today ${time}`;
  }

  if (submittedDay === dateKey(yesterday)) {
    return `yesterday ${time}`;
  }

  return formatDate(value);
}

function dateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).format(value);
}
