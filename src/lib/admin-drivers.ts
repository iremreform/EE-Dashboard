import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DriverStatus = "active" | "disabled";

type DriverRow = {
  auth_user_id: string | null;
  created_at?: string | null;
  disabled_at: string | null;
  email: string;
  first_name: string;
  id: string;
  last_active_at: string | null;
  last_name: string;
  status: DriverStatus;
};

export type AdminDriverListItem = {
  actions: string[];
  active: boolean;
  authUserId: string | null;
  email: string;
  id: string;
  meta: string;
  name: string;
  status: string;
};

export type CreateAdminDriverInput = {
  actorAdminId: string;
  email: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
  phone?: string;
};

type AuditEventRow = {
  action: string;
  created_at: string;
  entity_id: string | null;
  id: string;
  metadata: Record<string, unknown> | null;
};

type AdminUserRow = {
  email: string | null;
  first_name: string | null;
  id: string;
  last_name: string | null;
};

type DriverAuditFallbackRow = {
  created_at: string | null;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
};

export type AdminDriverAuditEvent = {
  action: string;
  actor: string | null;
  driver: string;
  id: string;
  meta: string;
  timestamp: string;
};

export async function getDriverAccessByAuthUserId(authUserId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("email, first_name, id, last_name, status")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to verify driver access: ${error.message}`);
  }

  return data as {
    email: string;
    first_name: string;
    id: string;
    last_name: string;
    status: DriverStatus;
  } | null;
}

export async function getAdminDrivers(searchTerm = "") {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("id, auth_user_id, first_name, last_name, email, status, last_active_at, disabled_at")
    .order("status", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    throw new Error(`Unable to load drivers: ${error.message}`);
  }

  return (data ?? [])
    .filter((row) => matchesDriverSearch(row as DriverRow, searchTerm))
    .map((row) => toDriverListItem(row as DriverRow));
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
      must_change_password: true,
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

  await logDriverAuditEvent({
    action: "driver_created",
    actorAdminId: input.actorAdminId,
    driverId: driver.id,
    email: input.email,
    name: [input.firstName, input.lastName].filter(Boolean).join(" "),
    supabase,
  });
}

async function logDriverAuditEvent({
  action,
  actorAdminId,
  driverId,
  email,
  name,
  status,
  supabase,
}: {
  action: "driver_created" | "driver_disabled" | "driver_password_reset" | "driver_reenabled";
  actorAdminId: string;
  driverId: string;
  email: string;
  name?: string;
  status?: DriverStatus;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
}) {
  await supabase.from("audit_events").insert({
    action,
    actor_type: "admin",
    entity_id: driverId,
    entity_type: "driver",
    metadata: {
      admin_id: actorAdminId,
      email,
      name,
      status,
    },
  });
}

export async function getAdminDriverAuditEvents(limit = 8) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("audit_events")
    .select("id, action, entity_id, metadata, created_at")
    .eq("entity_type", "driver")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Unable to load driver audit history: ${error.message}`);
  }

  const events = (data ?? []) as AuditEventRow[];

  if (!events.length) {
    return getDriverCreationFallbackAuditEvents(limit);
  }

  const actorIds = Array.from(
    new Set(events.map((event) => getMetadataString(event.metadata, "admin_id")).filter(Boolean)),
  );
  const actors = await getAdminUserMap(actorIds);

  return events.map((event) => toDriverAuditEvent(event, actors));
}

export async function setAdminDriverStatus({
  actorAdminId,
  driverId,
  status,
}: {
  actorAdminId: string;
  driverId: string;
  status: DriverStatus;
}) {
  const supabase = createSupabaseAdminClient();
  const disabledAt = status === "disabled" ? new Date().toISOString() : null;

  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .update({
      disabled_at: disabledAt,
      status,
    })
    .eq("id", driverId)
    .select("id, email, status")
    .single();

  if (driverError) {
    throw new Error(`Unable to update driver status: ${driverError.message}`);
  }

  await logDriverAuditEvent({
    action: status === "disabled" ? "driver_disabled" : "driver_reenabled",
    actorAdminId,
    driverId: driver.id,
    email: driver.email,
    status: driver.status,
    supabase,
  });
}

