import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Carregar variáveis de ambiente do arquivo .env
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/"/g, '');
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegisterFlow() {
  console.log('🧪 Testando fluxo de registro completo...\n');

  // Dados do usuário de teste
  const testUser = {
    email: `teste-${Date.now()}@exemplo.com`,
    password: 'senha123456',
    full_name: 'Usuário de Teste',
    phone: '(11) 99999-9999',
    cargo: 'Analista de Teste'
  };

  console.log('📝 Dados do usuário de teste:');
  console.log(`Email: ${testUser.email}`);
  console.log(`Nome: ${testUser.full_name}`);
  console.log(`Telefone: ${testUser.phone}`);
  console.log(`Cargo: ${testUser.cargo}\n`);

  try {
    // 1. Simular registro (como seria feito pela página de registro)
    console.log('1️⃣ Criando usuário de autenticação...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.full_name,
          phone: testUser.phone,
          cargo: testUser.cargo,
          role: 'user'
        }
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário de autenticação:', authError.message);
      return;
    }

    console.log('✅ Usuário de autenticação criado com sucesso!');
    console.log(`ID do usuário: ${authData.user?.id}\n`);

    // 2. Simular criação do perfil (como seria feito pela função signUp modificada)
    let profileError = null;
    if (authData.user) {
      console.log('2️⃣ Criando perfil na tabela profiles...');
      
      const profileData = {
        id: authData.user.id,
        email: testUser.email,
        full_name: testUser.full_name,
        phone: testUser.phone,
        cargo: testUser.cargo,
        role: 'user',
        display_name: testUser.full_name
      };

      const { error } = await supabase
        .from('profiles')
        .insert(profileData);

      profileError = error;

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError.message);
        console.log('⚠️  Isso pode ser devido às políticas RLS ou confirmação de email\n');
      } else {
        console.log('✅ Perfil criado com sucesso na tabela profiles!\n');
      }
    }

    // 3. Verificar se o perfil aparece na lista (como seria visto na área administrativa)
    console.log('3️⃣ Verificando se o perfil aparece na lista...');
    const { data: profiles, error: listError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testUser.email);

    if (listError) {
      console.error('❌ Erro ao buscar perfis:', listError.message);
    } else if (profiles && profiles.length > 0) {
      console.log('✅ Perfil encontrado na lista!');
      console.log('📋 Dados do perfil:');
      console.log(JSON.stringify(profiles[0], null, 2));
    } else {
      console.log('❌ Perfil não encontrado na lista');
      console.log('⚠️  Isso pode ser devido às políticas RLS\n');
    }

    // 4. Resumo dos resultados
    console.log('\n📊 RESUMO DO TESTE:');
    console.log(`✅ Usuário de autenticação: ${authData.user ? 'Criado' : 'Falhou'}`);
    console.log(`${profileError ? '❌' : '✅'} Perfil na tabela: ${profileError ? 'Falhou' : 'Criado'}`);
    console.log(`${profiles && profiles.length > 0 ? '✅' : '❌'} Visível na lista: ${profiles && profiles.length > 0 ? 'Sim' : 'Não'}`);

    if (profileError || !profiles || profiles.length === 0) {
      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log('- Verificar configurações do Supabase (RLS, confirmação de email)');
      console.log('- Consultar CONFIGURACAO_SUPABASE.md para instruções detalhadas');
    } else {
      console.log('\n🎉 SUCESSO! O fluxo está funcionando corretamente!');
      console.log('Os usuários registrados agora aparecerão automaticamente na área administrativa.');
    }

  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  }
}

testRegisterFlow();