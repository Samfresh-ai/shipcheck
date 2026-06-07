import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { SAMPLE_REPORT } from "../src/lib/sample-report";
import { reportToRow } from "../src/lib/report-types";

function loadLocalEnv() {
  if (!existsSync(".env.local")) return;
  const content = readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    process.env[key] ||= value;
  }
}

async function main() {
  loadLocalEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.log(`Supabase env missing. Local sample report id remains ${SAMPLE_REPORT.id}.`);
    return;
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const row = reportToRow({ ...SAMPLE_REPORT, id: process.env.SEED_REPORT_ID || SAMPLE_REPORT.id });

  const { data: existing } = await client.from("reports").select("id").eq("id", row.id).maybeSingle();
  if (existing?.id) {
    console.log(`Sample report already exists: ${existing.id}`);
    return;
  }

  await client.from("sessions").upsert({ id: row.session_id, user_agent: "seed-script" });
  const { data, error } = await client.from("reports").insert(row).select("id").single();
  if (error) throw error;

  console.log(`Seeded sample report: ${data.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
