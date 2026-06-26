const mediaExtensionPattern = /\.(avif|gif|jpe?g|mp4|mov|ogg|png|svg|webm|webp)$/i;
const localHostNames = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function configuredHost() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    return siteUrl ? new URL(siteUrl).hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
}

function localMediaPath(pathname: string, search = "") {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (cleanPath.startsWith("/uploads/")) {
    return `/media/uploads/${cleanPath.slice("/uploads/".length)}${search}`;
  }
  if (cleanPath.startsWith("/brand/")) {
    return `/media/brand/${cleanPath.slice("/brand/".length)}${search}`;
  }
  return null;
}

export function normalizeMediaUrl(value?: string | null) {
  const url = value?.trim().replace(/\\/g, "/").replace(/^\.\//, "");
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      const mediaPath = localMediaPath(parsed.pathname, parsed.search);
      const siteHost = configuredHost();
      const parsedHost = parsed.hostname.replace(/^www\./, "");

      if (mediaPath && (localHostNames.has(parsed.hostname) || Boolean(siteHost && parsedHost === siteHost))) {
        return mediaPath;
      }
    } catch {
      return url;
    }
  }

  if (url.startsWith("/uploads/") || url.startsWith("/brand/")) {
    return localMediaPath(url);
  }

  if (url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  if (url.startsWith("uploads/")) {
    return `/media/${url}`;
  }

  if (url.startsWith("brand/")) {
    return `/media/${url}`;
  }

  if (!url.includes("/") && mediaExtensionPattern.test(url)) {
    return `/media/uploads/${url}`;
  }

  return url;
}
