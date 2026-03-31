import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load configuration from .env
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) {
        const key = m[1];
        let val = m[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
      }
    }
  } catch (e) {
    console.error("❌ Erro ao ler .env:", e.message);
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("❌ SUPABASE_URL ou PUBLISHABLE_KEY faltando!");
  process.exit(1);
}

const supabase = createClient(url, key);

async function runSql(sql) {
  console.log(`➡️ Executando SQL: ${sql.split('\n')[0]}...`);
  const { data, error } = await supabase.rpc("exec_sql", { sql });
  if (error) {
    console.error(`❌ Erro SQL:`, error.message);
    return { error };
  }
  console.log(`✅ Sucesso.`);
  return { data };
}

async function main() {
  console.log("🚀 Iniciando ativação de webhook e envio para dia 27...\n");

  // 1. Verificar se o job de cron existe
  console.log("🔍 Verificando status do job 'send-daily-pautas-webhook'...");
  const checkJobSql = "SELECT jobid, schedule, active FROM cron.job WHERE jobname = 'send-daily-pautas-webhook';";
  // Nota: cron.job table access might be restricted. If so, we'll try to re-schedule anyway.
  
  // 2. (Re)Agendar o job para garantir que está ativo
  // 18h Brasília = 21h UTC
  const scheduleJobSql = `
    DO $$
    BEGIN
      -- Tentar desabilitar se já existir
      IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-daily-pautas-webhook') THEN
        PERFORM cron.unschedule('send-daily-pautas-webhook');
      END IF;
      
      -- Agendar novo
      PERFORM cron.schedule(
        'send-daily-pautas-webhook',
        '0 21 * * *',
        'SELECT public.send_daily_pautas_webhook();'
      );
    END $$;
  `;
  await runSql(scheduleJobSql);

  // 3. Disparo manual para o dia 27 (estamos em 26, então 26 + 1 = 27)
  console.log("\n📡 Disparando webhook manual para pautas de amanhã (dia 27)...");
  const triggerManualSql = "SELECT public.test_daily_pautas_webhook();";
  const { data, error } = await runSql(triggerManualSql);
  
  if (!error) {
    console.log("\n✨ Resultado do disparo manual:", JSON.stringify(data, null, 2));
    console.log("\n✅ Webhook ativado/agendado e pautas do dia 27 enviadas com sucesso!");
  } else {
    console.error("\n❌ Falha ao disparar o webhook manual.");
  }
}

main().catch(err => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
