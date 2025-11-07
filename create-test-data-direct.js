import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ankliiywmcpncymdlvaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ID do usuário de teste (fixo)
const TEST_USER_ID = '7fc7fb36-c8da-49a1-93f7-217583dca61a';

async function createTestDataDirect() {
  console.log('🔄 Criando dados de teste diretamente...');
  
  try {
    // 1. Criar board de teste
    console.log('📋 Criando board de teste...');
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({
        title: 'Projeto de Teste',
        description: 'Board para testar funcionalidades do Kanban',
        owner_id: TEST_USER_ID
      })
      .select()
      .single();

    if (boardError) {
      console.error('❌ Erro ao criar board:', boardError);
      return;
    }

    console.log('✅ Board criado:', board.title);
    const boardId = board.id;

    // 2. Criar listas
    console.log('📝 Criando listas...');
    const lists = [
      { title: 'A Fazer', position: 0 },
      { title: 'Em Progresso', position: 1 },
      { title: 'Em Revisão', position: 2 },
      { title: 'Concluído', position: 3 }
    ];

    const createdLists = [];
    for (const list of lists) {
      const { data: createdList, error: listError } = await supabase
        .from('lists')
        .insert({
          title: list.title,
          position: list.position,
          board_id: boardId
        })
        .select()
        .single();

      if (listError) {
        console.error('❌ Erro ao criar lista:', listError);
        continue;
      }

      console.log(`✅ Lista criada: ${createdList.title}`);
      createdLists.push(createdList);
    }

    // 3. Criar cards de teste
    console.log('🎴 Criando cards de teste...');
    const cardsData = [
      // Cards para "A Fazer"
      {
        title: 'Implementar autenticação',
        description: 'Configurar sistema de login e registro de usuários',
        list_id: createdLists[0].id,
        position: 0,
        priority: 'high'
      },
      {
        title: 'Criar página de dashboard',
        description: 'Desenvolver interface principal do sistema',
        list_id: createdLists[0].id,
        position: 1,
        priority: 'medium'
      },
      {
        title: 'Configurar banco de dados',
        description: 'Estruturar tabelas e relacionamentos',
        list_id: createdLists[0].id,
        position: 2,
        priority: 'high'
      },
      
      // Cards para "Em Progresso"
      {
        title: 'Implementar drag and drop',
        description: 'Adicionar funcionalidade de arrastar e soltar cards',
        list_id: createdLists[1].id,
        position: 0,
        priority: 'medium'
      },
      {
        title: 'Criar componentes de UI',
        description: 'Desenvolver componentes reutilizáveis',
        list_id: createdLists[1].id,
        position: 1,
        priority: 'low'
      },
      
      // Cards para "Em Revisão"
      {
        title: 'Testes unitários',
        description: 'Escrever testes para componentes principais',
        list_id: createdLists[2].id,
        position: 0,
        priority: 'medium'
      },
      
      // Cards para "Concluído"
      {
        title: 'Setup inicial do projeto',
        description: 'Configuração inicial com Vite e React',
        list_id: createdLists[3].id,
        position: 0,
        priority: 'high'
      },
      {
        title: 'Configurar Supabase',
        description: 'Integração com banco de dados Supabase',
        list_id: createdLists[3].id,
        position: 1,
        priority: 'high'
      }
    ];

    for (const cardData of cardsData) {
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert({
          title: cardData.title,
          description: cardData.description,
          list_id: cardData.list_id,
          position: cardData.position,
          priority: cardData.priority,
          assigned_to: TEST_USER_ID
        })
        .select()
        .single();

      if (cardError) {
        console.error('❌ Erro ao criar card:', cardError);
        continue;
      }

      console.log(`✅ Card criado: ${card.title}`);
    }

    console.log('\n🎉 Dados de teste criados com sucesso!');
    console.log('📋 Board:', board.title);
    console.log('📝 Listas:', createdLists.length);
    console.log('🎴 Cards:', cardsData.length);
    console.log('\n🌐 Acesse a aplicação e faça login com:');
    console.log('📧 Email: teste@kanban.com');
    console.log('🔑 Senha: teste123456');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

createTestDataDirect();