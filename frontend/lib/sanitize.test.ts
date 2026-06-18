import { describe, it, expect } from "vitest";
import { sanitizeRich, safeHref, mergePrefs } from "./sanitize";

describe("sanitizeRich", () => {
  it("drops script and event handlers", () => {
    const out = sanitizeRich(`<b>hi</b><script>alert(1)</script><img src=x onerror="boom()">`);
    expect(out).not.toContain("<script");
    expect(out).not.toContain("onerror");
    expect(out).toContain("<b>hi</b>");
  });

  it("keeps allowlisted inline markup", () => {
    expect(sanitizeRich("<strong>x</strong>")).toContain("<strong>x</strong>");
  });
});

describe("safeHref", () => {
  it("passes http(s)/mailto/relative", () => {
    expect(safeHref("https://example.com")).toBe("https://example.com");
    expect(safeHref("/u/3")).toBe("/u/3");
    expect(safeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
  });
  it("neutralises dangerous targets", () => {
    expect(safeHref("javascript:alert(1)")).toBe("#");
    expect(safeHref("data:text/html,<script>1</script>")).toBe("#");
    expect(safeHref("//evil.com")).toBe("#");
  });
});

describe("mergePrefs", () => {
  it("ignores prototype-walking keys", () => {
    const before = ({} as Record<string, unknown>).polluted;
    mergePrefs({ theme: "light" }, JSON.parse('{"__proto__":{"polluted":"yes"}}'));
    expect(({} as Record<string, unknown>).polluted).toBe(before);
  });
  it("merges plain own keys", () => {
    expect(mergePrefs({ theme: "light" }, { theme: "dark" })).toEqual({ theme: "dark" });
  });
});
