import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) {
        let val = m[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        process.env[m[1]] = val;
      }
    }
  } catch (e) {}
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function test() {
  console.log("🔍 Testando RPC 'exec_sql'...");
  const { data, error } = await supabase.rpc("exec_sql", { sql: "SELECT 1" });
  if (error) {
    console.error("❌ Erro ao chamar exec_sql:", error.message);
  } else {
    console.log("✅ exec_sql está disponível. Resultado:", data);
  }
  process.exit(0);
}

test();
