import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 Aplicando correção na função handle_new_user...\n');

  try {
    console.log('⚠️ IMPORTANTE: Esta migração precisa ser aplicada diretamente no banco de dados');
    console.log('   usando o painel administrativo do Supabase ou CLI com privilégios de admin.\n');
    
    console.log('📋 SQL para executar no Supabase Dashboard > SQL Editor:\n');
    console.log('=' .repeat(60));
    
    const migrationSQL = `-- Fix the handle_new_user function to include the cargo field
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with cargo field support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, cargo)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'cargo'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

    console.log(migrationSQL);
    console.log('=' .repeat(60));
    
    console.log('\n📝 INSTRUÇÕES:');
    console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Vá para o projeto: ankliiywmcpncymdlvaa');
    console.log('3. Clique em "SQL Editor" no menu lateral');
    console.log('4. Cole o SQL acima e execute');
    console.log('5. Volte aqui e execute o teste de criação de usuário\n');

    // Vamos tentar verificar se a função atual existe
    console.log('🔍 Verificando função atual...');
    
    const { data: functions, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_name', 'handle_new_user');

    if (error) {
      console.log('⚠️ Não foi possível verificar a função atual:', error.message);
    } else if (functions && functions.length > 0) {
      console.log('✅ Função handle_new_user encontrada');
      console.log('   Definição atual:', functions[0].routine_definition?.substring(0, 100) + '...');
    } else {
      console.log('❌ Função handle_new_user não encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

applyMigration().catch(console.error);