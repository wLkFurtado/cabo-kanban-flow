import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCoverImagesField() {
  try {
    console.log('🔧 Adicionando campo cover_images na tabela cards...\n');

    // Executar SQL para adicionar a coluna
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE cards 
        ADD COLUMN IF NOT EXISTS cover_images JSONB DEFAULT '[]'::jsonb;
      `
    });

    if (error) {
      console.log('❌ Erro ao adicionar campo cover_images:', error.message);
      
      // Tentar uma abordagem alternativa usando SQL direto
      console.log('🔄 Tentando abordagem alternativa...');
      
      const { data: altData, error: altError } = await supabase
        .from('cards')
        .select('id')
        .limit(1);
        
      if (altError) {
        console.log('❌ Erro na abordagem alternativa:', altError.message);
        console.log('\n📝 INSTRUÇÕES MANUAIS:');
        console.log('1. Acesse o painel do Supabase');
        console.log('2. Vá para Table Editor > cards');
        console.log('3. Clique em "Add Column"');
        console.log('4. Nome: cover_images');
        console.log('5. Tipo: jsonb');
        console.log('6. Default: []');
        console.log('7. Nullable: true');
      }
    } else {
      console.log('✅ Campo cover_images adicionado com sucesso!');
      
      // Verificar se o campo foi adicionado
      const { data: testData, error: testError } = await supabase
        .from('cards')
        .select('id, cover_images')
        .limit(1);
        
      if (testError) {
        console.log('❌ Erro ao verificar campo:', testError.message);
      } else {
        console.log('✅ Verificação bem-sucedida - campo cover_images está disponível');
      }
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    console.log('\n📝 INSTRUÇÕES MANUAIS:');
    console.log('1. Acesse o painel do Supabase');
    console.log('2. Vá para Table Editor > cards');
    console.log('3. Clique em "Add Column"');
    console.log('4. Nome: cover_images');
    console.log('5. Tipo: jsonb');
    console.log('6. Default: []');
    console.log('7. Nullable: true');
  }
}

addCoverImagesField();