import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Carregar variáveis de ambiente do arquivo .env
let supabaseUrl, supabaseKey;
try {
  const envContent = readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].replace(/"/g, '');
    }
    if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
      supabaseKey = line.split('=')[1].replace(/"/g, '');
    }
  }
} catch (error) {
  console.error('❌ Erro ao ler arquivo .env:', error.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testando registro de novo usuário com cargo...\n');

async function testNewUserWithCargo() {
  try {
    const timestamp = Date.now();
    const testUser = {
      email: `teste-cargo-${timestamp}@exemplo.com`,
      password: 'senha123456',
      full_name: 'Teste Cargo Novo',
      phone: '(11) 98765-4321',
      cargo: 'Analista de Sistemas',
      role: 'user'
    };

    console.log('📝 Dados do usuário de teste:');
    console.log(`   📧 Email: ${testUser.email}`);
    console.log(`   👤 Nome: ${testUser.full_name}`);
    console.log(`   📱 Telefone: ${testUser.phone}`);
    console.log(`   💼 Cargo: ${testUser.cargo}`);

    // 1. Criar usuário de autenticação
    console.log('\n1️⃣ Criando usuário de autenticação...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.full_name,
          phone: testUser.phone,
          cargo: testUser.cargo,
          role: testUser.role
        }
      }
    });

    if (authError) {
      console.log('❌ Erro ao criar usuário:', authError.message);
      return;
    }

    console.log('✅ Usuário de autenticação criado:', authData.user?.id);

    // 2. Tentar criar perfil manualmente (simulando nossa função signUp)
    console.log('\n2️⃣ Criando perfil na tabela profiles...');
    const profileData = {
      id: authData.user.id,
      email: testUser.email,
      full_name: testUser.full_name,
      phone: testUser.phone,
      cargo: testUser.cargo,
      role: testUser.role,
      display_name: testUser.full_name
    };

    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select();

    if (profileError) {
      console.log('❌ Erro ao criar perfil:', profileError.message);
      console.log('⚠️  Detalhes do erro:', profileError);
    } else {
      console.log('✅ Perfil criado com sucesso!');
      console.log('📄 Dados do perfil:', profileResult[0]);
    }

    // 3. Verificar se o perfil aparece na lista
    console.log('\n3️⃣ Verificando se o perfil aparece na lista...');
    const { data: allProfiles, error: listError } = await supabase
      .from('profiles')
      .select('email, full_name, cargo, role')
      .eq('email', testUser.email);

    if (listError) {
      console.log('❌ Erro ao buscar perfil:', listError.message);
    } else {
      if (allProfiles && allProfiles.length > 0) {
        console.log('✅ Perfil encontrado na lista!');
        console.log('📋 Dados encontrados:', allProfiles[0]);
      } else {
        console.log('❌ Perfil não encontrado na lista');
      }
    }

    // 4. Listar todos os perfis para verificar
    console.log('\n4️⃣ Listando todos os perfis...');
    const { data: allProfilesList, error: allError } = await supabase
      .from('profiles')
      .select('email, full_name, cargo, role');

    if (allError) {
      console.log('❌ Erro ao listar perfis:', allError.message);
    } else {
      console.log(`📊 Total de perfis encontrados: ${allProfilesList?.length || 0}`);
      if (allProfilesList && allProfilesList.length > 0) {
        allProfilesList.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.full_name || profile.email}`);
          console.log(`      💼 Cargo: ${profile.cargo || 'Não informado'}`);
          console.log(`      🔑 Role: ${profile.role || 'user'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testNewUserWithCargo();