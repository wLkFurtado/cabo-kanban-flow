import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ankliiywmcpncymdlvaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_EMAIL = 'teste@kanban.com';
const TEST_PASSWORD = 'teste123456';

async function testLoginAndCreateData() {
  console.log('🔄 Testando login e criação de dados...');
  
  try {
    // 1. Tentar fazer login
    console.log('🔐 Tentando fazer login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (loginError) {
      console.error('❌ Erro ao fazer login:', loginError.message);
      
      // Se falhar, tentar criar o usuário novamente
      console.log('📝 Tentando criar usuário novamente...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: {
            full_name: 'Usuário de Teste',
          }
        }
      });

      if (signUpError) {
        console.error('❌ Erro ao criar usuário:', signUpError.message);
        return;
      }

      console.log('✅ Usuário criado! Aguarde a confirmação de email ou tente fazer login novamente.');
      return;
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', loginData.user.email);
    console.log('🆔 ID:', loginData.user.id);

    // 2. Verificar se o perfil existe
    console.log('🔍 Verificando perfil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }

    if (!profile) {
      console.log('📝 Criando perfil...');
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: loginData.user.id,
          email: loginData.user.email,
          full_name: 'Usuário de Teste',
          role: 'user'
        })
        .select()
        .single();

      if (createProfileError) {
        console.error('❌ Erro ao criar perfil:', createProfileError);
        return;
      }

      console.log('✅ Perfil criado:', newProfile.full_name);
    } else {
      console.log('✅ Perfil encontrado:', profile.full_name);
    }

    // 3. Tentar criar um board simples
    console.log('📋 Tentando criar board...');
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({
        title: 'Meu Primeiro Board',
        description: 'Board de teste criado via script',
        owner_id: loginData.user.id
      })
      .select()
      .single();

    if (boardError) {
      console.error('❌ Erro ao criar board:', boardError);
      console.log('ℹ️ Isso pode ser devido às políticas de RLS. Tente criar o board através da interface da aplicação.');
    } else {
      console.log('✅ Board criado com sucesso:', board.title);
    }

    console.log('\n🎉 Teste concluído!');
    console.log('🌐 Acesse http://localhost:5173 e faça login com:');
    console.log('📧 Email:', TEST_EMAIL);
    console.log('🔑 Senha:', TEST_PASSWORD);
    console.log('\n💡 Se o board não foi criado automaticamente, você pode criá-lo manualmente na interface.');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testLoginAndCreateData();