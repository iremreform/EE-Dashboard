import { describe, expect, it } from "vitest";
import {
  getMediaUploadLimitLabel,
  isAllowedMediaMimeType,
  isWithinMediaUploadLimit,
  MEDIA_UPLOAD_LIMITS,
  normalizeMimeType,
} from "@/lib/media-limits";

describe("media upload limits", () => {
  it("accepts positive files at the configured limit", () => {
    expect(isWithinMediaUploadLimit("photo", 1)).toBe(true);
    expect(isWithinMediaUploadLimit("photo", MEDIA_UPLOAD_LIMITS.photo)).toBe(true);
  });

  it("rejects empty, oversized, and fractional byte counts", () => {
    expect(isWithinMediaUploadLimit("video", 0)).toBe(false);
    expect(isWithinMediaUploadLimit("video", MEDIA_UPLOAD_LIMITS.video + 1)).toBe(false);
    expect(isWithinMediaUploadLimit("video", 1.5)).toBe(false);
  });

  it("normalizes MIME parameters before checking the allowlist", () => {
    expect(normalizeMimeType(" IMAGE/JPEG ; charset=binary ")).toBe("image/jpeg");
    expect(isAllowedMediaMimeType("photo", "image/jpeg; charset=binary")).toBe(true);
    expect(isAllowedMediaMimeType("video", "video/quicktime")).toBe(true);
    expect(isAllowedMediaMimeType("photo", "image/svg+xml")).toBe(false);
  });

  it("provides readable limit labels", () => {
    expect(getMediaUploadLimitLabel("photo")).toBe("40 MB");
    expect(getMediaUploadLimitLabel("video")).toBe("450 MB");
  });
});
