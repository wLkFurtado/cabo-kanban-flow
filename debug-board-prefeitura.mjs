import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://ankliiywmcpncymdlvaa.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo"
);

async function analyzeBoardPrefeitura() {
  console.log('🔍 Analisando board prefeitura...');
  
  try {
    // Buscar o board prefeitura (assumindo que existe um com esse nome)
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id, title, description')
      .ilike('title', '%prefeitura%')
      .maybeSingle();
    
    if (boardError) {
      console.error('❌ Erro ao buscar board:', boardError);
      return;
    }
    
    if (!board) {
      console.log('⚠️ Board prefeitura não encontrado');
      return;
    }
    
    console.log('✅ Board encontrado:', {
      id: board.id,
      title: board.title,
      description: board.description
    });
    
    // Buscar listas do board
    const { data: lists, error: listsError } = await supabase
      .from('board_lists')
      .select('id, title, position')
      .eq('board_id', board.id)
      .order('position');
    
    if (listsError) {
      console.error('❌ Erro ao buscar listas:', listsError);
      return;
    }
    
    console.log(`📋 Encontradas ${lists.length} listas`);
    
    // Buscar cards do board
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select(`
        id, 
        title, 
        description, 
        list_id, 
        position, 
        priority, 
        completed, 
        due_date,
        cover_color, 
        cover_images,
        board_lists!inner ( board_id )
      `)
      .eq('board_lists.board_id', board.id)
      .order('position');
    
    if (cardsError) {
      console.error('❌ Erro ao buscar cards:', cardsError);
      return;
    }
    
    console.log(`📊 Total de cards: ${cards.length}`);
    
    // Analisar cards com imagens
    const cardsWithImages = cards.filter(card => card.cover_images && card.cover_images.length > 0);
    const cardsWithCoverColor = cards.filter(card => card.cover_color);
    
    console.log(`🖼️ Cards com imagens: ${cardsWithImages.length}`);
    console.log(`🎨 Cards com cor de capa: ${cardsWithCoverColor.length}`);
    
    // Analisar tamanho das imagens
    let totalImages = 0;
    let imageUrls = [];
    
    cardsWithImages.forEach(card => {
      if (card.cover_images && card.cover_images.length > 0) {
        totalImages += card.cover_images.length;
        imageUrls.push(...card.cover_images);
      }
    });
    
    console.log(`📸 Total de imagens nos cards: ${totalImages}`);
    
    if (imageUrls.length > 0) {
      console.log('🔗 URLs das imagens (primeiras 5):');
      imageUrls.slice(0, 5).forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
      
      if (imageUrls.length > 5) {
        console.log(`  ... e mais ${imageUrls.length - 5} imagens`);
      }
    }
    
    // Buscar membros do board
    const { data: members, error: membersError } = await supabase
      .from('board_members')
      .select('user_id, profiles(id, full_name, avatar_url)')
      .eq('board_id', board.id);
    
    let membersWithAvatar = [];
    if (membersError) {
      console.error('❌ Erro ao buscar membros:', membersError);
    } else {
      console.log(`👥 Membros do board: ${members.length}`);
      
      membersWithAvatar = members.filter(m => m.profiles?.avatar_url);
      console.log(`👤 Membros com avatar: ${membersWithAvatar.length}`);
      
      if (membersWithAvatar.length > 0) {
        console.log('🖼️ URLs dos avatares (primeiros 3):');
        membersWithAvatar.slice(0, 3).forEach((m, index) => {
          console.log(`  ${index + 1}. ${m.profiles.avatar_url}`);
        });
      }
    }
    
    // Verificar labels dos cards
    const cardIds = cards.map(card => card.id);
    if (cardIds.length > 0) {
      const { data: labels, error: labelsError } = await supabase
        .from('card_labels')
        .select('card_id, name, color')
        .in('card_id', cardIds);
      
      if (!labelsError) {
        console.log(`🏷️ Total de labels: ${labels.length}`);
      }
    }
    
    console.log('\n📈 Resumo da Performance:');
    console.log(`- Total de cards: ${cards.length}`);
    console.log(`- Cards com imagens: ${cardsWithImages.length} (${Math.round((cardsWithImages.length / cards.length) * 100)}%)`);
    console.log(`- Total de imagens: ${totalImages}`);
    console.log(`- Membros com avatar: ${membersWithAvatar.length}`);
    
    if (cards.length > 100) {
      console.log('\n⚠️ ATENÇÃO: Board com muitos cards! Isso pode impactar a performance.');
    }
    
    if (totalImages > 50) {
      console.log('\n⚠️ ATENÇÃO: Muitas imagens carregadas! Isso pode impactar a performance.');
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

// Executar a análise
analyzeBoardPrefeitura();