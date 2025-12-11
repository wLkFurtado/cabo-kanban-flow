// Script para testar conexão com Supabase e verificar dados
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ankliiywmcpncymdlvaa.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testDatabase() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Verificar autenticação
    console.log('\n🔐 Verificando autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Erro de autenticação:', authError);
    } else if (!user) {
      console.log('⚠️ Usuário não autenticado');
    } else {
      console.log('✅ Usuário autenticado:', user.id);
    }
    
    // Verificar se há usuários registrados (sem RLS)
    console.log('\n👥 Verificando profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.log('❌ Erro ao buscar profiles:', profilesError);
    } else {
      console.log('✅ Profiles encontrados:', profiles?.length || 0);
      if (profiles && profiles.length > 0) {
        console.log('📧 Emails dos usuários:', profiles.map(p => p.email || 'sem email'));
        console.log('🆔 IDs dos usuários:', profiles.map(p => p.id).join(', '));
        console.log('📋 Dados completos dos profiles:', JSON.stringify(profiles, null, 2));
      }
    }
    
    // Verificar boards
    console.log('\n📋 Verificando boards...');
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('*')
      .limit(5);
    
    if (boardsError) {
      console.log('❌ Erro ao buscar boards:', boardsError);
    } else {
      console.log('✅ Boards encontrados:', boards?.length || 0);
      if (boards && boards.length > 0) {
        console.log('📋 Primeiro board:', boards[0]);
      }
    }

    // Verificar listas
    console.log('\n📝 Verificando listas...');
    const { data: lists, error: listsError } = await supabase
      .from('board_lists')
      .select('*')
      .limit(5);
    
    if (listsError) {
      console.log('❌ Erro ao buscar listas:', listsError);
    } else {
      console.log('✅ Listas encontradas:', lists?.length || 0);
      if (lists && lists.length > 0) {
        console.log('📝 Primeira lista:', lists[0]);
      }
    }

    // Verificar cards
    console.log('\n🃏 Verificando cards...');
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .limit(5);
    
    if (cardsError) {
      console.log('❌ Erro ao buscar cards:', cardsError);
    } else {
      console.log('✅ Cards encontrados:', cards?.length || 0);
      if (cards && cards.length > 0) {
        console.log('🃏 Primeiro card:', cards[0]);
        
        // Testar UPDATE em um card
        console.log('\n💾 Testando UPDATE no primeiro card...');
        const { data: updateResult, error: updateError } = await supabase
          .from('cards')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('id', cards[0].id)
          .select();
        
        if (updateError) {
          console.log('❌ Erro no UPDATE:', updateError);
        } else {
          console.log('✅ UPDATE realizado com sucesso:', updateResult);
        }
      }
    }

  } catch (error) {
    console.log('❌ Erro geral:', error);
  }
}

testDatabase();