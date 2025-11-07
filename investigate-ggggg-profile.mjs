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

async function investigateProfile() {
  console.log('🔍 Investigando o perfil "ggggg"...\n');

  // 1. Buscar o perfil específico
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('full_name', 'ggggg')
    .single();

  if (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    return;
  }

  console.log('📋 Dados completos do perfil:');
  console.log('   - ID:', profile.id);
  console.log('   - Email:', profile.email);
  console.log('   - Nome completo:', profile.full_name);
  console.log('   - Nome de exibição:', profile.display_name);
  console.log('   - Telefone:', profile.phone);
  console.log('   - Cargo:', `"${profile.cargo || 'VAZIO'}"`);
  console.log('   - Role:', profile.role);
  console.log('   - Avatar URL:', profile.avatar_url);
  console.log('   - Criado em:', profile.created_at);
  console.log('   - Atualizado em:', profile.updated_at);

  // 2. Verificar se existe um usuário de autenticação correspondente
  console.log('\n🔐 Verificando usuário de autenticação...');
  
  // Como não podemos acessar auth.admin diretamente, vamos verificar se há metadados
  // salvos em algum lugar ou se podemos inferir informações
  
  // 3. Verificar se há registros relacionados em outras tabelas
  console.log('\n📊 Verificando tabelas relacionadas...');
  
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', profile.id);

  if (!rolesError && userRoles) {
    console.log('   - User roles encontrados:', userRoles.length);
    userRoles.forEach(role => {
      console.log(`     * Role: ${role.role}, Criado em: ${role.created_at}`);
    });
  } else {
    console.log('   - Nenhum user role encontrado');
  }

  // 4. Simular uma atualização para testar se o campo cargo funciona
  console.log('\n🧪 Testando atualização do campo cargo...');
  
  const testCargo = 'Cargo de Teste - ' + new Date().toLocaleTimeString();
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ cargo: testCargo })
    .eq('id', profile.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Erro ao atualizar cargo:', updateError);
  } else {
    console.log('✅ Cargo atualizado com sucesso!');
    console.log('   - Cargo anterior:', `"${profile.cargo || 'VAZIO'}"`);
    console.log('   - Cargo novo:', `"${updatedProfile.cargo}"`);
  }

  // 5. Reverter para o estado original (vazio) para não afetar os testes
  console.log('\n🔄 Revertendo para o estado original...');
  
  const { error: revertError } = await supabase
    .from('profiles')
    .update({ cargo: profile.cargo })
    .eq('id', profile.id);

  if (revertError) {
    console.error('❌ Erro ao reverter cargo:', revertError);
  } else {
    console.log('✅ Estado original restaurado');
  }
}

investigateProfile().catch(console.error);