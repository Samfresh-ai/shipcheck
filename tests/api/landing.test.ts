import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/route";

const originalSeedReportId = process.env.SEED_REPORT_ID;
const originalNovusKey = process.env.NEXT_PUBLIC_NOVUS_API_KEY;

function restoreEnv(name: "SEED_REPORT_ID" | "NEXT_PUBLIC_NOVUS_API_KEY", value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

describe("GET /", () => {
  afterEach(() => {
    restoreEnv("SEED_REPORT_ID", originalSeedReportId);
    restoreEnv("NEXT_PUBLIC_NOVUS_API_KEY", originalNovusKey);
  });

  it("does not allow deployment env values to break out of href or script contexts", async () => {
    process.env.SEED_REPORT_ID = `"><script>window.__hrefXss=1</script><a href="`;
    process.env.NEXT_PUBLIC_NOVUS_API_KEY = `abc</script><script>window.__scriptXss=1</script>`;

    const response = GET();
    const html = await response.text();

    expect(html).toContain(`href="/report/%22%3E%3Cscript%3Ewindow.__hrefXss%3D1%3C%2Fscript%3E%3Ca%20href%3D%22"`);
    expect(html).toContain(`"abc\\u003C/script\\u003E\\u003Cscript\\u003Ewindow.__scriptXss=1\\u003C/script\\u003E"`);
    expect(html).not.toContain(`href="/report/"><script>`);
    expect(html).not.toContain(`</script><script>window.__scriptXss=1</script>`);
  });
});
