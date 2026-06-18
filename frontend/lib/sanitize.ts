import DOMPurify from "isomorphic-dompurify";

const RICH_ALLOWED_TAGS = ["b", "i", "em", "strong", "a", "code", "span", "br"];
const RICH_ALLOWED_ATTR = ["href", "title", "class"];

export function sanitizeRich(html: string): string {
  return DOMPurify.sanitize(html ?? "", {
    ALLOWED_TAGS: RICH_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_ALLOWED_ATTR,
    FORBID_ATTR: ["style", "srcdoc"],
    ALLOW_DATA_ATTR: false,
  });
}

// Feed rendering: keep the same formatting tags the backend allows, but drop
// iframes/embeds and srcdoc so a stored post can't run script in a reader's
// browser. The /tv kiosk intentionally uses a looser path (render-normalize).
const FEED_ALLOWED_TAGS = [
  "p", "br", "b", "i", "em", "strong", "a", "code", "pre", "blockquote",
  "ul", "ol", "li", "img", "span", "h1", "h2", "h3",
];
const FEED_ALLOWED_ATTR = ["href", "title", "src", "alt", "class", "width", "height"];

export function sanitizeFeed(html: string): string {
  return DOMPurify.sanitize(html ?? "", {
    ALLOWED_TAGS: FEED_ALLOWED_TAGS,
    ALLOWED_ATTR: FEED_ALLOWED_ATTR,
    FORBID_TAGS: ["iframe", "script", "object", "embed", "style", "form"],
    FORBID_ATTR: ["srcdoc", "sandbox", "style"],
    ALLOW_DATA_ATTR: false,
  });
}

const SAFE_PROTOCOLS = ["http:", "https:", "mailto:"];

export function safeHref(raw: string): string {
  const value = (raw ?? "").trim();
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  try {
    const parsed = new URL(value, "https://grimoire.invalid/");
    if (SAFE_PROTOCOLS.includes(parsed.protocol) && !value.startsWith("//")) {
      return value;
    }
  } catch {
    /* fall through */
  }
  return "#";
}

const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function mergePrefs<T extends Record<string, unknown>>(
  defaults: T,
  patch: Record<string, unknown>
): T {
  const out: Record<string, unknown> = { ...defaults };
  for (const key of Object.keys(patch)) {
    if (BLOCKED_KEYS.has(key)) continue;
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    out[key] = patch[key];
  }
  return out as T;
}
