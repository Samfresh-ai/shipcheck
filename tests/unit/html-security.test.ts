import { describe, expect, it } from "vitest";
import { jsonForInlineScript, reportHref } from "@/src/lib/html-security";

describe("html security helpers", () => {
  it("serializes values for inline script contexts without script breakouts", () => {
    const serialized = jsonForInlineScript(`abc</script><script>window.__xss=1</script>&`);

    expect(serialized).toBe(`"abc\\u003C/script\\u003E\\u003Cscript\\u003Ewindow.__xss=1\\u003C/script\\u003E\\u0026"`);
    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<script>");
  });

  it("encodes report ids before using them as href path segments", () => {
    expect(reportHref(`"><script>window.__xss=1</script><a href="`)).toBe(
      `/report/%22%3E%3Cscript%3Ewindow.__xss%3D1%3C%2Fscript%3E%3Ca%20href%3D%22`,
    );
  });
});
