import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

const testUsers = [
  {
    email: 'joao@exemplo.com',
    password: '123456',
    full_name: 'João Silva',
    display_name: 'João',
    phone: '(11) 99999-1111',
    role: 'user'
  },
  {
    email: 'maria@exemplo.com',
    password: '123456',
    full_name: 'Maria Santos',
    display_name: 'Maria',
    phone: '(11) 99999-2222',
    role: 'user'
  },
  {
    email: 'pedro@exemplo.com',
    password: '123456',
    full_name: 'Pedro Costa',
    display_name: 'Pedro',
    phone: '(11) 99999-3333',
    role: 'admin'
  }
];

async function createTestUsers() {
  console.log('🚀 Criando usuários de teste...');
  
  for (const user of testUsers) {
    try {
      console.log(`\n📝 Registrando ${user.email}...`);
      
      // Registrar usuário
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.full_name,
            display_name: user.display_name
          }
        }
      });

      if (authError) {
        console.error(`❌ Erro ao registrar ${user.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Usuário ${user.email} registrado com ID: ${authData.user?.id}`);
      
      // Aguardar um pouco para o trigger criar o perfil
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Tentar fazer login para inserir dados adicionais
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (loginError) {
        console.log(`⚠️  Não foi possível fazer login com ${user.email}:`, loginError.message);
        continue;
      }

      console.log(`🔐 Login realizado para ${user.email}`);

      // Tentar atualizar o perfil com dados adicionais
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user?.id,
          full_name: user.full_name,
          display_name: user.display_name,
          email: user.email,
          phone: user.phone,
          role: user.role
        })
        .select();

      if (profileError) {
        console.log(`⚠️  Erro ao atualizar perfil de ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Perfil atualizado para ${user.email}`);
      }

      // Inserir role na tabela user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: authData.user?.id,
          role: user.role
        })
        .select();

      if (roleError) {
        console.log(`⚠️  Erro ao inserir role de ${user.email}:`, roleError.message);
      } else {
        console.log(`✅ Role inserida para ${user.email}`);
      }

      // Fazer logout
      await supabase.auth.signOut();
      
    } catch (err) {
      console.error(`❌ Erro geral para ${user.email}:`, err);
    }
  }
  
  console.log('\n🎉 Processo concluído! Verificando resultados...');
  
  // Verificar resultados finais
  const { data: profiles, error: checkError } = await supabase
    .from('profiles')
    .select('*');
    
  if (checkError) {
    console.error('❌ Erro ao verificar profiles:', checkError);
  } else {
    console.log(`\n📊 Total de profiles criados: ${profiles?.length || 0}`);
    profiles?.forEach(profile => {
      console.log(`- ${profile.full_name || profile.display_name || 'Sem nome'} (${profile.email || 'Sem email'})`);
    });
  }
}

createTestUsers();