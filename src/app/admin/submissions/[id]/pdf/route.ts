import { notFound } from "next/navigation";
import { requireActiveAdmin } from "@/lib/admin-auth";
import { getAdminSubmissionDetail } from "@/lib/admin-submissions";
import {
  createAdminSubmissionPdf,
  getSubmissionPdfFilename,
} from "@/lib/admin-submission-pdf";

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
  await requireActiveAdmin();
  const { id } = await params;
  const detail = await getAdminSubmissionDetail(id);

  if (!detail) {
    notFound();
  }

  const pdf = await createAdminSubmissionPdf(detail);
  const filename = getSubmissionPdfFilename(detail);

  return new Response(pdf, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.byteLength),
      "Content-Type": "application/pdf",
    },
  });
}
