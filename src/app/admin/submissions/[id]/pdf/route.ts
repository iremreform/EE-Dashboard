import { notFound } from "next/navigation";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { getAdminSubmissionDetail } from "@/lib/admin-submissions";
import {
  createAdminSubmissionPdf,
  getSubmissionPdfFilename,
} from "@/lib/admin-submission-pdf";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminSubmissionPdfRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: AdminSubmissionPdfRouteProps) {
  return createSubmissionPdfResponse(params);
}

export async function POST(_request: Request, { params }: AdminSubmissionPdfRouteProps) {
  return createSubmissionPdfResponse(params);
}

async function createSubmissionPdfResponse(params: AdminSubmissionPdfRouteProps["params"]) {
  const { admin } = await requireActiveAdmin();
  const { id } = await params;
  const detail = await getAdminSubmissionDetail(id);

  if (!detail) {
    notFound();
  }

  const pdf = await createAdminSubmissionPdf(detail);
  const filename = getSubmissionPdfFilename(detail);

  await recordPdfExport({ adminId: admin.id, publicId: id });

  return new Response(pdf, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.byteLength),
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function recordPdfExport({ adminId, publicId }: { adminId: string; publicId: string }) {
  const supabase = createSupabaseAdminClient();
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("id")
    .eq("public_id", publicId)
    .maybeSingle();

  if (submissionError || !submission) {
    return;
  }

  await supabase.from("audit_events").insert({
    action: "submission_pdf_exported",
    actor_type: "admin",
    entity_id: submission.id,
    entity_type: "submission",
    metadata: {
      admin_id: adminId,
      public_id: publicId,
    },
  });
}
