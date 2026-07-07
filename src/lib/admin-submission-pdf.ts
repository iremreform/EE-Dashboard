import "server-only";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";
import sharp from "sharp";
import type { AdminSubmissionDetailView, AdminSubmissionMediaView } from "@/lib/admin-submissions";

type PdfImage = {
  alpha: Buffer;
  data?: never;
  format: "png";
  height: number;
  rgb: Buffer;
  width: number;
} | {
  alpha?: never;
  data: Buffer;
  format: "jpeg";
  height: number;
  rgb?: never;
  width: number;
};

type PdfLogo =
  | {
      height: number;
      kind: "svg";
      paths: string[];
      width: number;
    }
  | {
      image: PdfImage;
      kind: "image";
    };

type PdfPage = {
  commands: string[];
  y: number;
};

type PdfSection = {
  fields: Array<[string, string]>;
  title: string;
};

type PdfImageResource = {
  image: PdfImage;
  maskObjectId?: number;
  name: string;
  objectId: number;
};

type PdfVisualImage = {
  image: PdfImage;
  label: string;
  name: string;
};

type PdfAssets = {
  logo: PdfLogo | null;
  resources: PdfVisualImage[];
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 48;
const MARGIN_TOP = 44;
const MARGIN_BOTTOM = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const COLUMN_GAP = 22;

const COLORS = {
  border: "0.86 0.86 0.86",
  leather: "0.47 0.345 0.235",
  muted: "0.38 0.38 0.38",
  primary: "0.08 0.08 0.08",
  soft: "0.965 0.965 0.965",
  white: "1 1 1",
};

export async function createAdminSubmissionPdf(detail: AdminSubmissionDetailView) {
  const logo = loadLogo();
  const mediaImages = await loadSubmissionImages(detail);
  const pages = drawReport(detail, { logo, resources: mediaImages });
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
  ];

  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];
  let nextObjectId = 3;

  pages.forEach(() => {
    pageObjectIds.push(nextObjectId);
    contentObjectIds.push(nextObjectId + 1);
    nextObjectId += 2;
  });

  const fontRegularObjectId = nextObjectId++;
  const fontBoldObjectId = nextObjectId++;
  const imageObjectId = logo?.kind === "image" ? nextObjectId++ : null;
  const imageMaskObjectId =
    logo?.kind === "image" && logo.image.format === "png" ? nextObjectId++ : null;
  const imageResources: PdfImageResource[] = [];

  mediaImages.forEach((item) => {
    imageResources.push({
      image: item.image,
      maskObjectId: item.image.format === "png" ? nextObjectId++ : undefined,
      name: item.name,
      objectId: nextObjectId++,
    });
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;

  pages.forEach((page, index) => {
    const pageObjectId = pageObjectIds[index];
    const contentObjectId = contentObjectIds[index];
    const imageResource =
      getImageResourceDictionary({
        logoImageObjectId: imageObjectId,
        resources: imageResources,
      });

    objects[pageObjectId - 1] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularObjectId} 0 R /F2 ${fontBoldObjectId} 0 R >>${imageResource} >> /Contents ${contentObjectId} 0 R >>`;
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

  objects[fontRegularObjectId - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[fontBoldObjectId - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  if (logo?.kind === "image" && imageObjectId) {
    objects[imageObjectId - 1] = createImageObject(logo.image, imageMaskObjectId ?? undefined);
    if (logo.image.format === "png" && imageMaskObjectId) {
      objects[imageMaskObjectId - 1] = createImageMaskObject(logo.image);
    }
  }

  imageResources.forEach((resource) => {
    objects[resource.objectId - 1] = createImageObject(resource.image, resource.maskObjectId);

    if (resource.image.format === "png" && resource.maskObjectId) {
      objects[resource.maskObjectId - 1] = createImageMaskObject(resource.image);
    }
  });

  return serializePdf(objects);
}

export function getSubmissionPdfFilename(detail: AdminSubmissionDetailView) {
  return `${detail.edit.publicId}.pdf`;
}

function drawReport(detail: AdminSubmissionDetailView, assets: PdfAssets) {
  const pages: PdfPage[] = [createPage()];
  let page = pages[0];

  const ensureSpace = (height: number) => {
    if (page.y - height >= MARGIN_BOTTOM) {
      return page;
    }

    page = createPage();
    pages.push(page);
    return page;
  };

  drawHeader(page, detail, assets.logo);

  page = drawSection(ensureSpace, {
    fields: detail.summary,
    title: detail.summaryTitle,
  });

  detail.detailSections.forEach((section) => {
    page = drawSection(ensureSpace, section);
  });

  page = drawSection(ensureSpace, {
    fields: mediaFields(detail.media, "No photos or videos uploaded."),
    title: detail.mediaTitle,
  });

  page = drawSection(ensureSpace, {
    fields: [
      ...mediaFields(detail.licenses, "No license photos uploaded."),
      detail.payment,
      ["Guest signature", detail.signature.url ? "Captured" : "Not provided"],
    ],
    title: detail.verificationTitle,
  });

  page = drawSection(ensureSpace, {
    fields: notesFields(detail),
    title: detail.notesTitle,
  });

  if (assets.resources.length) {
    page = drawImageGridSection(ensureSpace, "Photo appendix", assets.resources);
  }

  return pages;
}

function drawHeader(page: PdfPage, detail: AdminSubmissionDetailView, logo: PdfLogo | null) {
  if (logo?.kind === "image") {
    const logoWidth = 82;
    const logoHeight = Math.round((logo.image.height / logo.image.width) * logoWidth);
    const logoX = MARGIN_X;
    const logoY = page.y - logoHeight - 4;

    page.commands.push(drawImage("Logo", logoX, logoY, logoWidth, logoHeight));
  }

  if (logo?.kind === "svg") {
    page.commands.push(drawSvgLogo(logo, MARGIN_X, page.y - 32, 168));
  }

  page.commands.push(
    drawText({
      color: "primary",
      font: "bold",
      size: 22,
      text: "Submission Report",
      x: PAGE_WIDTH - MARGIN_X - 190,
      y: page.y - 18,
    }),
  );

  page.y -= 86;
}

function drawSection(ensureSpace: (height: number) => PdfPage, section: PdfSection) {
  const columnWidth = (CONTENT_WIDTH - COLUMN_GAP) / 2;
  const rows = Math.ceil(section.fields.length / 2);
  const estimatedHeight = 40 + rows * 43;
  const page = ensureSpace(estimatedHeight);

  page.commands.push(drawText({
    color: "leather",
    font: "bold",
    size: 12,
    text: section.title.toUpperCase(),
    x: MARGIN_X,
    y: page.y,
  }));
  page.y -= 12;
  page.commands.push(drawRule(page.y, "border"));
  page.y -= 18;

  section.fields.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN_X + column * (columnWidth + COLUMN_GAP);
    const y = page.y - row * 43;

    page.commands.push(drawText({
      color: "muted",
      font: "bold",
      size: 7.5,
      text: label.toUpperCase(),
      x,
      y,
    }));

    wrapText(value || "Not provided", 9.5, columnWidth).slice(0, 2).forEach((line, lineIndex) => {
      page.commands.push(drawText({
        color: "primary",
        size: 9.5,
        text: line,
        x,
        y: y - 14 - lineIndex * 12,
      }));
    });
  });

  page.y -= rows * 43 + 18;
  return page;
}

function drawImageGridSection(
  ensureSpace: (height: number) => PdfPage,
  title: string,
  images: PdfVisualImage[],
) {
  const imageGap = 18;
  const imageWidth = (CONTENT_WIDTH - imageGap) / 2;
  const imageHeight = 150;
  const captionHeight = 18;
  let page = ensureSpace(42);

  page.commands.push(drawText({
    color: "leather",
    font: "bold",
    size: 12,
    text: title.toUpperCase(),
    x: MARGIN_X,
    y: page.y,
  }));
  page.y -= 12;
  page.commands.push(drawRule(page.y, "border"));
  page.y -= 20;

  images.forEach((item, index) => {
    const column = index % 2;

    if (column === 0) {
      page = ensureSpace(imageHeight + captionHeight + 28);
    }

    const x = MARGIN_X + column * (imageWidth + imageGap);
    const imageBoxY = page.y - imageHeight;
    const drawSize = fitImage(item.image, imageWidth, imageHeight);
    const imageX = x + (imageWidth - drawSize.width) / 2;
    const imageY = imageBoxY + (imageHeight - drawSize.height) / 2;

    page.commands.push(drawImageFrame(x, imageBoxY, imageWidth, imageHeight));
    page.commands.push(drawImage(item.name, imageX, imageY, drawSize.width, drawSize.height));
    page.commands.push(drawText({
      color: "muted",
      font: "bold",
      size: 8,
      text: item.label,
      x,
      y: imageBoxY - 12,
    }));

    if (column === 1 || index === images.length - 1) {
      page.y -= imageHeight + captionHeight + 22;
    }
  });

  return page;
}

function createPage(): PdfPage {
  return {
    commands: [
      `${COLORS.white} rg`,
      `0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re`,
      "f",
    ],
    y: PAGE_HEIGHT - MARGIN_TOP,
  };
}

function getImageResourceDictionary({
  logoImageObjectId,
  resources,
}: {
  logoImageObjectId: number | null;
  resources: PdfImageResource[];
}) {
  const entries = [
    ...(logoImageObjectId ? [`/Logo ${logoImageObjectId} 0 R`] : []),
    ...resources.map((resource) => `/${resource.name} ${resource.objectId} 0 R`),
  ];

  return entries.length ? ` /XObject << ${entries.join(" ")} >>` : "";
}

function mediaFields(items: AdminSubmissionMediaView[], emptyText: string) {
  if (!items.length) {
    return [["Files", emptyText] satisfies [string, string]];
  }

  return items.map((item) => [
    item.label,
    [item.kind, item.mimeType, item.sizeLabel, item.url ? "Uploaded" : "Unavailable"]
      .filter(Boolean)
      .join(" / "),
  ] satisfies [string, string]);
}

function notesFields(detail: AdminSubmissionDetailView) {
  if (!detail.notes.length) {
    return [["Notes", "No additional notes recorded."] satisfies [string, string]];
  }

  return detail.notes.map((note, index) => [
    `Note ${index + 1}`,
    `${note.body} (${note.createdAt})`,
  ] satisfies [string, string]);
}

async function loadSubmissionImages(detail: AdminSubmissionDetailView) {
  const imageItems = [
    ...detail.media.filter((item) => item.kind === "photo"),
    ...detail.licenses,
    ...(detail.signature.url
      ? [{
          kind: "signature" as const,
          label: detail.signature.label,
          mimeType: "image/png",
          sizeLabel: null,
          url: detail.signature.url,
        }]
      : []),
  ];
  const loadedImages = await Promise.all(
    imageItems.map(async (item, index) => {
      const image = await loadVisualImage(item.url, item.kind === "signature");

      if (!image) {
        return null;
      }

      return {
        image,
        label: item.label,
        name: `Image${index + 1}`,
      } satisfies PdfVisualImage;
    }),
  );

  return loadedImages.filter((item): item is PdfVisualImage => Boolean(item));
}

async function loadVisualImage(url: string | null, isSignature: boolean) {
  if (!url) {
    return null;
  }

  try {
    const buffer = url.startsWith("data:") ? bufferFromDataUrl(url) : await fetchImageBuffer(url);
    const normalizedBuffer = await sharp(buffer, { limitInputPixels: 32_000_000 })
      .rotate()
      .resize({
        fit: "inside",
        height: isSignature ? 600 : 1400,
        withoutEnlargement: true,
        width: isSignature ? 1200 : 1400,
      })
      .flatten({ background: isSignature ? "#111111" : "#ffffff" })
      .jpeg({ mozjpeg: true, quality: isSignature ? 92 : 82 })
      .toBuffer();

    return parseJpeg(normalizedBuffer);
  } catch {
    return null;
  }
}

async function fetchImageBuffer(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Image request failed with ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function bufferFromDataUrl(url: string) {
  const match = url.match(/^data:([^;,]+)?(;base64)?,(.*)$/);

  if (!match) {
    throw new Error("Invalid data URL.");
  }

  return Buffer.from(match[3], match[2] ? "base64" : "utf8");
}

function loadLogo(): PdfLogo | null {
  const svgLogo = loadSvgLogo();

  if (svgLogo) {
    return svgLogo;
  }

  const image = loadLogoImage();
  return image ? { image, kind: "image" } : null;
}

function loadSvgLogo(): PdfLogo | null {
  const logoPath = join(process.cwd(), "public", "logo-dark.svg");

  if (!existsSync(logoPath)) {
    return null;
  }

  const svg = readFileSync(logoPath, "utf8");
  const viewBoxMatch = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const paths = Array.from(svg.matchAll(/<path[^>]* d="([^"]+)"/g)).map((match) => match[1]);

  if (!viewBoxMatch || !paths.length) {
    return null;
  }

  return {
    height: Number(viewBoxMatch[2]),
    kind: "svg",
    paths,
    width: Number(viewBoxMatch[1]),
  };
}

function loadLogoImage() {
  const logoPath = join(process.cwd(), "public", "ee logo small.png");

  if (!existsSync(logoPath)) {
    return null;
  }

  try {
    return parsePngRgba(readFileSync(logoPath));
  } catch {
    return null;
  }
}

function drawSvgLogo(logo: Extract<PdfLogo, { kind: "svg" }>, x: number, y: number, width: number) {
  const scale = width / logo.width;
  const height = logo.height * scale;

  return [
    "q",
    `${COLORS.primary} rg`,
    `${scale} 0 0 ${scale} ${x} ${y + height} cm`,
    "1 0 0 -1 0 0 cm",
    ...logo.paths.map(svgPathToPdfPath),
    "Q",
  ].join("\n");
}

function svgPathToPdfPath(path: string) {
  const tokens = path.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const commands: string[] = [];
  let index = 0;
  let command = "";

  while (index < tokens.length) {
    if (isSvgCommand(tokens[index])) {
      command = tokens[index];
      index += 1;
    }

    if (command === "M" || command === "L") {
      while (index + 1 < tokens.length && !isSvgCommand(tokens[index])) {
        const x = Number(tokens[index]);
        const y = Number(tokens[index + 1]);
        commands.push(`${formatNumber(x)} ${formatNumber(y)} ${command === "M" ? "m" : "l"}`);
        index += 2;
      }
      continue;
    }

    if (command === "C") {
      while (index + 5 < tokens.length && !isSvgCommand(tokens[index])) {
        const values = tokens.slice(index, index + 6).map(Number).map(formatNumber);
        commands.push(`${values.join(" ")} c`);
        index += 6;
      }
      continue;
    }

    if (command === "Z") {
      commands.push("h");
      command = "";
      continue;
    }

    index += 1;
  }

  commands.push("f");
  return commands.join("\n");
}

function isSvgCommand(value: string | undefined) {
  return value === "M" || value === "L" || value === "C" || value === "Z";
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(4)).toString() : "0";
}

function parsePngRgba(buffer: Buffer): PdfImage {
  const signature = buffer.subarray(0, 8).toString("hex");

  if (signature !== "89504e470d0a1a0a") {
    throw new Error("Invalid PNG signature.");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks: Buffer[] = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    if (type === "IHDR") {
      width = buffer.readUInt32BE(dataStart);
      height = buffer.readUInt32BE(dataStart + 4);
      bitDepth = buffer[dataStart + 8];
      colorType = buffer[dataStart + 9];
    }

    if (type === "IDAT") {
      idatChunks.push(buffer.subarray(dataStart, dataEnd));
    }

    offset = dataEnd + 4;
  }

  if (!width || !height || bitDepth !== 8 || colorType !== 6) {
    throw new Error("Only non-interlaced 8-bit RGBA PNG logos are supported.");
  }

  const raw = inflateSync(Buffer.concat(idatChunks));
  const stride = width * 4;
  const rgba = Buffer.alloc(width * height * 4);
  let inputOffset = 0;
  let outputOffset = 0;
  let previousRow = Buffer.alloc(stride);

  for (let row = 0; row < height; row += 1) {
    const filter = raw[inputOffset];
    inputOffset += 1;
    const currentRow = Buffer.from(raw.subarray(inputOffset, inputOffset + stride));
    inputOffset += stride;
    unfilterRow(currentRow, previousRow, filter, 4);
    currentRow.copy(rgba, outputOffset);
    outputOffset += stride;
    previousRow = currentRow;
  }

  const rgb = Buffer.alloc(width * height * 3);
  const alpha = Buffer.alloc(width * height);

  for (let i = 0, rgbIndex = 0, alphaIndex = 0; i < rgba.length; i += 4) {
    rgb[rgbIndex] = rgba[i];
    rgb[rgbIndex + 1] = rgba[i + 1];
    rgb[rgbIndex + 2] = rgba[i + 2];
    alpha[alphaIndex] = rgba[i + 3];
    rgbIndex += 3;
    alphaIndex += 1;
  }

  return { alpha, format: "png", height, rgb, width };
}

function parseJpeg(buffer: Buffer): PdfImage {
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const length = buffer.readUInt16BE(offset);

    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf
    ) {
      return {
        data: buffer,
        format: "jpeg",
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += length;
  }

  throw new Error("Unable to read JPEG dimensions.");
}

function unfilterRow(row: Buffer, previousRow: Buffer, filter: number, bytesPerPixel: number) {
  for (let i = 0; i < row.length; i += 1) {
    const left = i >= bytesPerPixel ? row[i - bytesPerPixel] : 0;
    const up = previousRow[i] ?? 0;
    const upLeft = i >= bytesPerPixel ? previousRow[i - bytesPerPixel] ?? 0 : 0;

    if (filter === 1) {
      row[i] = (row[i] + left) & 255;
    } else if (filter === 2) {
      row[i] = (row[i] + up) & 255;
    } else if (filter === 3) {
      row[i] = (row[i] + Math.floor((left + up) / 2)) & 255;
    } else if (filter === 4) {
      row[i] = (row[i] + paethPredictor(left, up, upLeft)) & 255;
    }
  }
}

function paethPredictor(left: number, up: number, upLeft: number) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);

  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) {
    return left;
  }

  if (upDistance <= upLeftDistance) {
    return up;
  }

  return upLeft;
}

function createImageObject(image: PdfImage, maskObjectId?: number) {
  if (image.format === "jpeg") {
    return createStreamWithDictionary(image.data, [
      "/Type /XObject",
      "/Subtype /Image",
      `/Width ${image.width}`,
      `/Height ${image.height}`,
      "/ColorSpace /DeviceRGB",
      "/BitsPerComponent 8",
      "/Filter /DCTDecode",
    ]);
  }

  const data = deflateSync(image.rgb);
  return createStreamWithDictionary(data, [
    "/Type /XObject",
    "/Subtype /Image",
    `/Width ${image.width}`,
    `/Height ${image.height}`,
    "/ColorSpace /DeviceRGB",
    "/BitsPerComponent 8",
    "/Filter /FlateDecode",
    ...(maskObjectId ? [`/SMask ${maskObjectId} 0 R`] : []),
  ]);
}

function createImageMaskObject(image: PdfImage) {
  if (image.format !== "png") {
    throw new Error("Only PNG images can provide an alpha mask.");
  }

  const data = deflateSync(image.alpha);
  return createStreamWithDictionary(data, [
    "/Type /XObject",
    "/Subtype /Image",
    `/Width ${image.width}`,
    `/Height ${image.height}`,
    "/ColorSpace /DeviceGray",
    "/BitsPerComponent 8",
    "/Filter /FlateDecode",
  ]);
}

function drawImage(name: string, x: number, y: number, width: number, height: number) {
  return [
    "q",
    `${width} 0 0 ${height} ${x} ${y} cm`,
    `/${name} Do`,
    "Q",
  ].join("\n");
}

function drawImageFrame(x: number, y: number, width: number, height: number) {
  return [
    `${COLORS.soft} rg`,
    `${x} ${y} ${width} ${height} re`,
    "f",
    `${COLORS.border} RG`,
    "0.75 w",
    `${x} ${y} ${width} ${height} re`,
    "S",
  ].join("\n");
}

function fitImage(image: PdfImage, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);

  return {
    height: image.height * ratio,
    width: image.width * ratio,
  };
}

function drawRule(y: number, color: "border" | "leather" = "leather") {
  return [
    `${COLORS[color]} RG`,
    "0.75 w",
    `${MARGIN_X} ${y} m`,
    `${PAGE_WIDTH - MARGIN_X} ${y} l`,
    "S",
  ].join("\n");
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

    current = word;
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function measureText(text: string, size: number) {
  return text.length * size * 0.5;
}

function drawText({
  color,
  font = "regular",
  size,
  text,
  x,
  y,
}: {
  color: keyof typeof COLORS;
  font?: "bold" | "regular";
  size: number;
  text: string;
  x: number;
  y: number;
}) {
  return [
    `${COLORS[color]} rg`,
    "BT",
    `/${font === "bold" ? "F2" : "F1"} ${size} Tf`,
    `${x} ${y} Td`,
    `(${escapePdfText(text)}) Tj`,
    "ET",
  ].join("\n");
}

function createStream(content: string) {
  const length = Buffer.byteLength(content, "utf8");
  return `<< /Length ${length} >>\nstream\n${content}\nendstream`;
}

function createStreamWithDictionary(content: Buffer, entries: string[]) {
  return `<< ${entries.join(" ")} /Length ${content.byteLength} >>\nstream\n${content.toString("binary")}\nendstream`;
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
  let offset = Buffer.byteLength(header, "binary");
  const offsets = [0];
  const body = objects
    .map((object, index) => {
      offsets.push(offset);
      const chunk = `${index + 1} 0 obj\n${object}\nendobj\n`;
      offset += Buffer.byteLength(chunk, "binary");
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

  return Buffer.from(`${header}${body}${xref}${trailer}`, "binary");
}
