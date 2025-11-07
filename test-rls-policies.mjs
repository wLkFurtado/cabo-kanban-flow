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

console.log('🧪 Testando políticas RLS...\n');

async function testRLSPolicies() {
  try {
    // 1. Testar login com usuário existente (se houver)
    console.log('1️⃣ Testando acesso sem autenticação...');
    const { data: profilesUnauth, error: unauthError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    console.log('📊 Perfis sem autenticação:', profilesUnauth?.length || 0);
    if (unauthError) {
      console.log('⚠️  Erro sem autenticação:', unauthError.message);
    }

    // 2. Tentar criar um usuário de teste
    console.log('\n2️⃣ Criando usuário de teste...');
    const testEmail = `teste-rls-${Date.now()}@exemplo.com`;
    const testPassword = 'senha123456';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Teste RLS',
          phone: '(11) 99999-9999',
          cargo: 'Testador'
        }
      }
    });

    if (authError) {
      console.log('❌ Erro ao criar usuário:', authError.message);
      return;
    }

    console.log('✅ Usuário criado:', authData.user?.id);

    // 3. Testar acesso com usuário autenticado
    console.log('\n3️⃣ Testando acesso com usuário autenticado...');
    const { data: profilesAuth, error: authProfileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    console.log('📊 Perfis com autenticação:', profilesAuth?.length || 0);
    if (authProfileError) {
      console.log('⚠️  Erro com autenticação:', authProfileError.message);
    }

    // 4. Tentar inserir perfil diretamente
    console.log('\n4️⃣ Tentando inserir perfil...');
    const profileData = {
      id: authData.user.id,
      email: testEmail,
      full_name: 'Teste RLS',
      phone: '(11) 99999-9999',
      cargo: 'Testador',
      role: 'user'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir perfil:', insertError.message);
    } else {
      console.log('✅ Perfil inserido com sucesso:', insertData);
    }

    // 5. Verificar se o perfil aparece na lista
    console.log('\n5️⃣ Verificando perfil na lista...');
    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail);

    if (finalError) {
      console.log('❌ Erro ao buscar perfil:', finalError.message);
    } else {
      console.log('📋 Perfil encontrado:', finalProfiles?.length > 0 ? 'SIM' : 'NÃO');
      if (finalProfiles?.length > 0) {
        console.log('📄 Dados do perfil:', finalProfiles[0]);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testRLSPolicies();