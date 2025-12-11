import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

// Inserir perfis de teste (sem campo cargo por enquanto)
const testProfiles = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    full_name: 'João Silva',
    display_name: 'João',
    email: 'joao@exemplo.com',
    phone: '(11) 99999-1111',
    role: 'user'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Maria Santos',
    display_name: 'Maria',
    email: 'maria@exemplo.com',
    phone: '(11) 99999-2222',
    role: 'user'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    full_name: 'Pedro Costa',
    display_name: 'Pedro',
    email: 'pedro@exemplo.com',
    phone: '(11) 99999-3333',
    role: 'admin'
  }
];

async function insertTestProfiles() {
  console.log('Inserindo contatos de teste...');
  
  try {
    // Inserir contatos na tabela profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .insert(testProfiles.map(contact => ({
        id: contact.id,
        full_name: contact.full_name,
        display_name: contact.display_name,
        email: contact.email,
        phone: contact.phone,
        role: contact.role
      })))
      .select();

    if (profilesError) {
      console.error('Erro ao inserir profiles:', profilesError);
      return;
    }

    console.log('Profiles inseridos com sucesso!');

    // Inserir roles na tabela user_roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .insert(testProfiles.map(contact => ({
        user_id: contact.id,
        role: contact.role
      })))
      .select();

    if (rolesError) {
      console.error('Erro ao inserir roles:', rolesError);
      return;
    }

    console.log('Roles inseridas com sucesso!');
    console.log(`${testProfiles.length} contatos de teste inseridos com sucesso!`);

    // Verificar se os dados foram inseridos
    const { data: checkProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', testProfiles.map(p => p.id));

    if (checkError) {
      console.error('Erro ao verificar profiles:', checkError);
    } else {
      console.log('Profiles verificados:', checkProfiles);
    }

  } catch (err) {
    console.error('Erro:', err);
  }
}

insertTestProfiles();