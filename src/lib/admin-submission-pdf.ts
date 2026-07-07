import "server-only";
import type { AdminSubmissionDetailView, AdminSubmissionMediaView } from "@/lib/admin-submissions";

type PdfTextLine = {
  color?: "leather" | "muted" | "primary";
  gapAfter?: number;
  gapBefore?: number;
  indent?: number;
  size?: number;
  text: string;
};

type PdfPage = {
  commands: string[];
  y: number;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 54;
const MARGIN_TOP = 58;
const MARGIN_BOTTOM = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const LINE_HEIGHT_RATIO = 1.32;

const COLORS = {
  leather: "0.749 0.639 0.518",
  muted: "0.55 0.55 0.55",
  primary: "0.96 0.96 0.96",
};

export function createAdminSubmissionPdf(detail: AdminSubmissionDetailView) {
  const pages = layoutPdfLines(buildPdfLines(detail));
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
  ];

  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];
  const fontObjectId = 3 + pages.length * 2;

  pages.forEach((page, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);
    contentObjectIds.push(contentObjectId);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;

  pages.forEach((page, index) => {
    const pageObjectId = pageObjectIds[index];
    const contentObjectId = contentObjectIds[index];
    objects[pageObjectId - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    objects[contentObjectId - 1] = createStream(
      [
        ...page.commands,
        drawText({
          color: "muted",
          size: 8,
          text: `Page ${index + 1} of ${pages.length}`,
          x: MARGIN_X,
          y: 30,
        }),
      ].join("\n"),
    );
  });

  objects[fontObjectId - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  return serializePdf(objects);
}

export function getSubmissionPdfFilename(detail: AdminSubmissionDetailView) {
  return `${detail.edit.publicId}.pdf`;
}

function buildPdfLines(detail: AdminSubmissionDetailView) {
  const lines: PdfTextLine[] = [
    { color: "leather", size: 12, text: "Energetic Exotics" },
    { gapAfter: 8, size: 24, text: detail.title },
    {
      color: "muted",
      gapAfter: 18,
      size: 10,
      text: [detail.type, detail.reservation, detail.status].filter(Boolean).join(" | "),
    },
    { color: "leather", gapBefore: 4, size: 15, text: detail.summaryTitle },
    ...fieldLines(detail.summary),
  ];

  detail.detailSections.forEach((section) => {
    lines.push({ color: "leather", gapBefore: 14, size: 15, text: section.title });
    lines.push(...fieldLines(section.fields));
  });

  lines.push({ color: "leather", gapBefore: 14, size: 15, text: detail.mediaTitle });
  lines.push(...mediaLines(detail.media, "No photos or videos uploaded."));

  lines.push({ color: "leather", gapBefore: 14, size: 15, text: detail.verificationTitle });
  lines.push(...mediaLines(detail.licenses, "No license photos uploaded."));
  lines.push(...fieldLines([detail.payment]));
  lines.push({
    size: 10,
    text: `Guest signature: ${detail.signature.url ? "Captured" : "Not provided"}`,
  });

  lines.push({ color: "leather", gapBefore: 14, size: 15, text: detail.notesTitle });
  if (detail.notes.length) {
    detail.notes.forEach((note) => {
      lines.push({ size: 10, text: note.body });
      lines.push({ color: "muted", gapAfter: 4, size: 8, text: note.createdAt });
    });
  } else {
    lines.push({ color: "muted", size: 10, text: "No additional notes recorded." });
  }

  return lines;
}

function fieldLines(fields: Array<[string, string]>) {
  return fields.map(([label, value]) => ({
    size: 10,
    text: `${label}: ${value || "Not provided"}`,
  }));
}

function mediaLines(items: AdminSubmissionMediaView[], emptyText: string) {
  if (!items.length) {
    return [{ color: "muted" as const, size: 10, text: emptyText }];
  }

  return items.map((item) => ({
    size: 10,
    text: [
      item.label,
      item.kind,
      item.mimeType,
      item.sizeLabel,
      item.url ? "Uploaded" : "Unavailable",
    ]
      .filter(Boolean)
      .join(" - "),
  }));
}

function layoutPdfLines(lines: PdfTextLine[]) {
  const pages: PdfPage[] = [];
  let page = createPage();
  pages.push(page);

  for (const line of lines) {
    const size = line.size ?? 10;
    const lineHeight = size * LINE_HEIGHT_RATIO;
    const wrappedLines = wrapText(line.text, size, CONTENT_WIDTH - (line.indent ?? 0));
    const blockHeight =
      (line.gapBefore ?? 0) + wrappedLines.length * lineHeight + (line.gapAfter ?? 0);

    if (page.y - blockHeight < MARGIN_BOTTOM) {
      page = createPage();
      pages.push(page);
    }

    page.y -= line.gapBefore ?? 0;

    wrappedLines.forEach((text) => {
      page.commands.push(
        drawText({
          color: line.color ?? "primary",
          size,
          text,
          x: MARGIN_X + (line.indent ?? 0),
          y: page.y,
        }),
      );
      page.y -= lineHeight;
    });

    page.y -= line.gapAfter ?? 0;
  }

  return pages;
}

function createPage(): PdfPage {
  return {
    commands: [
      "0.055 0.055 0.055 rg",
      `0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re`,
      "f",
    ],
    y: PAGE_HEIGHT - MARGIN_TOP,
  };
}

function wrapText(text: string, size: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (measureText(next, size) <= maxWidth) {
      current = next;
      return;
    }

    if (current) {
      lines.push(current);
    }

    if (measureText(word, size) > maxWidth) {
      const chunkSize = Math.max(8, Math.floor(maxWidth / (size * 0.56)));
      const chunks = word.match(new RegExp(`.{1,${chunkSize}}`, "g")) ?? [word];
      lines.push(...chunks.slice(0, -1));
      current = chunks[chunks.length - 1] ?? "";
      return;
    }

    current = word;
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function measureText(text: string, size: number) {
  return text.length * size * 0.52;
}

function drawText({
  color,
  size,
  text,
  x,
  y,
}: {
  color: keyof typeof COLORS;
  size: number;
  text: string;
  x: number;
  y: number;
}) {
  return [
    `${COLORS[color]} rg`,
    "BT",
    `/F1 ${size} Tf`,
    `${x} ${y} Td`,
    `(${escapePdfText(text)}) Tj`,
    "ET",
  ].join("\n");
}

function createStream(content: string) {
  const length = Buffer.byteLength(content, "utf8");
  return `<< /Length ${length} >>\nstream\n${content}\nendstream`;
}

function escapePdfText(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function serializePdf(objects: string[]) {
  const header = "%PDF-1.4\n";
  let offset = Buffer.byteLength(header, "utf8");
  const offsets = [0];
  const body = objects
    .map((object, index) => {
      offsets.push(offset);
      const chunk = `${index + 1} 0 obj\n${object}\nendobj\n`;
      offset += Buffer.byteLength(chunk, "utf8");
      return chunk;
    })
    .join("");

  const xrefOffset = offset;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((item) => `${item.toString().padStart(10, "0")} 00000 n `),
  ].join("\n");
  const trailer = `\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(`${header}${body}${xref}${trailer}`, "utf8");
}
