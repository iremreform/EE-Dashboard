"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type DownloadPdfButtonProps = {
  href: string;
  label: string;
};

export function DownloadPdfButton({ href, label }: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(href);

      if (!response.ok) {
        throw new Error(`PDF request failed with ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getFilename(response.headers.get("Content-Disposition")) ?? "submission.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button type="button" disabled={isGenerating} onClick={handleDownload}>
      {isGenerating ? "Generating PDF..." : label}
    </Button>
  );
}

function getFilename(contentDisposition: string | null) {
  const match = contentDisposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? null;
}