export async function resetAdminDriverPassword({
  actorAdminId,
  driverId,
  temporaryPassword,
}: {
  actorAdminId: string;
  driverId: string;
  temporaryPassword: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: driver, error: driverError } = await supabase
    .from("drivers")
    .select("id, auth_user_id, email")
    .eq("id", driverId)
    .maybeSingle();

  if (driverError) {
    throw new Error(`Unable to load driver before password reset: ${driverError.message}`);
  }

  if (!driver?.auth_user_id) {
    throw new Error("Driver does not have a linked auth user.");
  }

  const { data: authUser } = await supabase.auth.admin.getUserById(driver.auth_user_id);

  const { error: authError } = await supabase.auth.admin.updateUserById(driver.auth_user_id, {
    user_metadata: {
      ...(authUser.user?.user_metadata ?? {}),
      must_change_password: true,
    },
    password: temporaryPassword,
  });

  if (authError) {
    throw new Error(`Unable to reset driver password: ${authError.message}`);
  }

  await logDriverAuditEvent({
    action: "driver_password_reset",
    actorAdminId,
    driverId: driver.id,
    email: driver.email,
    supabase,
  });
}

function toDriverListItem(driver: DriverRow): AdminDriverListItem {
  const active = driver.status === "active";

  return {
    actions: active ? ["Reset password", "Disable"] : ["Re-enable"],
    active,
    authUserId: driver.auth_user_id,
    email: driver.email,
    id: driver.id,
    meta: [driver.email, formatDriverActivity(driver)].filter(Boolean).join(" - "),
    name: [driver.first_name, driver.last_name].filter(Boolean).join(" "),
    status: active ? "Active" : "Disabled",
  };
}

async function getAdminUserMap(actorIds: string[]) {
  if (!actorIds.length) {
    return new Map<string, string>();
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, first_name, last_name, email")
    .in("id", actorIds);

  if (error) {
    return new Map<string, string>();
  }

  return new Map(
    ((data ?? []) as AdminUserRow[]).map((admin) => [
      admin.id,
      fullName({
        first_name: admin.first_name,
        last_name: admin.last_name,
      }) || admin.email || "Admin",
    ]),
  );
}

async function getDriverCreationFallbackAuditEvents(limit: number) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("id, first_name, last_name, email, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return ((data ?? []) as DriverAuditFallbackRow[]).map((driver) => {
    const timestamp = driver.created_at ?? "";
    const name = fullName({
      first_name: driver.first_name,
      last_name: driver.last_name,
    });

    return {
      action: "Driver created",
      actor: null,
      driver: name || driver.email || "Driver account",
      id: `driver-created-${driver.id}`,
      meta: [driver.email, timestamp ? formatDateTime(timestamp) : null].filter(Boolean).join(" - "),
      timestamp: timestamp ? formatDateTime(timestamp) : "",
    } satisfies AdminDriverAuditEvent;
  });
}

function toDriverAuditEvent(
  event: AuditEventRow,
  actors: Map<string, string>,
): AdminDriverAuditEvent {
  const email = getMetadataString(event.metadata, "email");
  const name = getMetadataString(event.metadata, "name");
  const actorAdminId = getMetadataString(event.metadata, "admin_id");

  return {
    action: formatAuditAction(event.action),
    actor: actorAdminId ? actors.get(actorAdminId) ?? "Admin" : "System",
    driver: name || email || "Driver account",
    id: event.id,
    meta: [email, formatDateTime(event.created_at)].filter(Boolean).join(" - "),
    timestamp: formatDateTime(event.created_at),
  };
}

function getMetadataString(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
}

function fullName(person: { first_name?: string | null; last_name?: string | null }) {
  return [person.first_name, person.last_name].filter(Boolean).join(" ");
}

function formatAuditAction(action: string) {
  const labels: Record<string, string> = {
    driver_created: "Driver created",
    driver_disabled: "Driver disabled",
    driver_password_reset: "Password reset",
    driver_reenabled: "Driver re-enabled",
  };

  return labels[action] ?? action.replace(/_/g, " ");
}

function matchesDriverSearch(driver: DriverRow, searchTerm: string) {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    driver.email,
    driver.first_name,
    driver.last_name,
    `${driver.first_name} ${driver.last_name}`,
  ].some((value) => value.toLowerCase().includes(query));
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
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
