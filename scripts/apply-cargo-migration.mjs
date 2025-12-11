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

console.log('🔧 Aplicando migração da coluna cargo...\n');

async function applyCargeMigration() {
  try {
    console.log('1️⃣ Verificando se a coluna cargo já existe...');
    
    // Tentar fazer uma consulta simples para verificar se a coluna existe
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('cargo')
      .limit(1);

    if (testError && testError.message.includes('cargo')) {
      console.log('❌ Coluna cargo não existe, aplicando migração...');
      
      // Aplicar a migração usando RPC (se disponível) ou SQL direto
      console.log('2️⃣ Tentando aplicar migração via SQL...');
      
      // Como não temos acesso direto ao SQL, vamos tentar uma abordagem alternativa
      // Vamos criar um usuário temporário e tentar inserir com cargo para forçar a criação
      console.log('⚠️  Não é possível aplicar SQL diretamente via API pública');
      console.log('📋 INSTRUÇÕES MANUAIS:');
      console.log('');
      console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Vá para seu projeto: ankliiywmcpncymdlvaa');
      console.log('3. Clique em "SQL Editor" no menu lateral');
      console.log('4. Execute o seguinte SQL:');
      console.log('');
      console.log('   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo TEXT;');
      console.log('');
      console.log('5. Depois execute as políticas RLS:');
      console.log('');
      console.log('   CREATE POLICY "Authenticated users can view all profiles" ON public.profiles');
      console.log('       FOR SELECT USING (auth.role() = \'authenticated\');');
      console.log('');
      console.log('   CREATE POLICY "Authenticated users can create profiles" ON public.profiles');
      console.log('       FOR INSERT WITH CHECK (auth.role() = \'authenticated\');');
      console.log('');
      console.log('   CREATE POLICY "Users can update own profile" ON public.profiles');
      console.log('       FOR UPDATE USING (auth.uid() = id);');
      console.log('');
      
    } else if (testError) {
      console.log('❌ Erro ao verificar coluna:', testError.message);
    } else {
      console.log('✅ Coluna cargo já existe!');
      console.log('📊 Dados de teste:', testData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

applyCargeMigration();