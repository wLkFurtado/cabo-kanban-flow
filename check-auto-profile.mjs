import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAutoProfile() {
  console.log('🔍 Verificando se o trigger automático está funcionando...\n');

  const timestamp = new Date().toLocaleTimeString();
  const testEmail = `teste-auto-${Date.now()}@exemplo.com`;
  const testCargo = `Analista de Sistemas - ${timestamp}`;

  try {
    console.log('1️⃣ Criando usuário com cargo nos metadados...');
    console.log('   Email:', testEmail);
    console.log('   Cargo:', testCargo);

    // Criar usuário com cargo nos metadados
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'senha123456',
      options: {
        data: {
          full_name: 'Teste Auto Profile',
          role: 'user',
          cargo: testCargo
        }
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message);
      return;
    }

    console.log('✅ Usuário criado:', authData.user?.id);
    console.log('   Metadados:', authData.user?.user_metadata);

    // Aguardar um pouco para o trigger processar
    console.log('\n2️⃣ Aguardando trigger automático processar...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar se o perfil foi criado automaticamente
    console.log('\n3️⃣ Verificando perfil criado automaticamente...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError.message);
      return;
    }

    if (!profile) {
      console.error('❌ Perfil não foi criado automaticamente');
      return;
    }

    console.log('✅ Perfil criado automaticamente pelo trigger:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Nome:', profile.full_name);
    console.log('   Role:', profile.role);
    console.log('   Cargo:', profile.cargo || 'VAZIO');

    // Analisar resultado
    if (profile.cargo === testCargo) {
      console.log('\n🎉 EXCELENTE! O trigger foi corrigido com sucesso!');
      console.log('   ✅ Campo cargo incluído automaticamente');
      console.log('   ✅ Valor correto salvo do user_metadata');
      console.log('   ✅ Problema do campo cargo RESOLVIDO!');
    } else if (profile.cargo) {
      console.log('\n⚠️ PARCIAL: Campo cargo foi incluído, mas com valor diferente:');
      console.log('   Esperado:', testCargo);
      console.log('   Recebido:', profile.cargo);
    } else {
      console.log('\n❌ AINDA COM PROBLEMA: Campo cargo está vazio');
      console.log('   O trigger ainda não foi corrigido');
      console.log('   Certifique-se de aplicar o SQL no Supabase Dashboard');
    }

    // Verificar outros perfis recentes para comparar
    console.log('\n4️⃣ Verificando outros perfis recentes...');
    
    const { data: recentProfiles, error: recentError } = await supabase
      .from('profiles')
      .select('id, email, full_name, cargo, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.log('⚠️ Erro ao buscar perfis recentes:', recentError.message);
    } else {
      console.log('📋 Últimos 5 perfis criados:');
      recentProfiles.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.email} - Cargo: ${p.cargo || 'VAZIO'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

checkAutoProfile().catch(console.error);