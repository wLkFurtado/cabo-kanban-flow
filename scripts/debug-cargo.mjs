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

async function debugCargo() {
  console.log('🔍 Debugando problema do campo cargo...\n');

  // 1. Verificar se existem perfis na tabela
  console.log('1. Verificando perfis existentes:');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('❌ Erro ao buscar perfis:', profilesError);
    return;
  }

  console.log(`✅ Encontrados ${profiles.length} perfis:`);
  profiles.forEach((profile, index) => {
    console.log(`   ${index + 1}. ${profile.full_name || profile.email}`);
    console.log(`      - Email: ${profile.email}`);
    console.log(`      - Cargo: "${profile.cargo || 'VAZIO'}"`);
    console.log(`      - Role: ${profile.role}`);
    console.log(`      - ID: ${profile.id}`);
    console.log(`      - Created: ${profile.created_at}`);
    console.log('');
  });

  // 2. Se não há perfis, tentar criar um de teste
  if (profiles.length === 0) {
    console.log('2. Nenhum perfil encontrado. Tentando criar um de teste...');
    
    const testProfile = {
      id: 'test-user-' + Date.now(),
      email: 'teste@exemplo.com',
      full_name: 'Usuário Teste',
      display_name: 'Teste',
      cargo: 'Desenvolvedor Teste',
      role: 'user',
      phone: '(11) 99999-9999'
    };

    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar perfil de teste:', createError);
      console.log('   Isso confirma que o RLS ainda está ativo.');
    } else {
      console.log('✅ Perfil de teste criado com sucesso:');
      console.log('   - Nome:', newProfile.full_name);
      console.log('   - Cargo:', newProfile.cargo);
    }
  } else {
    // 3. Testar atualização de um perfil existente
    console.log('2. Testando atualização do primeiro perfil...');
    const firstProfile = profiles[0];
    const newCargo = 'Cargo Atualizado - ' + new Date().toLocaleTimeString();
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ cargo: newCargo })
      .eq('id', firstProfile.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError);
    } else {
      console.log('✅ Perfil atualizado com sucesso:');
      console.log('   - Nome:', updatedProfile.full_name);
      console.log('   - Cargo anterior:', firstProfile.cargo || 'VAZIO');
      console.log('   - Cargo novo:', updatedProfile.cargo);
    }
  }

  // 4. Verificar estrutura da tabela
  console.log('\n3. Verificando estrutura da tabela profiles...');
  const { data: tableInfo, error: tableError } = await supabase
    .rpc('get_table_columns', { table_name: 'profiles' })
    .catch(() => null);

  if (!tableError && tableInfo) {
    console.log('✅ Colunas da tabela profiles:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable ? '(nullable)' : '(not null)'}`);
    });
  } else {
    console.log('⚠️  Não foi possível obter informações da estrutura da tabela');
  }
}

debugCargo().catch(console.error);