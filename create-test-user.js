import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ankliiywmcpncymdlvaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestUser() {
  console.log('🔄 Criando usuário de teste...');
  
  const email = 'teste@kanban.com';
  const password = 'teste123456';
  
  try {
    // Registrar usuário
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 User ID:', data.user?.id);
    
    if (data.user && !data.user.email_confirmed_at) {
      console.log('⚠️  Email não confirmado. Verifique sua caixa de entrada ou configure confirmação automática no Supabase.');
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

createTestUser();