// Debug script: Lista atividades de cards diretamente do Supabase
// Uso: node test-card-activities.mjs <CARD_ID opcional>

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

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error('Faltam variáveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY no ambiente/.env');
  process.exit(1);
}

const supabase = createClient(url, anon);

const cardId = process.argv[2];

async function main() {
  const sel = supabase
    .from('card_activities')
    .select('id, board_id, card_id, user_id, type, description, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const { data, error } = cardId ? await sel.eq('card_id', cardId) : await sel;
  if (error) {
    console.error('Erro ao buscar atividades:', error.message || error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log(cardId ? `Nenhuma atividade encontrada para card ${cardId}` : 'Nenhuma atividade encontrada');
    process.exit(0);
  }

  for (const row of data) {
    console.log(
      JSON.stringify(
        {
          id: row.id,
          board_id: row.board_id,
          card_id: row.card_id,
          user_id: row.user_id,
          type: row.type,
          description: row.description,
          created_at: row.created_at,
        },
        null,
        2
      )
    );
  }
}

main().catch((e) => {
  console.error('Falha inesperada:', e);
  process.exit(1);
});