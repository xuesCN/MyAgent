const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export const ALLOWED_MARKDOWN_ELEMENTS = [
  "a",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
] as const;

const MAX_URL_LENGTH = 2048;

function normalizeUrl(url: string): string {
  return url
    .trim()
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      return !((code <= 31) || (code >= 127 && code <= 159) || /\s/.test(char));
    })
    .join("");
}

export function sanitizeUserUrl(url: string | null | undefined): string {
  if (!url) return "";

  const normalized = normalizeUrl(url);
  if (!normalized || normalized.length > MAX_URL_LENGTH) return "";

  if (normalized.startsWith("#")) return normalized;

  try {
    const parsed = new URL(normalized, "https://sanitizer.local");

    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return "";
    }

    const isRelative = !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(normalized);
    return isRelative ? normalized : parsed.toString();
  } catch {
    return "";
  }
}

export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  const sanitized = sanitizeUserUrl(url);
  if (!sanitized) return false;

  try {
    const parsed = new URL(sanitized, "https://sanitizer.local");
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
