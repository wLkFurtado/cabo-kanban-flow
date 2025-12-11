import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

const testUsers = [
  {
    id: '589c84b1-054f-43ab-bde1-35c6b86f3d07',
    email: 'joao@exemplo.com',
    password: '123456',
    full_name: 'João Silva',
    display_name: 'João',
    phone: '(11) 99999-1111',
    role: 'user'
  },
  {
    id: '2e3843a6-0987-4e44-b246-34f5a0972379',
    email: 'maria@exemplo.com',
    password: '123456',
    full_name: 'Maria Santos',
    display_name: 'Maria',
    phone: '(11) 99999-2222',
    role: 'user'
  },
  {
    id: '64232d75-4ce4-44c4-bbb1-d6f8d3859c3f',
    email: 'pedro@exemplo.com',
    password: '123456',
    full_name: 'Pedro Costa',
    display_name: 'Pedro',
    phone: '(11) 99999-3333',
    role: 'admin'
  }
];

async function createProfilesWithAuth() {
  console.log('🚀 Tentando criar perfis através de autenticação...');
  
  // Primeiro, vamos tentar registrar novos usuários com emails diferentes
  const newTestUsers = [
    {
      email: 'joao.silva@teste.com',
      password: '123456',
      full_name: 'João Silva',
      display_name: 'João',
      phone: '(11) 99999-1111',
      role: 'user'
    },
    {
      email: 'maria.santos@teste.com',
      password: '123456',
      full_name: 'Maria Santos',
      display_name: 'Maria',
      phone: '(11) 99999-2222',
      role: 'user'
    },
    {
      email: 'pedro.costa@teste.com',
      password: '123456',
      full_name: 'Pedro Costa',
      display_name: 'Pedro',
      phone: '(11) 99999-3333',
      role: 'admin'
    }
  ];

  for (const user of newTestUsers) {
    try {
      console.log(`\n📝 Registrando ${user.email}...`);
      
      // Registrar usuário com dados completos no metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.full_name,
            display_name: user.display_name,
            phone: user.phone,
            role: user.role
          }
        }
      });

      if (authError) {
        console.error(`❌ Erro ao registrar ${user.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Usuário ${user.email} registrado com ID: ${authData.user?.id}`);
      
      // Aguardar um pouco para o trigger processar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (err) {
      console.error(`❌ Erro geral para ${user.email}:`, err);
    }
  }
  
  // Aguardar mais um pouco
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Verificar se os perfis foram criados automaticamente
  console.log('\n📊 Verificando perfis criados automaticamente...');
  const { data: profiles, error: checkError } = await supabase
    .from('profiles')
    .select('*');
    
  if (checkError) {
    console.error('❌ Erro ao verificar profiles:', checkError);
  } else {
    console.log(`\n✅ Total de profiles encontrados: ${profiles?.length || 0}`);
    profiles?.forEach(profile => {
      console.log(`- ${profile.full_name || profile.display_name || 'Sem nome'} (${profile.email || 'Sem email'})`);
    });
    
    if (profiles && profiles.length > 0) {
      console.log('\n🎉 Sucesso! Os perfis foram criados automaticamente pelo trigger!');
      
      // Agora vamos tentar atualizar os perfis com dados adicionais
      for (const profile of profiles) {
        const userData = newTestUsers.find(u => u.email === profile.email);
        if (userData && (!profile.phone || !profile.display_name)) {
          try {
            console.log(`📝 Atualizando dados de ${profile.email}...`);
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                phone: userData.phone,
                display_name: userData.display_name,
                role: userData.role
              })
              .eq('id', profile.id);
              
            if (updateError) {
              console.log(`⚠️ Erro ao atualizar ${profile.email}:`, updateError.message);
            } else {
              console.log(`✅ Dados atualizados para ${profile.email}`);
            }
          } catch (updateErr) {
            console.error(`❌ Erro ao atualizar ${profile.email}:`, updateErr);
          }
        }
      }
    } else {
      console.log('\n⚠️ Nenhum perfil foi criado automaticamente. O trigger pode não estar funcionando.');
    }
  }
}

createProfilesWithAuth();