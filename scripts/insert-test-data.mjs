import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ankliiywmcpncymdlvaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestData() {
  console.log('🚀 Inserindo dados de teste...');

  try {
    // 1. Criar um board de teste
    console.log('📋 Criando board de teste...');
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({
        title: 'Board de Teste',
        description: 'Board para testar drag and drop',
        owner_id: '00000000-0000-0000-0000-000000000000' // UUID fictício
      })
      .select()
      .single();

    if (boardError) {
      console.error('❌ Erro ao criar board:', boardError);
      return;
    }

    console.log('✅ Board criado:', board);

    // 2. Criar listas de teste
    console.log('📝 Criando listas de teste...');
    const lists = [
      { title: 'To Do', position: 0, color: '#ef4444' },
      { title: 'In Progress', position: 1, color: '#f59e0b' },
      { title: 'Done', position: 2, color: '#10b981' }
    ];

    const { data: createdLists, error: listsError } = await supabase
      .from('board_lists')
      .insert(
        lists.map(list => ({
          ...list,
          board_id: board.id
        }))
      )
      .select();

    if (listsError) {
      console.error('❌ Erro ao criar listas:', listsError);
      return;
    }

    console.log('✅ Listas criadas:', createdLists);

    // 3. Criar cards de teste
    console.log('🃏 Criando cards de teste...');
    const cards = [
      { title: 'Card 1', description: 'Primeiro card', position: 0, list_id: createdLists[0].id },
      { title: 'Card 2', description: 'Segundo card', position: 1, list_id: createdLists[0].id },
      { title: 'Card 3', description: 'Terceiro card', position: 0, list_id: createdLists[1].id },
      { title: 'Card 4', description: 'Quarto card', position: 1, list_id: createdLists[1].id },
      { title: 'Card 5', description: 'Quinto card', position: 0, list_id: createdLists[2].id }
    ];

    const { data: createdCards, error: cardsError } = await supabase
      .from('cards')
      .insert(cards)
      .select();

    if (cardsError) {
      console.error('❌ Erro ao criar cards:', cardsError);
      return;
    }

    console.log('✅ Cards criados:', createdCards);

    console.log('\n🎉 Dados de teste inseridos com sucesso!');
    console.log(`📋 Board ID: ${board.id}`);
    console.log(`🔗 URL para testar: http://localhost:8081/board/${board.id}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

insertTestData();