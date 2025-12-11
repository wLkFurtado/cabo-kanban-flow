import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados de teste para contatos
const testContacts = [
  {
    id: randomUUID(),
    full_name: 'Ana Silva Santos',
    display_name: 'Ana Silva',
    email: 'ana.silva@coordcom.gov.br',
    phone: '(11) 98765-4321',
    cargo: 'Coordenadora de Comunicação',
    role: 'admin'
  },
  {
    id: randomUUID(),
    full_name: 'Carlos Eduardo Oliveira',
    display_name: 'Carlos Eduardo',
    email: 'carlos.oliveira@coordcom.gov.br',
    phone: '(11) 97654-3210',
    cargo: 'Analista de Comunicação',
    role: 'user'
  },
  {
    id: randomUUID(),
    full_name: 'Maria Fernanda Costa',
    display_name: 'Maria Fernanda',
    email: 'maria.costa@coordcom.gov.br',
    phone: '(11) 96543-2109',
    cargo: 'Designer Gráfico',
    role: 'user'
  },
  {
    id: randomUUID(),
    full_name: 'João Pedro Almeida',
    display_name: 'João Pedro',
    email: 'joao.almeida@coordcom.gov.br',
    phone: '(11) 95432-1098',
    cargo: 'Jornalista',
    role: 'user'
  },
  {
    id: randomUUID(),
    full_name: 'Beatriz Rodrigues Lima',
    display_name: 'Beatriz Rodrigues',
    email: 'beatriz.lima@coordcom.gov.br',
    phone: '(11) 94321-0987',
    cargo: 'Social Media',
    role: 'user'
  },
  {
    id: randomUUID(),
    full_name: 'Rafael Santos Pereira',
    display_name: 'Rafael Santos',
    email: 'rafael.pereira@coordcom.gov.br',
    phone: '(11) 93210-9876',
    cargo: 'Fotógrafo',
    role: 'user'
  },
  {
    id: randomUUID(),
    full_name: 'Camila Ferreira Souza',
    display_name: 'Camila Ferreira',
    email: 'camila.souza@coordcom.gov.br',
    phone: '(11) 92109-8765',
    cargo: 'Assessora de Imprensa',
    role: 'user'
  },
  {
    id: randomUUID(),
    full_name: 'Lucas Martins Silva',
    display_name: 'Lucas Martins',
    email: 'lucas.silva@coordcom.gov.br',
    phone: '(11) 91098-7654',
    cargo: 'Editor de Vídeo',
    role: 'user'
  },
  {
    id: randomUUID(),
    full_name: 'Juliana Barbosa Santos',
    display_name: 'Juliana Barbosa',
    email: 'juliana.santos@coordcom.gov.br',
    phone: '(11) 90987-6543',
    cargo: 'Produtora de Conteúdo',
    role: 'user'
  },
  {
    id: randomUUID(),
    full_name: 'Pedro Henrique Costa',
    display_name: 'Pedro Henrique',
    email: 'pedro.costa@coordcom.gov.br',
    phone: '(11) 89876-5432',
    cargo: 'Estagiário',
    role: 'guest'
  }
];

async function createTestContacts() {
  try {
    console.log('🚀 Iniciando criação de contatos de teste...\n');
    
    // Verificar se já existem contatos
    const { data: existingProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar contatos existentes:', checkError.message);
      return;
    }

    if (existingProfiles && existingProfiles.length > 0) {
      console.log('⚠️  Já existem contatos no banco de dados.');
      console.log('Este script criará contatos adicionais.');
      console.log('Deseja continuar? (Ctrl+C para cancelar)\n');
      
      // Aguardar 3 segundos para dar tempo de cancelar
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('📝 Inserindo contatos na tabela profiles...');
    
    // Inserir contatos na tabela profiles
    const { data: insertedProfiles, error: profileError } = await supabase
      .from('profiles')
      .insert(testContacts.map(contact => ({
        id: contact.id,
        full_name: contact.full_name,
        display_name: contact.display_name,
        email: contact.email,
        phone: contact.phone
      })))
      .select();

    if (profileError) {
      console.error('❌ Erro ao inserir perfis:', profileError.message);
      return;
    }

    console.log(`✅ ${insertedProfiles.length} perfis inseridos com sucesso!`);

    console.log('\n👥 Inserindo roles na tabela user_roles...');
    
    // Inserir roles na tabela user_roles
    const userRoles = testContacts.map(contact => ({
      user_id: contact.id,
      role: contact.role
    }));

    const { data: insertedRoles, error: roleError } = await supabase
      .from('user_roles')
      .insert(userRoles)
      .select();

    if (roleError) {
      console.error('❌ Erro ao inserir roles:', roleError.message);
      console.log('⚠️  Os perfis foram criados, mas as roles podem não ter sido definidas corretamente.');
      return;
    }

    console.log(`✅ ${insertedRoles.length} roles inseridas com sucesso!`);

    console.log('\n🎉 Contatos de teste criados com sucesso!');
    console.log('\n📊 Resumo dos contatos criados:');
    console.log('┌─────────────────────────────────────┬─────────────────────────┬─────────────────┐');
    console.log('│ Nome                                │ Cargo                   │ Role            │');
    console.log('├─────────────────────────────────────┼─────────────────────────┼─────────────────┤');
    
    testContacts.forEach(contact => {
      const name = contact.full_name.padEnd(35);
      const cargo = contact.cargo.padEnd(23);
      const role = contact.role.padEnd(15);
      console.log(`│ ${name} │ ${cargo} │ ${role} │`);
    });
    
    console.log('└─────────────────────────────────────┴─────────────────────────┴─────────────────┘');
    
    console.log('\n🌐 Agora você pode acessar a página de contatos em: http://localhost:8080/contatos');
    console.log('🔧 Ou a página de administração em: http://localhost:8080/admin/contatos');

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

createTestContacts();