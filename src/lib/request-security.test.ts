import { describe, expect, it } from "vitest";
import { getSafeReturnUrl, isSameOriginRequest } from "@/lib/request-security";

describe("request security", () => {
  it("accepts only an exact request origin", () => {
    const sameOrigin = new Request("https://portal.example.com/api/action", {
      headers: { origin: "https://portal.example.com" },
    });
    const crossOrigin = new Request("https://portal.example.com/api/action", {
      headers: { origin: "https://attacker.example.com" },
    });

    expect(isSameOriginRequest(sameOrigin)).toBe(true);
    expect(isSameOriginRequest(crossOrigin)).toBe(false);
    expect(isSameOriginRequest(new Request("https://portal.example.com/api/action"))).toBe(false);
  });

  it("returns a same-origin referer including its query string", () => {
    const request = new Request("https://portal.example.com/api/action", {
      headers: { referer: "https://portal.example.com/driver/delivery?step=media" },
    });

    expect(getSafeReturnUrl(request, "/driver/dashboard").href).toBe(
      "https://portal.example.com/driver/delivery?step=media",
    );
  });

  it("falls back locally for cross-origin or invalid referers", () => {
    const crossOrigin = new Request("https://portal.example.com/api/action", {
      headers: { referer: "https://attacker.example.com/phish" },
    });
    const invalid = new Request("https://portal.example.com/api/action", {
      headers: { referer: "not a URL" },
    });

    expect(getSafeReturnUrl(crossOrigin, "/driver/dashboard").href).toBe(
      "https://portal.example.com/driver/dashboard",
    );
    expect(getSafeReturnUrl(invalid, "/driver/dashboard").href).toBe(
      "https://portal.example.com/driver/dashboard",
    );
  });
});
