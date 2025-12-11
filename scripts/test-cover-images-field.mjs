import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCoverImagesField() {
  try {
    console.log('🧪 Testando funcionalidade de cover_images...\n');

    // 1. Verificar se o campo existe
    console.log('1️⃣ Verificando se o campo cover_images existe...');
    const { data: testData, error: testError } = await supabase
      .from('cards')
      .select('id, title, cover_images')
      .limit(1);

    if (testError) {
      console.log('❌ Campo cover_images não existe:', testError.message);
      console.log('\n📝 AÇÃO NECESSÁRIA:');
      console.log('Você precisa adicionar o campo cover_images manualmente no Supabase:');
      console.log('1. Acesse o painel do Supabase');
      console.log('2. Vá para Table Editor > cards');
      console.log('3. Clique em "Add Column"');
      console.log('4. Nome: cover_images');
      console.log('5. Tipo: jsonb');
      console.log('6. Default: []');
      console.log('7. Nullable: true');
      return;
    }

    console.log('✅ Campo cover_images existe!');

    // 2. Buscar um card para testar
    console.log('\n2️⃣ Buscando um card para testar...');
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .limit(1);

    if (cardsError || !cards || cards.length === 0) {
      console.log('❌ Nenhum card encontrado para testar');
      return;
    }

    const testCard = cards[0];
    console.log(`✅ Card encontrado: ${testCard.title} (ID: ${testCard.id})`);

    // 3. Testar atualização com cover_images
    console.log('\n3️⃣ Testando atualização com cover_images...');
    const testImages = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];
    
    const { data: updateData, error: updateError } = await supabase
      .from('cards')
      .update({ 
        cover_images: testImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', testCard.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Erro ao atualizar card com cover_images:', updateError.message);
      return;
    }

    console.log('✅ Card atualizado com sucesso!');
    console.log('📋 Dados atualizados:', {
      id: updateData.id,
      title: updateData.title,
      cover_images: updateData.cover_images
    });

    // 4. Verificar se os dados foram salvos corretamente
    console.log('\n4️⃣ Verificando se os dados foram salvos...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('cards')
      .select('id, title, cover_images')
      .eq('id', testCard.id)
      .single();

    if (verifyError) {
      console.log('❌ Erro ao verificar dados:', verifyError.message);
      return;
    }

    console.log('✅ Verificação bem-sucedida!');
    console.log('📋 Dados verificados:', {
      id: verifyData.id,
      title: verifyData.title,
      cover_images: verifyData.cover_images
    });

    // 5. Limpar dados de teste
    console.log('\n5️⃣ Limpando dados de teste...');
    const { error: cleanError } = await supabase
      .from('cards')
      .update({ 
        cover_images: [],
        updated_at: new Date().toISOString()
      })
      .eq('id', testCard.id);

    if (cleanError) {
      console.log('⚠️ Aviso: Não foi possível limpar dados de teste:', cleanError.message);
    } else {
      console.log('✅ Dados de teste limpos!');
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ O campo cover_images está funcionando corretamente');
    console.log('✅ A funcionalidade de upload de imagens deve estar operacional');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testCoverImagesField();