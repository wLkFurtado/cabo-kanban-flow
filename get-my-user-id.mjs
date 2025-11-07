import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Lê o arquivo .env manualmente
let supabaseUrl, supabaseKey;
try {
  const envContent = readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim().replace(/"/g, '');
    }
    if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
      supabaseKey = line.split('=')[1].trim().replace(/"/g, '');
    }
  }
} catch (error) {
  console.error('❌ Erro ao ler arquivo .env:', error.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não encontradas');
  console.log('Certifique-se de que o arquivo .env está configurado corretamente');
  console.log('URL encontrada:', supabaseUrl);
  console.log('Key encontrada:', supabaseKey ? 'Sim' : 'Não');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCurrentUserInfo() {
  try {
    console.log('🔍 Buscando informações do usuário atual...\n');
    
    // Buscar todos os perfis com suas roles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        email, 
        created_at,
        user_roles (
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar perfis:', error.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('📝 Nenhum perfil encontrado no banco de dados.');
      console.log('Você precisa fazer login na aplicação primeiro para criar um perfil.');
      return;
    }

    console.log('👥 Usuários encontrados no sistema:\n');
    console.log('┌─────────────────────────────────────────┬──────────────────────────┬─────────────────────────────┬─────────────┬─────────────────────┐');
    console.log('│ User ID                                 │ Nome                     │ Email                       │ Role        │ Criado em           │');
    console.log('├─────────────────────────────────────────┼──────────────────────────┼─────────────────────────────┼─────────────┼─────────────────────┤');
    
    profiles.forEach((profile, index) => {
      const id = profile.id || 'N/A';
      const name = (profile.full_name || 'Sem nome').padEnd(24).substring(0, 24);
      const email = (profile.email || 'Sem email').padEnd(27).substring(0, 27);
      const role = (profile.user_roles?.[0]?.role || 'user').padEnd(11).substring(0, 11);
      const created = new Date(profile.created_at).toLocaleDateString('pt-BR').padEnd(19).substring(0, 19);
      
      console.log(`│ ${id} │ ${name} │ ${email} │ ${role} │ ${created} │`);
    });
    
    console.log('└─────────────────────────────────────────┴──────────────────────────┴─────────────────────────────┴─────────────┴─────────────────────┘\n');
    
    console.log('📋 Para promover um usuário a admin, use este comando SQL:');
    console.log('INSERT INTO user_roles (user_id, role) VALUES (\'SEU_USER_ID_AQUI\', \'admin\') ON CONFLICT (user_id, role) DO NOTHING;');
    console.log('\n💡 Substitua SEU_USER_ID_AQUI pelo User ID da tabela acima.');
    console.log('🔧 Execute este comando no Supabase Dashboard > SQL Editor.');
    console.log('📄 Ou use o arquivo make-admin.sql que foi criado para você.');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

getCurrentUserInfo();