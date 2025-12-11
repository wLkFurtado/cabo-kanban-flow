import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ankliiywmcpncymdlvaa.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegistroInterface() {
  console.log('🧪 Testando fluxo EXATO da interface de registro...\n');

  // Simular exatamente o que acontece quando você preenche o formulário
  const formValues = {
    name: 'João Silva',
    email: `joao-${Date.now()}@exemplo.com`,
    phone: '(11) 99999-9999',
    role: 'Analista de Marketing', // Este é o cargo que você digita
    password: 'senha123456',
    confirmPassword: 'senha123456'
  };

  console.log('📝 Dados do formulário (como você preencheu):');
  console.log(`   👤 Nome: ${formValues.name}`);
  console.log(`   📧 Email: ${formValues.email}`);
  console.log(`   📱 Telefone: ${formValues.phone}`);
  console.log(`   💼 Cargo: ${formValues.role}`);

  // Simular exatamente o que a página Register.tsx faz
  const userData = {
    full_name: formValues.name,
    phone: formValues.phone,
    cargo: formValues.role, // Passando o cargo preenchido pelo usuário
    role: 'user', // Role padrão para novos usuários
  };

  console.log('\n📤 Dados enviados para signUp (após correção):');
  console.log(`   full_name: ${userData.full_name}`);
  console.log(`   phone: ${userData.phone}`);
  console.log(`   cargo: ${userData.cargo}`);
  console.log(`   role: ${userData.role}`);

  try {
    // 1. Simular a função signUp do useAuth.ts
    console.log('\n1️⃣ Criando usuário de autenticação...');
    const { data, error } = await supabase.auth.signUp({
      email: formValues.email,
      password: formValues.password,
      options: {
        emailRedirectTo: 'http://localhost:8080/',
        data: {
          full_name: userData.full_name,
          phone: userData.phone,
          cargo: userData.cargo ?? userData.role, // Lógica corrigida
          role: userData.role,
          avatar_url: userData.avatar_url,
          display_name: userData.display_name,
        }
      }
    });

    if (error) {
      console.log('❌ Erro ao criar usuário:', error.message);
      return;
    }

    console.log('✅ Usuário de autenticação criado:', data.user?.id);
    console.log('📋 Metadados salvos:', data.user?.user_metadata);

    // 2. Simular a criação do perfil na tabela profiles
    if (data.user) {
      console.log('\n2️⃣ Criando perfil na tabela profiles...');
      const profileData = {
        id: data.user.id,
        email: formValues.email,
        full_name: userData.full_name || null,
        phone: userData.phone || null,
        cargo: (userData.cargo ?? userData.role) || null, // Lógica corrigida
        role: userData.role || 'user',
        avatar_url: userData.avatar_url || null,
        display_name: userData.display_name || userData.full_name || null,
      };

      console.log('📊 Dados do perfil a ser inserido:');
      console.log(`   id: ${profileData.id}`);
      console.log(`   email: ${profileData.email}`);
      console.log(`   full_name: ${profileData.full_name}`);
      console.log(`   phone: ${profileData.phone}`);
      console.log(`   cargo: ${profileData.cargo}`);
      console.log(`   role: ${profileData.role}`);

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.log('❌ Erro ao criar perfil:', profileError.message);
        console.log('   Código:', profileError.code);
        console.log('   Detalhes:', profileError.details);
      } else {
        console.log('✅ Perfil criado com sucesso!');
      }
    }

    // 3. Verificar se o perfil aparece na lista
    console.log('\n3️⃣ Verificando se o perfil aparece na lista...');
    const { data: profiles, error: listError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', formValues.email);

    if (listError) {
      console.log('❌ Erro ao buscar perfil:', listError.message);
    } else if (profiles && profiles.length > 0) {
      console.log('✅ Perfil encontrado na lista:');
      profiles.forEach(profile => {
        console.log(`   👤 ${profile.full_name}`);
        console.log(`   📧 ${profile.email}`);
        console.log(`   💼 Cargo: ${profile.cargo || 'NÃO INFORMADO'}`);
        console.log(`   🔑 Role: ${profile.role}`);
      });
    } else {
      console.log('❌ Perfil não encontrado na lista');
    }

  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  }
}

testRegistroInterface();