const mediaExtensionPattern = /\.(avif|gif|jpe?g|mp4|mov|ogg|png|svg|webm|webp)$/i;

export function normalizeMediaUrl(value?: string | null) {
  const url = value?.trim();
  if (!url) return null;

  if (
    url.startsWith("/") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  if (url.startsWith("uploads/") || url.startsWith("brand/")) {
    return `/${url}`;
  }

  if (!url.includes("/") && mediaExtensionPattern.test(url)) {
    return `/uploads/${url}`;
  }

  return url;
}
