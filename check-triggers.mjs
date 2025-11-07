import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Ler variáveis de ambiente do arquivo .env
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    envVars.VITE_SUPABASE_URL = line.split('=')[1].replace(/"/g, '');
  }
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
    envVars.VITE_SUPABASE_PUBLISHABLE_KEY = line.split('=')[1].replace(/"/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  console.log('🔍 Verificando triggers e funções automáticas...\n');

  // 1. Verificar se existe uma função handle_new_user
  console.log('1. Procurando por funções relacionadas a novos usuários...');
  
  try {
    // Tentar executar uma query que pode revelar informações sobre triggers
    const { data, error } = await supabase
      .rpc('get_triggers_info')
      .catch(() => ({ data: null, error: { message: 'Função não existe' } }));

    if (error) {
      console.log('   ⚠️  Não foi possível acessar informações de triggers diretamente');
    }
  } catch (e) {
    console.log('   ⚠️  Não foi possível acessar informações de triggers');
  }

  // 2. Verificar se existe algum padrão nos perfis criados automaticamente
  console.log('\n2. Analisando padrões nos perfis existentes...');
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, cargo, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (profilesError) {
    console.error('❌ Erro ao buscar perfis:', profilesError);
    return;
  }

  console.log('   Últimos 10 perfis criados:');
  profiles.forEach((profile, index) => {
    const cargoStatus = profile.cargo ? `"${profile.cargo}"` : 'VAZIO';
    console.log(`   ${index + 1}. ${profile.full_name || profile.email} - Cargo: ${cargoStatus}`);
  });

  // 3. Verificar se há algum padrão temporal
  const profilesWithCargo = profiles.filter(p => p.cargo && p.cargo.trim() !== '');
  const profilesWithoutCargo = profiles.filter(p => !p.cargo || p.cargo.trim() === '');

  console.log(`\n   📊 Estatísticas:`);
  console.log(`   - Perfis com cargo: ${profilesWithCargo.length}`);
  console.log(`   - Perfis sem cargo: ${profilesWithoutCargo.length}`);

  // 4. Verificar se existe alguma função ou trigger específico
  console.log('\n3. Verificando possíveis triggers automáticos...');
  
  // Vamos tentar identificar se há algum padrão nos IDs ou timestamps
  const recentProfiles = profiles.slice(0, 5);
  console.log('   Analisando perfis mais recentes:');
  
  recentProfiles.forEach((profile, index) => {
    const createdDate = new Date(profile.created_at);
    const now = new Date();
    const diffMinutes = Math.round((now - createdDate) / (1000 * 60));
    
    console.log(`   ${index + 1}. ${profile.full_name || profile.email}`);
    console.log(`      - Criado há: ${diffMinutes} minutos`);
    console.log(`      - ID: ${profile.id}`);
    console.log(`      - Cargo: ${profile.cargo ? `"${profile.cargo}"` : 'VAZIO'}`);
  });

  // 5. Tentar identificar se há um trigger baseado em auth.users
  console.log('\n4. Verificando se perfis são criados automaticamente...');
  
  // Vamos verificar se existe algum perfil que foi criado muito rapidamente após o signup
  // (indicando um trigger automático)
  
  const suspiciousProfiles = profiles.filter(profile => {
    // Perfis criados sem cargo podem indicar criação automática via trigger
    return !profile.cargo || profile.cargo.trim() === '';
  });

  if (suspiciousProfiles.length > 0) {
    console.log(`   ⚠️  Encontrados ${suspiciousProfiles.length} perfis que podem ter sido criados automaticamente:`);
    suspiciousProfiles.slice(0, 3).forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.full_name || profile.email} (sem cargo)`);
    });
    
    console.log('\n   💡 HIPÓTESE: Existe um trigger automático que cria perfis na tabela');
    console.log('      quando um usuário é criado no auth.users, mas esse trigger');
    console.log('      não inclui o campo cargo, apenas campos básicos.');
  }
}

checkTriggers().catch(console.error);