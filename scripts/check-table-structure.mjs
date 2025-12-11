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

async function checkTableStructure() {
  try {
    // 1. Tentar inserir um perfil simples sem a coluna cargo
    console.log('1️⃣ Testando inserção sem coluna cargo...');
    const testData = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'teste-estrutura@exemplo.com',
      full_name: 'Teste Estrutura',
      role: 'user'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('profiles')
      .insert(testData)
      .select();

    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      console.log('📋 Código do erro:', insertError.code);
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📄 Dados inseridos:', insertResult[0]);
      
      // Limpar o teste
      await supabase.from('profiles').delete().eq('id', testData.id);
    }

    // 2. Tentar buscar dados existentes para ver a estrutura
    console.log('\n2️⃣ Buscando dados existentes...');
    const { data: existingData, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ Erro na busca:', selectError.message);
    } else {
      if (existingData && existingData.length > 0) {
        console.log('✅ Dados encontrados!');
        console.log('📊 Estrutura da tabela (colunas disponíveis):');
        const columns = Object.keys(existingData[0]);
        columns.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col}: ${typeof existingData[0][col]} (${existingData[0][col]})`);
        });
      } else {
        console.log('⚠️  Nenhum dado encontrado na tabela');
      }
    }

    // 3. Tentar buscar apenas colunas básicas
    console.log('\n3️⃣ Testando busca com colunas básicas...');
    const { data: basicData, error: basicError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role');

    if (basicError) {
      console.log('❌ Erro na busca básica:', basicError.message);
    } else {
      console.log(`✅ Busca básica bem-sucedida! Encontrados ${basicData?.length || 0} registros`);
      if (basicData && basicData.length > 0) {
        basicData.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.full_name || profile.email} (${profile.role || 'sem role'})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkTableStructure();