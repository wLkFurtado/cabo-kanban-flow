import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente diretamente
const supabaseUrl = "https://ankliiywmcpncymdlvaa.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo";

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarStatusRLS() {
  console.log('🔍 Verificando status do RLS e políticas...\n');

  try {
    // 1. Verificar se conseguimos inserir um perfil simples
    console.log('1️⃣ Testando inserção simples...');
    const testUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'teste-rls@exemplo.com',
      full_name: 'Teste RLS',
      cargo: 'Teste Cargo',
      role: 'user'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(testUser)
      .select();

    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      console.log('   Código:', insertError.code);
      console.log('   Detalhes:', insertError.details);
    } else {
      console.log('✅ Inserção bem-sucedida:', insertData);
      
      // Limpar o teste
      await supabase.from('profiles').delete().eq('id', testUser.id);
      console.log('🧹 Registro de teste removido');
    }

    // 2. Verificar se conseguimos ler dados
    console.log('\n2️⃣ Testando leitura de dados...');
    const { data: selectData, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (selectError) {
      console.log('❌ Erro na leitura:', selectError.message);
    } else {
      console.log('✅ Leitura bem-sucedida. Registros encontrados:', selectData?.length || 0);
      if (selectData && selectData.length > 0) {
        console.log('📋 Primeiros registros:');
        selectData.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.full_name} - Cargo: ${profile.cargo || 'N/A'}`);
        });
      }
    }

    // 3. Verificar estrutura da tabela
    console.log('\n3️⃣ Verificando estrutura da tabela...');
    const { data: structureData, error: structureError } = await supabase
      .from('profiles')
      .select('id, email, full_name, cargo, role, created_at')
      .limit(1);

    if (structureError) {
      console.log('❌ Erro ao verificar estrutura:', structureError.message);
      if (structureError.message.includes('cargo')) {
        console.log('⚠️  A coluna "cargo" pode não existir na tabela!');
      }
    } else {
      console.log('✅ Estrutura da tabela verificada com sucesso');
      console.log('📊 Colunas disponíveis: id, email, full_name, cargo, role, created_at');
    }

  } catch (error) {
    console.error('💥 Erro durante verificação:', error.message);
  }
}

verificarStatusRLS();