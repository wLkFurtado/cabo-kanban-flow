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

// Simular a função createUserWithProfile
async function createUserWithProfile(userData) {
  try {
    const password = userData.password || '123456';
    
    console.log('📝 Dados recebidos para criação:');
    console.log('   - Email:', userData.email);
    console.log('   - Nome:', userData.full_name);
    console.log('   - Display name:', userData.display_name);
    console.log('   - Telefone:', userData.phone);
    console.log('   - Cargo:', `"${userData.cargo || 'VAZIO'}"`);
    console.log('   - Role:', userData.role);
    console.log('   - Avatar URL:', userData.avatar_url);
    
    // 1. Criar usuário de autenticação
    console.log('\n🔐 Criando usuário de autenticação...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: password,
      options: {
        data: {
          full_name: userData.full_name
        },
        emailRedirectTo: undefined
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário de autenticação:', authError);
      return { success: false, error: authError };
    }

    if (!authData.user?.id) {
      console.error('❌ ID do usuário não foi retornado');
      return { success: false, error: new Error('User ID not returned') };
    }

    console.log('✅ Usuário de autenticação criado com ID:', authData.user.id);

    // 2. Tentar fazer login imediatamente para contornar RLS
    console.log('\n🔑 Tentando fazer login para contornar RLS...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: password
    });

    let profileCreated = false;
    let profileResult = null;

    if (!loginError) {
      console.log('✅ Login realizado com sucesso');
      
      // Se login funcionou, criar perfil
      console.log('\n📊 Inserindo perfil na tabela...');
      const profileData = {
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        display_name: userData.display_name || userData.full_name,
        phone: userData.phone,
        cargo: userData.cargo,
        role: userData.role || 'user',
        avatar_url: userData.avatar_url
      };
      
      console.log('   Dados do perfil a serem inseridos:');
      Object.entries(profileData).forEach(([key, value]) => {
        console.log(`   - ${key}: "${value || 'VAZIO'}"`);
      });
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (!error) {
        profileCreated = true;
        profileResult = data;
        console.log('✅ Perfil inserido na tabela com sucesso!');
        console.log('   - Cargo salvo:', `"${data.cargo || 'VAZIO'}"`);
      } else {
        console.error('❌ Erro ao inserir perfil na tabela:', error);
      }

      // Fazer logout após criar o perfil
      console.log('\n🚪 Fazendo logout...');
      await supabase.auth.signOut();
    } else {
      console.log('❌ Falha no login:', loginError.message);
    }

    if (!profileCreated) {
      console.log('\n⚠️  Criando perfil temporário (não inserido na tabela)...');
      profileResult = {
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        display_name: userData.display_name || userData.full_name,
        phone: userData.phone,
        cargo: userData.cargo,
        role: userData.role || 'user',
        avatar_url: userData.avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('   - Cargo no perfil temporário:', `"${profileResult.cargo || 'VAZIO'}"`);
    }

    return { success: true, data: { user: authData.user, profile: profileResult } };

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return { success: false, error };
  }
}

async function testCreateUser() {
  console.log('🧪 Testando criação de usuário com cargo...\n');

  const testUserData = {
    email: `teste-cargo-${Date.now()}@exemplo.com`,
    full_name: 'Usuário Teste Cargo',
    display_name: 'Teste Cargo',
    phone: '(11) 98765-4321',
    cargo: 'Desenvolvedor Full Stack',
    role: 'user',
    avatar_url: 'https://exemplo.com/avatar.jpg'
  };

  const result = await createUserWithProfile(testUserData);

  if (result.success) {
    console.log('\n🎉 Usuário criado com sucesso!');
    console.log('   - Profile ID:', result.data.profile.id);
    console.log('   - Cargo final:', `"${result.data.profile.cargo || 'VAZIO'}"`);
    
    // Verificar se o perfil foi realmente salvo na tabela
    console.log('\n🔍 Verificando se o perfil foi salvo na tabela...');
    const { data: savedProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', result.data.profile.id)
      .single();

    if (error) {
      console.log('❌ Perfil não encontrado na tabela:', error.message);
    } else {
      console.log('✅ Perfil encontrado na tabela!');
      console.log('   - Nome:', savedProfile.full_name);
      console.log('   - Email:', savedProfile.email);
      console.log('   - Cargo na tabela:', `"${savedProfile.cargo || 'VAZIO'}"`);
    }
  } else {
    console.log('\n❌ Falha na criação do usuário:', result.error);
  }
}

testCreateUser().catch(console.error);