// Script: cria a tabela public.card_activities via RPC exec_sql
// Uso: node create-card-activities.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
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
    // ignore if .env missing
  }
}

loadEnv();

// Fallback para o projeto atual caso .env não esteja disponível no ambiente de execução
const FALLBACK_URL = 'https://ankliiywmcpncymdlvaa.supabase.co';
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

let url = process.env.VITE_SUPABASE_URL;
let anon = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.warn('⚠️ Variáveis VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes; usando credenciais padrão do projeto.');
  url = FALLBACK_URL;
  anon = FALLBACK_ANON;
}

const supabase = createClient(url, anon);

const migrationSQL = `
BEGIN;

-- Tabela de atividades de cards
CREATE TABLE IF NOT EXISTS public.card_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  type text NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.card_activities ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para usuários autenticados com acesso ao board
CREATE POLICY card_activities_select ON public.card_activities
  FOR SELECT
  TO authenticated
  USING (public.user_has_board_access(board_id));

-- Permitir inserção por usuários autenticados com acesso ao board e autor igual ao usuário
CREATE POLICY card_activities_insert ON public.card_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_board_access(board_id) AND user_id = auth.uid());

-- Índices úteis
CREATE INDEX IF NOT EXISTS card_activities_card_id_idx ON public.card_activities(card_id);
CREATE INDEX IF NOT EXISTS card_activities_board_id_idx ON public.card_activities(board_id);
CREATE INDEX IF NOT EXISTS card_activities_created_at_idx ON public.card_activities(created_at DESC);

COMMIT;`;

async function tableExists() {
  const { data, error } = await supabase
    .from('card_activities')
    .select('id')
    .limit(1);
  if (error) {
    // 42P01: relação inexistente
    return !(error.code === '42P01' || /relation .* does not exist/i.test(error.message));
  }
  return true;
}

async function applyMigration() {
  console.log('🛠️ Aplicando criação da tabela public.card_activities...');
  const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
  if (!error) {
    console.log('✅ Migração aplicada com sucesso (exec_sql).');
    return true;
  }
  console.log('⚠️ Falha ao aplicar migração em bloco:', error.message || error);
  console.log('🔄 Tentando aplicar instruções individualmente...');
  const statements = migrationSQL
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !/^BEGIN$/i.test(s) && !/^COMMIT$/i.test(s));

  for (const stmt of statements) {
    const sql = stmt + ';';
    console.log('➡️ Executando:', sql.split('\n')[0] + ' ...');
    const { error: e } = await supabase.rpc('exec_sql', { sql });
    if (e) {
      console.log('❌ Erro nesta instrução:', e.message || e);
      return false;
    }
  }
  console.log('✅ Todas as instruções individuais aplicadas com sucesso.');
  return true;
}

async function main() {
  // Verificar existência
  console.log('🔍 Verificando se a tabela card_activities já existe...');
  const exists = await tableExists();
  if (exists) {
    console.log('✅ Tabela card_activities já existe e está acessível.');
    return;
  }

  // Aplicar migração
  const ok = await applyMigration();
  if (!ok) {
    console.log('\n📝 INSTRUÇÕES MANUAIS (caso exec_sql não esteja disponível):');
    console.log('1. Abra o Supabase Dashboard do projeto');
    console.log('2. Vá em "SQL Editor"');
    console.log('3. Cole o conteúdo do arquivo supabase/migrations/20251102140000_create_card_activities.sql');
    console.log('4. Execute o SQL e volte aqui para validar.');
    process.exit(1);
  }

  // Validar novamente
  console.log('\n🔍 Validando acesso à tabela criada...');
  const { data, error } = await supabase
    .from('card_activities')
    .select('id')
    .limit(1);
  if (error) {
    console.error('❌ Ainda não foi possível acessar a tabela:', error.message || error);
    process.exit(1);
  }
  console.log('✅ Tabela card_activities acessível. Correção aplicada.');
}

main().catch((e) => {
  console.error('❌ Erro inesperado:', e);
  process.exit(1);
});