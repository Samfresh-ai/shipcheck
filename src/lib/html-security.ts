const INLINE_SCRIPT_JSON_ESCAPES: Record<string, string> = {
  "<": "\\u003C",
  ">": "\\u003E",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

export function jsonForInlineScript(value: unknown) {
  return (JSON.stringify(value) ?? "null").replace(/[<>&\u2028\u2029]/g, (character) => INLINE_SCRIPT_JSON_ESCAPES[character] ?? character);
}

export function reportHref(reportId: string) {
  return `/report/${encodeURIComponent(reportId)}`;
}
