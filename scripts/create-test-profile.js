import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ankliiywmcpncymdlvaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_USER_ID = '7fc7fb36-c8da-49a1-93f7-217583dca61a';

async function createTestProfile() {
  console.log('🔄 Criando profile de teste...');
  
  try {
    // Inserir profile manualmente
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: TEST_USER_ID,
        email: 'teste@kanban.com',
        full_name: 'Usuário de Teste',
        role: 'user'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erro ao criar profile:', profileError);
      return;
    }

    console.log('✅ Profile criado com sucesso!');
    console.log('📧 Email:', profile.email);
    console.log('👤 Nome:', profile.full_name);
    console.log('🆔 ID:', profile.id);
    console.log('🔑 Role:', profile.role);

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

createTestProfile();