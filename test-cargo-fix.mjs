import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCargoFix() {
  console.log('🧪 Testando se a correção do campo cargo funcionou...\n');

  const timestamp = new Date().toLocaleTimeString();
  const testEmail = `teste-cargo-${Date.now()}@exemplo.com`;
  const testCargo = `Desenvolvedor de Teste - ${timestamp}`;

  try {
    console.log('1️⃣ Criando usuário de autenticação com cargo nos metadados...');
    
    // Criar usuário com cargo nos metadados
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'senha123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'Usuário de Teste Cargo',
        role: 'user',
        cargo: testCargo
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message);
      return;
    }

    console.log('✅ Usuário criado:', authUser.user.id);
    console.log('   Email:', authUser.user.email);
    console.log('   Metadados:', authUser.user.user_metadata);

    // Aguardar um pouco para o trigger processar
    console.log('\n2️⃣ Aguardando trigger processar...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar se o perfil foi criado automaticamente com o cargo
    console.log('\n3️⃣ Verificando perfil criado automaticamente...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }

    if (!profile) {
      console.error('❌ Perfil não foi criado automaticamente pelo trigger');
      return;
    }

    console.log('✅ Perfil encontrado:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Nome:', profile.full_name);
    console.log('   Role:', profile.role);
    console.log('   Cargo:', profile.cargo || 'VAZIO');

    // Verificar se o cargo foi salvo corretamente
    if (profile.cargo === testCargo) {
      console.log('\n🎉 SUCESSO! O campo cargo foi salvo corretamente pelo trigger!');
      console.log('   ✅ Trigger corrigido funciona perfeitamente');
      console.log('   ✅ Campo cargo incluído automaticamente na criação do perfil');
    } else if (profile.cargo) {
      console.log('\n⚠️ PARCIAL: Campo cargo foi salvo, mas com valor diferente:');
      console.log('   Esperado:', testCargo);
      console.log('   Recebido:', profile.cargo);
    } else {
      console.log('\n❌ FALHA: Campo cargo ainda está vazio');
      console.log('   O trigger ainda não foi corrigido ou não está funcionando');
    }

    // Limpeza: remover usuário de teste
    console.log('\n4️⃣ Limpando dados de teste...');
    
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.user.id);
    
    if (deleteError) {
      console.log('⚠️ Erro ao remover usuário de teste:', deleteError.message);
    } else {
      console.log('✅ Usuário de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

console.log('🔧 ANTES DE EXECUTAR ESTE TESTE:');
console.log('   Certifique-se de que você aplicou o SQL no Supabase Dashboard!');
console.log('   Se não aplicou, execute: node apply-migration-fix-cargo.mjs\n');

testCargoFix().catch(console.error);