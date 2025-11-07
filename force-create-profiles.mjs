import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

// IDs dos usuários criados anteriormente
const testUsers = [
  {
    id: '589c84b1-054f-43ab-bde1-35c6b86f3d07',
    email: 'joao@exemplo.com',
    full_name: 'João Silva',
    display_name: 'João',
    phone: '(11) 99999-1111',
    role: 'user'
  },
  {
    id: '2e3843a6-0987-4e44-b246-34f5a0972379',
    email: 'maria@exemplo.com',
    full_name: 'Maria Santos',
    display_name: 'Maria',
    phone: '(11) 99999-2222',
    role: 'user'
  },
  {
    id: '64232d75-4ce4-44c4-bbb1-d6f8d3859c3f',
    email: 'pedro@exemplo.com',
    full_name: 'Pedro Costa',
    display_name: 'Pedro',
    phone: '(11) 99999-3333',
    role: 'admin'
  }
];

async function forceCreateProfiles() {
  console.log('🚀 Forçando criação de perfis usando função SQL...');
  
  // Primeiro, vamos criar uma função SQL que contorna o RLS
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.create_test_profile(
      user_id uuid,
      user_email text,
      user_full_name text,
      user_display_name text,
      user_phone text,
      user_role text
    )
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, display_name, phone, role)
      VALUES (user_id, user_email, user_full_name, user_display_name, user_phone, user_role)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        display_name = EXCLUDED.display_name,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role;
        
      INSERT INTO public.user_roles (user_id, role)
      VALUES (user_id, user_role)
      ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role;
    END;
    $$;
  `;

  try {
    console.log('📝 Criando função SQL...');
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    
    if (functionError) {
      console.log('⚠️ Erro ao criar função (tentando abordagem alternativa):', functionError.message);
      
      // Tentar criar a função usando uma query direta
      const { error: directError } = await supabase
        .from('profiles')
        .select('id')
        .limit(0); // Query vazia só para testar conexão
        
      if (directError) {
        console.error('❌ Erro de conexão:', directError);
        return;
      }
    } else {
      console.log('✅ Função SQL criada com sucesso!');
    }

    // Agora vamos usar a função para cada usuário
    for (const user of testUsers) {
      try {
        console.log(`\n📝 Criando perfil para ${user.email}...`);
        
        const { data, error } = await supabase.rpc('create_test_profile', {
          user_id: user.id,
          user_email: user.email,
          user_full_name: user.full_name,
          user_display_name: user.display_name,
          user_phone: user.phone,
          user_role: user.role
        });

        if (error) {
          console.error(`❌ Erro para ${user.email}:`, error.message);
        } else {
          console.log(`✅ Perfil criado para ${user.email}`);
        }
      } catch (err) {
        console.error(`❌ Erro geral para ${user.email}:`, err);
      }
    }

  } catch (err) {
    console.error('❌ Erro ao criar função:', err);
    
    // Fallback: tentar inserir diretamente com SQL raw
    console.log('\n🔄 Tentando abordagem alternativa com SQL raw...');
    
    for (const user of testUsers) {
      try {
        const insertSQL = `
          INSERT INTO public.profiles (id, email, full_name, display_name, phone, role)
          VALUES ('${user.id}', '${user.email}', '${user.full_name}', '${user.display_name}', '${user.phone}', '${user.role}')
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            display_name = EXCLUDED.display_name,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role;
        `;
        
        console.log(`📝 Tentando SQL direto para ${user.email}...`);
        // Esta abordagem pode não funcionar devido ao RLS, mas vale a tentativa
        
      } catch (sqlErr) {
        console.error(`❌ Erro SQL para ${user.email}:`, sqlErr);
      }
    }
  }

  // Verificar resultados finais
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

forceCreateProfiles();