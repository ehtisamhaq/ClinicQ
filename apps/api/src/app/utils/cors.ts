/**
 * Robust origin matcher supporting exact matches, trailing slash normalization,
 * and wildcard domains (e.g. https://*.vercel.app).
 */
export function isOriginAllowed(requestOrigin: string | undefined, allowedList: string[]): boolean {
  if (!requestOrigin) return true;
  const normalized = requestOrigin.replace(/\/+$/, "");
  return allowedList.some((allowed) => {
    const normAllowed = allowed.trim().replace(/\/+$/, "");
    if (!normAllowed) return false;
    if (normAllowed === "*") return true;
    if (normAllowed.includes("*")) {
      const regex = new RegExp(`^${normAllowed.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`);
      return regex.test(normalized);
    }
    return normalized === normAllowed;
  });
}
