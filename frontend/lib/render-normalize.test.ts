import { describe, expect, it } from "vitest";
import { normalizeMarkup } from "./render-normalize";

describe("normalizeMarkup", () => {
  it("removes inline handler attributes", () => {
    const out = normalizeMarkup(`<img src="x.png" onerror="boom()">`);
    expect(out).toBe(`<img src="x.png">`);
  });

  it("leaves ordinary tags alone", () => {
    const s = `<p><strong>ok</strong></p>`;
    expect(normalizeMarkup(s)).toBe(s);
  });
});
