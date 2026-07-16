export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function getSafeReturnUrl(request: Request, fallbackPath: string) {
  const requestUrl = new URL(request.url);
  const referer = request.headers.get("referer");

  if (referer) {
    try {
      const refererUrl = new URL(referer);

      if (refererUrl.origin === requestUrl.origin) {
        return refererUrl;
      }
    } catch {
      // Use the local fallback below.
    }
  }

  return new URL(fallbackPath, requestUrl);
}
