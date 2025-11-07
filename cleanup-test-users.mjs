import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista de emails de teste que foram criados
const testEmails = [
  'test-user-1@example.com',
  'test-user-2@example.com', 
  'test-user-3@example.com',
  'test-user-4@example.com',
  'test-user-5@example.com',
  'test-user-6@example.com',
  'test-user-7@example.com',
  'test-user-8@example.com',
  'test-user-9@example.com',
  'test-user-10@example.com',
  'test-user-11@example.com',
  'test-user-12@example.com',
  'test-user-13@example.com',
  'test-user-14@example.com',
  'test-user-15@example.com',
  'test-user-16@example.com',
  'test-user-17@example.com',
  'test-user-18@example.com',
  'test-user-19@example.com',
  'test-user-20@example.com',
  'test-user-21@example.com',
  'test-user-22@example.com',
  'test-user-23@example.com',
  'test-user-24@example.com',
  'test-user-25@example.com',
  'test-user-26@example.com',
  'test-user-27@example.com',
  'test-user-28@example.com',
  'test-user-29@example.com',
  'test-user-30@example.com',
  'test-user-31@example.com',
  'test-user-32@example.com',
  'test-user-33@example.com',
  'test-user-34@example.com',
  'test-user-35@example.com',
  'test-user-36@example.com',
  'test-user-37@example.com',
  'test-user-38@example.com',
  'test-user-39@example.com',
  'test-user-40@example.com',
  'test-user-41@example.com',
  'test-user-42@example.com',
  'test-user-43@example.com',
  'test-user-44@example.com',
  'test-user-45@example.com',
  'test-user-46@example.com',
  'test-user-47@example.com',
  'test-user-48@example.com',
  'test-user-49@example.com',
  'test-user-50@example.com'
];

async function cleanupTestUsers() {
  console.log('🧹 Iniciando limpeza dos usuários de teste...\n');

  try {
    // 1. Primeiro, vamos verificar quais usuários de teste existem
    console.log('📋 Verificando usuários de teste existentes...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, nome_completo')
      .in('email', testEmails);

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('✅ Nenhum usuário de teste encontrado nos perfis.');
      return;
    }

    console.log(`📊 Encontrados ${profiles.length} usuários de teste:`);
    profiles.forEach(profile => {
      console.log(`   - ${profile.email} (${profile.nome_completo || 'Sem nome'})`);
    });

    // 2. Excluir os perfis
    console.log('\n🗑️  Excluindo perfis de teste...');
    const userIds = profiles.map(p => p.id);
    
    const { error: deleteProfilesError } = await supabase
      .from('profiles')
      .delete()
      .in('id', userIds);

    if (deleteProfilesError) {
      console.error('❌ Erro ao excluir perfis:', deleteProfilesError);
      return;
    }

    console.log(`✅ ${profiles.length} perfis excluídos com sucesso!`);

    // 3. Verificar se ainda existem usuários na tabela auth.users
    console.log('\n🔍 Verificando usuários restantes na autenticação...');
    
    // Nota: Não podemos excluir diretamente da tabela auth.users via API pública
    // Isso precisa ser feito via Dashboard do Supabase ou API de administração
    console.log('⚠️  IMPORTANTE: Os usuários ainda podem existir na tabela auth.users');
    console.log('   Para removê-los completamente, acesse o Supabase Dashboard:');
    console.log('   1. Vá para Authentication > Users');
    console.log('   2. Procure pelos emails de teste');
    console.log('   3. Delete manualmente cada usuário');

    console.log('\n✅ Limpeza dos perfis concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

// Executar a limpeza
cleanupTestUsers();