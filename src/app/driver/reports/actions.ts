"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveDriver } from "@/lib/driver-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function addDriverReportNoteAction(formData: FormData) {
  const { driver } = await requireActiveDriver();
  const publicId = getFormValue(formData, "public_id");
  const body = getFormValue(formData, "driver_note");

  if (!publicId) {
    redirect("/driver/reports?error=missing-report");
  }

  if (!body) {
    redirect(`/driver/reports/${publicId}?error=empty-note`);
  }

  const supabase = createSupabaseAdminClient();
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("id")
    .eq("public_id", publicId)
    .eq("driver_id", driver.id)
    .maybeSingle();

  if (submissionError) {
    throw new Error(`Unable to load submitted report: ${submissionError.message}`);
  }

  if (!submission) {
    redirect("/driver/reports?error=missing-report");
  }

  const { error: noteError } = await supabase.from("submission_notes").insert({
    author_driver_id: driver.id,
    body,
    submission_id: submission.id,
  });

  if (noteError) {
    throw new Error(`Unable to add driver note: ${noteError.message}`);
  }

  await supabase.from("audit_events").insert({
    action: "submission_note_added",
    actor_driver_id: driver.id,
    actor_type: "driver",
    entity_id: submission.id,
    entity_type: "submission",
    metadata: {
      public_id: publicId,
    },
  });

  revalidatePath(`/admin/submissions/${publicId}`);
  revalidatePath(`/driver/reports/${publicId}`);
  redirect(`/driver/reports/${publicId}?saved=1`);
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
