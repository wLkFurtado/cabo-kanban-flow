import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthUsers() {
  console.log('🔍 Verificando usuários na tabela auth.users...');
  
  try {
    // Tentar consultar auth.users diretamente (pode não funcionar com chave pública)
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('*');

    if (authError) {
      console.log('⚠️ Não foi possível acessar auth.users diretamente:', authError.message);
      console.log('Isso é normal com chave pública por questões de segurança.');
    } else {
      console.log('✅ Usuários encontrados em auth.users:', authUsers?.length || 0);
      authUsers?.forEach(user => {
        console.log(`- ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
        console.log(`  Criado em: ${user.created_at}`);
        console.log('---');
      });
    }
  } catch (err) {
    console.log('⚠️ Erro ao acessar auth.users:', err.message);
  }

  // Verificar se conseguimos obter informações do usuário atual
  console.log('\n🔐 Verificando usuário atual...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.log('⚠️ Nenhum usuário logado:', userError.message);
  } else if (user) {
    console.log('✅ Usuário logado encontrado:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
  } else {
    console.log('ℹ️ Nenhum usuário logado no momento');
  }

  // Verificar sessão atual
  console.log('\n📱 Verificando sessão atual...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.log('⚠️ Erro ao obter sessão:', sessionError.message);
  } else if (session) {
    console.log('✅ Sessão ativa encontrada:');
    console.log(`- Usuário: ${session.user.email}`);
    console.log(`- Expira em: ${new Date(session.expires_at * 1000).toLocaleString()}`);
  } else {
    console.log('ℹ️ Nenhuma sessão ativa');
  }

  // Tentar fazer login com um dos usuários criados para testar
  console.log('\n🔑 Tentando fazer login com usuário de teste...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'joao@exemplo.com',
    password: '123456'
  });

  if (loginError) {
    console.log('❌ Erro no login:', loginError.message);
    if (loginError.message.includes('Email not confirmed')) {
      console.log('💡 O usuário precisa confirmar o email antes de fazer login.');
      console.log('💡 No Supabase Dashboard, você pode:');
      console.log('   1. Ir em Authentication > Users');
      console.log('   2. Encontrar o usuário e clicar em "Confirm email"');
      console.log('   3. Ou desabilitar a confirmação de email em Auth > Settings');
    }
  } else {
    console.log('✅ Login realizado com sucesso!');
    console.log(`- Usuário: ${loginData.user?.email}`);
    console.log(`- ID: ${loginData.user?.id}`);
    
    // Agora que estamos logados, tentar verificar/criar o perfil
    console.log('\n📝 Verificando perfil do usuário logado...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user?.id)
      .single();

    if (profileError) {
      console.log('⚠️ Perfil não encontrado:', profileError.message);
      
      // Tentar criar o perfil
      console.log('🔧 Tentando criar perfil...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: loginData.user?.id,
          email: loginData.user?.email,
          full_name: 'João Silva',
          display_name: 'João',
          phone: '(11) 99999-1111',
          role: 'user'
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Erro ao criar perfil:', createError.message);
      } else {
        console.log('✅ Perfil criado com sucesso!', newProfile);
      }
    } else {
      console.log('✅ Perfil encontrado:', profile);
    }

    // Fazer logout
    await supabase.auth.signOut();
  }
}

checkAuthUsers();