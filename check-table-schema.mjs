import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Carregar variáveis de ambiente do arquivo .env
let supabaseUrl, supabaseKey;
try {
  const envContent = readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].replace(/"/g, '');
    }
    if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
      supabaseKey = line.split('=')[1].replace(/"/g, '');
    }
  }
} catch (error) {
  console.error('❌ Erro ao ler arquivo .env:', error.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verificando estrutura da tabela profiles...\n');

async function checkTableSchema() {
  try {
    // Primeiro, vamos tentar fazer login para ter acesso
    console.log('1️⃣ Criando usuário temporário para acesso...');
    const testEmail = `temp-${Date.now()}@exemplo.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'senha123456'
    });

    if (authError) {
      console.log('❌ Erro ao criar usuário:', authError.message);
      return;
    }

    console.log('✅ Usuário temporário criado');

    // Agora vamos tentar inserir sem a coluna cargo para ver quais colunas existem
    console.log('\n2️⃣ Testando inserção sem coluna cargo...');
    const profileDataWithoutCargo = {
      id: authData.user.id,
      email: testEmail,
      full_name: 'Teste Schema',
      phone: '(11) 99999-9999',
      role: 'user'
    };

    const { data: insertData1, error: insertError1 } = await supabase
      .from('profiles')
      .insert(profileDataWithoutCargo)
      .select();

    if (insertError1) {
      console.log('❌ Erro sem cargo:', insertError1.message);
    } else {
      console.log('✅ Inserção sem cargo funcionou:', insertData1);
    }

    // Agora vamos tentar com a coluna cargo
    console.log('\n3️⃣ Testando inserção com coluna cargo...');
    const profileDataWithCargo = {
      id: authData.user.id,
      email: testEmail,
      full_name: 'Teste Schema',
      phone: '(11) 99999-9999',
      cargo: 'Testador',
      role: 'user'
    };

    const { data: insertData2, error: insertError2 } = await supabase
      .from('profiles')
      .upsert(profileDataWithCargo)
      .select();

    if (insertError2) {
      console.log('❌ Erro com cargo:', insertError2.message);
    } else {
      console.log('✅ Inserção com cargo funcionou:', insertData2);
    }

    // Vamos tentar buscar informações sobre a estrutura da tabela
    console.log('\n4️⃣ Verificando dados existentes...');
    const { data: existingData, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ Erro ao buscar dados:', selectError.message);
    } else {
      console.log('📊 Dados existentes:', existingData);
      if (existingData && existingData.length > 0) {
        console.log('🔑 Colunas disponíveis:', Object.keys(existingData[0]));
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkTableSchema();