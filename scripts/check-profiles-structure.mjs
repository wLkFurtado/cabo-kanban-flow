import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesStructure() {
  console.log('Verificando estrutura da tabela profiles...');
  
  try {
    // Tentar buscar um registro para ver quais campos existem
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Erro ao consultar profiles:', error);
    } else {
      console.log('Dados encontrados:', data);
      if (data && data.length > 0) {
        console.log('Campos disponíveis:', Object.keys(data[0]));
      } else {
        console.log('Nenhum registro encontrado na tabela profiles');
      }
    }
    
    // Tentar inserir um registro simples para ver quais campos são aceitos
    console.log('\nTestando inserção com campos básicos...');
    const testProfile = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      full_name: 'Teste',
      email: 'teste@exemplo.com'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select();
    
    if (insertError) {
      console.log('Erro ao inserir perfil de teste:', insertError);
    } else {
      console.log('Perfil de teste inserido com sucesso:', insertData);
      
      // Remover o perfil de teste
      await supabase
        .from('profiles')
        .delete()
        .eq('id', '550e8400-e29b-41d4-a716-446655440000');
      console.log('Perfil de teste removido');
    }
    
    // Testar inserção com campo cargo
    console.log('\nTestando inserção com campo cargo...');
    const testProfileWithCargo = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      full_name: 'Teste Cargo',
      email: 'teste.cargo@exemplo.com',
      cargo: 'Desenvolvedor'
    };
    
    const { data: insertCargoData, error: insertCargoError } = await supabase
      .from('profiles')
      .insert(testProfileWithCargo)
      .select();
    
    if (insertCargoError) {
      console.log('Erro ao inserir perfil com cargo:', insertCargoError);
    } else {
      console.log('Perfil com cargo inserido com sucesso:', insertCargoData);
      
      // Remover o perfil de teste
      await supabase
        .from('profiles')
        .delete()
        .eq('id', '550e8400-e29b-41d4-a716-446655440001');
      console.log('Perfil com cargo removido');
    }
    
  } catch (err) {
    console.error('Erro:', err);
  }
}

checkProfilesStructure();