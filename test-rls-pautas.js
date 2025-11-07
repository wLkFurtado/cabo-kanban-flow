// Script para testar RLS das tabelas de Pautas e verificar ausência de recursão
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ankliiywmcpncymdlvaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testRlsPautas() {
  console.log('🔎 Testando RLS de pautas_events e pautas_participants...');
  try {
    // Teste simples de SELECT em pautas_events
    const { data: eventos, error: eventosErr } = await supabase
      .from('pautas_events')
      .select('*')
      .limit(3);

    if (eventosErr) {
      console.error('❌ Erro em SELECT pautas_events:', eventosErr);
    } else {
      console.log('✅ SELECT pautas_events executado sem erro. Linhas:', eventos?.length ?? 0);
    }

    // Teste simples de SELECT em pautas_participants
    const { data: participantes, error: partErr } = await supabase
      .from('pautas_participants')
      .select('*')
      .limit(3);

    if (partErr) {
      console.error('❌ Erro em SELECT pautas_participants:', partErr);
    } else {
      console.log('✅ SELECT pautas_participants executado sem erro. Linhas:', participantes?.length ?? 0);
    }

    console.log('\n🎉 Teste de RLS de Pautas concluído. Se não houver erros acima, a recursão foi resolvida.');
  } catch (e) {
    console.error('💥 Erro geral no teste RLS:', e);
  }
}

testRlsPautas();