import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente diretamente do .env
const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCoverImagesField() {
  try {
    console.log('🔍 Verificando se existe campo cover_images na tabela cards...\n');

    // Tentar buscar um card com o campo cover_images
    const { data, error } = await supabase
      .from('cards')
      .select('id, title, cover_images, cover_color')
      .limit(1);

    if (error) {
      console.log('❌ Erro ao buscar campo cover_images:', error.message);
      
      // Se o erro for sobre coluna não existir, vamos verificar a estrutura
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('📝 Campo cover_images não existe na tabela cards');
        
        // Vamos ver quais campos existem
        const { data: sampleData, error: sampleError } = await supabase
          .from('cards')
          .select('*')
          .limit(1);
          
        if (sampleError) {
          console.log('❌ Erro ao buscar estrutura da tabela:', sampleError);
        } else if (sampleData && sampleData.length > 0) {
          console.log('📋 Campos disponíveis na tabela cards:');
          Object.keys(sampleData[0]).forEach(field => {
            console.log(`  - ${field}`);
          });
        }
      }
    } else {
      console.log('✅ Campo cover_images existe na tabela cards');
      console.log('📋 Dados encontrados:', data);
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

checkCoverImagesField();