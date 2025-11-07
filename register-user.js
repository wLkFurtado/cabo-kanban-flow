import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ankliiywmcpncymdlvaa.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function registerUser() {
  console.log('🚀 Registrando usuário de teste...');

  const { data, error } = await supabase.auth.signUp({
    email: 'teste@exemplo.com',
    password: '123456',
    options: {
      data: {
        full_name: 'Usuário Teste'
      }
    }
  });

  if (error) {
    console.error('❌ Erro:', error.message);
  } else {
    console.log('✅ Usuário registrado:', data.user?.email);
    console.log('📧 Verifique o email para confirmar (ou use interface web)');
  }
}

registerUser();