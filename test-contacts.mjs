import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testContactsQuery() {
  console.log('Testando consulta de contatos...');
  
  try {
    // Teste 1: Consulta simples
    const { data: profiles1, error: error1 } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Teste 1 - Consulta simples:');
    console.log('Erro:', error1);
    console.log('Dados:', profiles1?.length || 0, 'contatos encontrados');
    
    if (profiles1 && profiles1.length > 0) {
      console.log('Primeiro contato:', profiles1[0]);
    }

    // Teste 2: Consulta com roles
    const { data: profiles2, error: error2 } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (
          role
        )
      `)
      .order('created_at', { ascending: false });

    console.log('\nTeste 2 - Consulta com roles:');
    console.log('Erro:', error2);
    console.log('Dados:', profiles2?.length || 0, 'contatos encontrados');
    
    if (profiles2 && profiles2.length > 0) {
      console.log('Primeiro contato com role:', profiles2[0]);
    }

    // Teste 3: Verificar tabela user_roles
    const { data: roles, error: error3 } = await supabase
      .from('user_roles')
      .select('*');

    console.log('\nTeste 3 - Tabela user_roles:');
    console.log('Erro:', error3);
    console.log('Dados:', roles?.length || 0, 'roles encontradas');

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testContactsQuery();