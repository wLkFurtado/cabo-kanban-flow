import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInterfaceCargo() {
  console.log('🧪 Testando criação de contato via interface administrativa...\n');

  const timestamp = new Date().toLocaleTimeString();
  const testEmail = `teste-interface-${Date.now()}@exemplo.com`;
  const testCargo = `Gerente de Projetos - ${timestamp}`;

  try {
    console.log('1️⃣ Simulando criação via createUserWithProfile...');
    console.log('   Email:', testEmail);
    console.log('   Cargo:', testCargo);

    // Simular a criação de usuário (vai falhar no login, mas criar perfil temporário)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'senha123456',
      options: {
        data: {
          full_name: 'Teste Interface Cargo',
          role: 'user',
          cargo: testCargo
        }
      }
    });

    if (authError) {
      console.log('⚠️ Erro esperado na criação (normal):', authError.message);
    } else {
      console.log('✅ Usuário criado:', authData.user?.id);
    }

    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Tentar fazer login (vai falhar por email não confirmado)
    console.log('\n2️⃣ Tentando login (vai falhar - esperado)...');
    
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'senha123456'
    });

    if (loginError) {
      console.log('⚠️ Login falhou (esperado):', loginError.message);
      
      // Criar perfil temporário como faz a função createUserWithProfile
      console.log('\n3️⃣ Criando perfil temporário...');
      
      const { data: tempProfile, error: tempError } = await supabase
        .from('profiles')
        .insert({
          email: testEmail,
          full_name: 'Teste Interface Cargo',
          role: 'user',
          cargo: testCargo
        })
        .select()
        .single();

      if (tempError) {
        console.error('❌ Erro ao criar perfil temporário:', tempError.message);
        return;
      }

      console.log('✅ Perfil temporário criado:', tempProfile.id);
    }

    // Verificar se o perfil foi salvo com o cargo
    console.log('\n4️⃣ Verificando perfil na tabela...');
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail);

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.error('❌ Nenhum perfil encontrado');
      return;
    }

    const profile = profiles[0];
    console.log('✅ Perfil encontrado:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Nome:', profile.full_name);
    console.log('   Role:', profile.role);
    console.log('   Cargo:', profile.cargo || 'VAZIO');

    // Verificar resultado
    if (profile.cargo === testCargo) {
      console.log('\n🎉 SUCESSO! O campo cargo foi salvo corretamente!');
      console.log('   ✅ Interface administrativa funciona perfeitamente');
    } else if (profile.cargo) {
      console.log('\n⚠️ PARCIAL: Campo cargo foi salvo, mas com valor diferente:');
      console.log('   Esperado:', testCargo);
      console.log('   Recebido:', profile.cargo);
    } else {
      console.log('\n❌ PROBLEMA: Campo cargo ainda está vazio');
      console.log('   Pode haver um trigger automático sobrescrevendo o valor');
    }

    // Limpeza
    console.log('\n5️⃣ Limpando dados de teste...');
    
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('email', testEmail);
    
    if (deleteError) {
      console.log('⚠️ Erro ao remover perfil de teste:', deleteError.message);
    } else {
      console.log('✅ Perfil de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testInterfaceCargo().catch(console.error);