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
    // console.log("Note: error loading .env", e.message);
  }
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL || 'https://ankliiywmcpncymdlvaa.supabase.co';
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const WEBHOOK_URL = "https://webhooks.growave.com.br/webhook/PAUTAS";

const supabase = createClient(url, key);

async function main() {
  console.log("🚀 Iniciando envio manual das pautas do dia 27/03/2026 (com equipe)...\n");

  // Definir o intervalo do dia 27 em Brasília (fuso -3)
  // O Supabase armazena em UTC, mas comparamos usando a string da data para simplificar se possível
  // ou convertendo.
  const targetDate = "2026-03-27";
  
  // Buscar pautas
  console.log(`🔍 Buscando pautas para ${targetDate}...`);
  const { data: pautas, error: pautasError } = await supabase
    .from('pautas_events')
    .select('id, titulo, data_inicio, filmmaker_id, fotografo_id, jornalista_id, rede_id')
    .gte('data_inicio', `${targetDate}T00:00:00-03:00`)
    .lt('data_inicio', `2026-03-28T00:00:00-03:00`)
    .order('data_inicio');

  if (pautasError) {
    console.error("❌ Erro ao buscar pautas:", pautasError.message);
    process.exit(1);
  }

  if (!pautas || pautas.length === 0) {
    console.log("⚠️ Nenhuma pauta encontrada para o dia 27.");
    process.exit(0);
  }

  console.log(`✅ Encontradas ${pautas.length} pautas. Coletando equipe...\n`);

  // Coletar todos os IDs de perfis necessários
  const profileIds = new Set();
  pautas.forEach(p => {
    if (p.filmmaker_id) profileIds.add(p.filmmaker_id);
    if (p.fotografo_id) profileIds.add(p.fotografo_id);
    if (p.jornalista_id) profileIds.add(p.jornalista_id);
    if (p.rede_id) profileIds.add(p.rede_id);
  });

  // Buscar perfis
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .in('id', Array.from(profileIds));

  if (profilesError) {
    console.warn("⚠️ Erro ao buscar perfis (continuando com nomes genéricos):", profilesError.message);
  }

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  // Montar payload final
  const pautasEnviadas = pautas.map(p => {
    const equipe = [];
    
    if (p.filmmaker_id) {
      const prof = profileMap.get(p.filmmaker_id);
      equipe.push({ funcao: "Filmmaker", nome: prof?.full_name || "Não informado", telefone: prof?.phone || null });
    }
    if (p.fotografo_id) {
      const prof = profileMap.get(p.fotografo_id);
      equipe.push({ funcao: "Fotógrafo", nome: prof?.full_name || "Não informado", telefone: prof?.phone || null });
    }
    if (p.jornalista_id) {
      const prof = profileMap.get(p.jornalista_id);
      equipe.push({ funcao: "Jornalista", nome: prof?.full_name || "Não informado", telefone: prof?.phone || null });
    }
    if (p.rede_id) {
      const prof = profileMap.get(p.rede_id);
      equipe.push({ funcao: "Rede", nome: prof?.full_name || "Não informado", telefone: prof?.phone || null });
    }

    return {
      id: p.id,
      nome_pauta: p.titulo || "Evento",
      data: p.data_inicio,
      equipe
    };
  });

  const finalPayload = {
    tipo: "resumo_diario",
    data_pautas: targetDate,
    total: pautasEnviadas.length,
    pautas: pautasEnviadas
  };

  // Enviar para o webhook
  console.log("📡 Enviando payload para Growave...");
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finalPayload)
  });

  const responseText = await response.text();

  if (response.ok) {
    console.log("✅ Webhook enviado com sucesso!");
    console.log("📄 Resposta:", responseText);
    console.log("\nPayload enviado:", JSON.stringify(finalPayload, null, 2));
  } else {
    console.error(`❌ Falha no webhook: ${response.status}`, responseText);
  }
}

main().catch(err => {
  console.error("❌ Erro fatal:", err);
  process.exit(1);
});
