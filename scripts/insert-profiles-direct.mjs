import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

// IDs dos usuários criados anteriormente
const testProfiles = [
  {
    id: '589c84b1-054f-43ab-bde1-35c6b86f3d07',
    full_name: 'João Silva',
    display_name: 'João',
    email: 'joao@exemplo.com',
    phone: '(11) 99999-1111',
    role: 'user'
  },
  {
    id: '2e3843a6-0987-4e44-b246-34f5a0972379',
    full_name: 'Maria Santos',
    display_name: 'Maria',
    email: 'maria@exemplo.com',
    phone: '(11) 99999-2222',
    role: 'user'
  },
  {
    id: '64232d75-4ce4-44c4-bbb1-d6f8d3859c3f',
    full_name: 'Pedro Costa',
    display_name: 'Pedro',
    email: 'pedro@exemplo.com',
    phone: '(11) 99999-3333',
    role: 'admin'
  }
];

async function insertProfilesDirect() {
  console.log('🚀 Inserindo perfis diretamente...');
  
  // Tentar inserir todos os perfis de uma vez
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .insert(testProfiles.map(profile => ({
      id: profile.id,
      full_name: profile.full_name,
      display_name: profile.display_name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role
    })))
    .select();

  if (profilesError) {
    console.error('❌ Erro ao inserir perfis:', profilesError);
    
    // Tentar inserir um por vez para identificar problemas específicos
    console.log('\n🔄 Tentando inserir um por vez...');
    for (const profile of testProfiles) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: profile.id,
            full_name: profile.full_name,
            display_name: profile.display_name,
            email: profile.email,
            phone: profile.phone,
            role: profile.role
          })
          .select();

        if (error) {
          console.error(`❌ Erro para ${profile.email}:`, error.message);
        } else {
          console.log(`✅ Perfil inserido: ${profile.email}`);
        }
      } catch (err) {
        console.error(`❌ Erro geral para ${profile.email}:`, err);
      }
    }
  } else {
    console.log('✅ Todos os perfis inseridos com sucesso!');
    console.log('Perfis criados:', profilesData);
  }

  // Inserir roles
  console.log('\n📝 Inserindo roles...');
  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .insert(testProfiles.map(profile => ({
      user_id: profile.id,
      role: profile.role
    })))
    .select();

  if (rolesError) {
    console.error('❌ Erro ao inserir roles:', rolesError);
  } else {
    console.log('✅ Roles inseridas com sucesso!');
  }

  // Verificar resultados
  console.log('\n📊 Verificando resultados...');
  const { data: finalProfiles, error: checkError } = await supabase
    .from('profiles')
    .select('*');
    
  if (checkError) {
    console.error('❌ Erro ao verificar profiles:', checkError);
  } else {
    console.log(`\n✅ Total de profiles: ${finalProfiles?.length || 0}`);
    finalProfiles?.forEach(profile => {
      console.log(`- ${profile.full_name || profile.display_name} (${profile.email})`);
    });
  }
}

insertProfilesDirect();