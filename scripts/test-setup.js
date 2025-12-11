import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ankliiywmcpncymdlvaa.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('🚀 Criando dados de teste...');

  try {
    // 1. Fazer login como usuário de teste
    console.log('🔐 Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'teste@exemplo.com',
      password: '123456'
    });

    if (authError) {
      console.error('❌ Erro ao fazer login:', authError.message);
      console.log('💡 Primeiro execute o registro do usuário ou use a interface web');
      return;
    }

    console.log('✅ Login realizado:', authData.user.email);
    const userId = authData.user.id;

    // 2. Criar board de teste
    const { data: boardData, error: boardError } = await supabase
      .from('boards')
      .insert({
        title: 'Board de Teste - Drag & Drop',
        description: 'Board para testar funcionalidade de drag and drop',
        owner_id: userId
      })
      .select()
      .single();

    if (boardError) {
      console.error('❌ Erro ao criar board:', boardError);
      return;
    }

    console.log('✅ Board criado:', boardData.title, 'ID:', boardData.id);

    // 3. Criar listas de teste
    const lists = [
      { title: 'To Do', position: 0 },
      { title: 'In Progress', position: 1 },
      { title: 'Review', position: 2 },
      { title: 'Done', position: 3 }
    ];

    const createdLists = [];
    for (const list of lists) {
      const { data: listData, error: listError } = await supabase
        .from('board_lists')
        .insert({
          title: list.title,
          position: list.position,
          board_id: boardData.id
        })
        .select()
        .single();

      if (listError) {
        console.error('❌ Erro ao criar lista:', listError);
        continue;
      }

      createdLists.push(listData);
      console.log('✅ Lista criada:', listData.title);
    }

    // 4. Criar cards de teste
    const cards = [
      { title: 'Implementar autenticação', description: 'Configurar login e registro de usuários', listIndex: 0, position: 0 },
      { title: 'Criar componentes UI', description: 'Desenvolver componentes reutilizáveis', listIndex: 0, position: 1 },
      { title: 'Setup do banco de dados', description: 'Configurar tabelas e relacionamentos', listIndex: 1, position: 0 },
      { title: 'Implementar drag & drop', description: 'Funcionalidade de arrastar e soltar cards', listIndex: 1, position: 1 },
      { title: 'Testes unitários', description: 'Escrever testes para componentes', listIndex: 2, position: 0 },
      { title: 'Deploy inicial', description: 'Primeira versão em produção', listIndex: 3, position: 0 }
    ];

    for (const card of cards) {
      const targetList = createdLists[card.listIndex];
      if (!targetList) continue;

      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .insert({
          title: card.title,
          description: card.description,
          position: card.position,
          list_id: targetList.id,
          board_id: boardData.id
        })
        .select()
        .single();

      if (cardError) {
        console.error('❌ Erro ao criar card:', cardError);
        continue;
      }

      console.log('✅ Card criado:', cardData.title, 'na lista', targetList.title);
    }

    console.log('🎉 Dados de teste criados com sucesso!');
    console.log('🔗 Acesse: http://localhost:8080/boards/' + boardData.id);
    console.log('📧 Email: teste@exemplo.com');
    console.log('🔑 Senha: 123456');
    console.log('📋 Board ID:', boardData.id);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestData();