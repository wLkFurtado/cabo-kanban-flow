import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ankliiywmcpncymdlvaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_EMAIL = 'teste@kanban.com';
const TEST_PASSWORD = 'teste123456';
const TEST_NAME = 'Usuário de Teste';

async function createTestUserComplete() {
  console.log('🔄 Criando usuário de teste completo...');
  
  try {
    // 1. Primeiro, tentar fazer login para ver se o usuário já existe
    console.log('🔍 Verificando se usuário já existe...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (loginData.user) {
      console.log('✅ Usuário já existe e foi autenticado!');
      console.log('📧 Email:', loginData.user.email);
      console.log('🆔 ID:', loginData.user.id);
      
      // Verificar se o perfil existe
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      if (profile) {
        console.log('✅ Perfil já existe!');
        console.log('👤 Nome:', profile.full_name);
        console.log('🔑 Role:', profile.role);
      } else {
        console.log('⚠️ Perfil não encontrado, criando...');
        // Criar perfil para usuário existente
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: loginData.user.id,
            email: loginData.user.email,
            full_name: TEST_NAME,
            role: 'user'
          })
          .select()
          .single();

        if (createProfileError) {
          console.error('❌ Erro ao criar perfil:', createProfileError);
        } else {
          console.log('✅ Perfil criado com sucesso!');
          console.log('👤 Nome:', newProfile.full_name);
        }
      }
      return;
    }

    // 2. Se não conseguiu fazer login, criar novo usuário
    console.log('📝 Criando novo usuário...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          full_name: TEST_NAME,
        }
      }
    });

    if (signUpError) {
      console.error('❌ Erro ao criar usuário:', signUpError);
      return;
    }

    if (signUpData.user) {
      console.log('✅ Usuário criado com sucesso!');
      console.log('📧 Email:', signUpData.user.email);
      console.log('🆔 ID:', signUpData.user.id);

      // 3. Aguardar um pouco e tentar fazer login
      console.log('⏳ Aguardando e fazendo login...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data: loginAfterSignUp, error: loginAfterSignUpError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      if (loginAfterSignUp.user) {
        console.log('✅ Login realizado com sucesso!');
        
        // 4. Verificar se o perfil foi criado automaticamente
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', loginAfterSignUp.user.id)
          .single();

        if (profile) {
          console.log('✅ Perfil encontrado!');
          console.log('👤 Nome:', profile.full_name);
          console.log('🔑 Role:', profile.role);
        } else {
          console.log('⚠️ Perfil não encontrado, criando manualmente...');
          // Criar perfil manualmente
          const { data: newProfile, error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: loginAfterSignUp.user.id,
              email: loginAfterSignUp.user.email,
              full_name: TEST_NAME,
              role: 'user'
            })
            .select()
            .single();

          if (createProfileError) {
            console.error('❌ Erro ao criar perfil:', createProfileError);
          } else {
            console.log('✅ Perfil criado manualmente!');
            console.log('👤 Nome:', newProfile.full_name);
          }
        }
      }
    }

    console.log('\n🎉 Usuário de teste criado com sucesso!');
    console.log('📧 Email para login:', TEST_EMAIL);
    console.log('🔑 Senha para login:', TEST_PASSWORD);

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

createTestUserComplete();