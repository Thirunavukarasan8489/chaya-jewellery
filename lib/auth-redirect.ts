/** Shared by login forms and the server callback; never follow external URLs. */
export function getSafeCallbackUrl(value?: string | null): string {
  const fallback = "/cart";
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }

  try {
    const url = new URL(value, "https://callback.invalid");
    if (
      url.origin !== "https://callback.invalid" ||
      url.pathname.startsWith("//")
    ) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
