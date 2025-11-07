import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://ankliiywmcpncymdlvaa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Credenciais do usuário de teste
const TEST_EMAIL = 'teste@kanban.com';
const TEST_PASSWORD = 'teste123456';

async function createTestDataComplete() {
  console.log('🚀 Iniciando criação completa de dados de teste...');
  
  try {
    // Passo 1: Criar usuário de teste
    console.log('\n1. Criando usuário de teste...');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          display_name: 'Usuário de Teste',
          phone: '(11) 99999-9999'
        }
      }
    });
    
    if (signUpError && signUpError.message !== 'User already registered') {
      console.error('❌ Erro ao criar usuário:', signUpError.message);
      return;
    }
    
    if (signUpData.user) {
      console.log('✅ Usuário criado/encontrado:', signUpData.user.email);
    }
    
    // Passo 2: Fazer login
    console.log('\n2. Fazendo login...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      console.log('ℹ️ Talvez seja necessário confirmar o email primeiro');
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    const userId = loginData.user.id;
    console.log('👤 ID do usuário:', userId);
    
    // Passo 3: Verificar/criar perfil
    console.log('\n3. Verificando perfil do usuário...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code === 'PGRST116') {
      // Perfil não existe, vamos criar
      console.log('📝 Criando perfil...');
      
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: TEST_EMAIL,
          display_name: 'Usuário de Teste',
          phone: '(11) 99999-9999'
        })
        .select()
        .single();
      
      if (createProfileError) {
        console.error('❌ Erro ao criar perfil:', createProfileError.message);
        return;
      }
      
      console.log('✅ Perfil criado:', newProfile);
    } else if (profile) {
      console.log('✅ Perfil encontrado:', profile);
    }
    
    // Passo 4: Criar board de teste
    console.log('\n4. Criando board de teste...');
    
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({
        title: 'Projeto Kanban - Teste',
        description: 'Board de teste para demonstrar funcionalidades do sistema Kanban',
        visibility: 'private',
        owner_id: userId
      })
      .select()
      .single();
    
    if (boardError) {
      console.error('❌ Erro ao criar board:', boardError.message);
      return;
    }
    
    console.log('✅ Board criado:', board.title, '(ID:', board.id + ')');
    
    // Passo 5: Criar listas do board
    console.log('\n5. Criando listas do board...');
    
    const lists = [
      { title: 'A Fazer', position: 1, color: '#ef4444' },
      { title: 'Em Progresso', position: 2, color: '#f59e0b' },
      { title: 'Em Revisão', position: 3, color: '#3b82f6' },
      { title: 'Concluído', position: 4, color: '#10b981' }
    ];
    
    const createdLists = [];
    
    for (const listData of lists) {
      const { data: list, error: listError } = await supabase
        .from('board_lists')
        .insert({
          board_id: board.id,
          title: listData.title,
          position: listData.position,
          color: listData.color
        })
        .select()
        .single();
      
      if (listError) {
        console.error('❌ Erro ao criar lista', listData.title + ':', listError.message);
        continue;
      }
      
      createdLists.push(list);
      console.log('✅ Lista criada:', list.title);
    }
    
    // Passo 6: Criar cards de exemplo
    console.log('\n6. Criando cards de exemplo...');
    
    const cardsData = [
      {
        listIndex: 0, // A Fazer
        cards: [
          {
            title: 'Implementar autenticação de usuários',
            description: 'Criar sistema de login e registro com Supabase Auth',
            priority: 'high'
          },
          {
            title: 'Configurar banco de dados',
            description: 'Definir esquema das tabelas e políticas RLS',
            priority: 'high'
          },
          {
            title: 'Criar interface de usuário',
            description: 'Desenvolver componentes React para o Kanban',
            priority: 'medium'
          }
        ]
      },
      {
        listIndex: 1, // Em Progresso
        cards: [
          {
            title: 'Implementar drag and drop',
            description: 'Adicionar funcionalidade de arrastar e soltar cards',
            priority: 'medium'
          },
          {
            title: 'Testes de integração',
            description: 'Criar testes para validar funcionalidades',
            priority: 'low'
          }
        ]
      },
      {
        listIndex: 2, // Em Revisão
        cards: [
          {
            title: 'Documentação da API',
            description: 'Documentar endpoints e estrutura do banco',
            priority: 'low'
          }
        ]
      },
      {
        listIndex: 3, // Concluído
        cards: [
          {
            title: 'Setup inicial do projeto',
            description: 'Configurar Vite, React, TypeScript e Tailwind',
            priority: 'medium',
            completed: true
          },
          {
            title: 'Configurar Supabase',
            description: 'Integrar projeto com Supabase',
            priority: 'high',
            completed: true
          }
        ]
      }
    ];
    
    let totalCards = 0;
    
    for (const listCards of cardsData) {
      const list = createdLists[listCards.listIndex];
      if (!list) continue;
      
      for (let i = 0; i < listCards.cards.length; i++) {
        const cardData = listCards.cards[i];
        
        const { data: card, error: cardError } = await supabase
          .from('cards')
          .insert({
            list_id: list.id,
            title: cardData.title,
            description: cardData.description,
            position: i + 1,
            priority: cardData.priority,
            completed: cardData.completed || false,
            created_by: userId
          })
          .select()
          .single();
        
        if (cardError) {
          console.error('❌ Erro ao criar card', cardData.title + ':', cardError.message);
          continue;
        }
        
        totalCards++;
        console.log('✅ Card criado:', card.title, 'em', list.title);
      }
    }
    
    // Resumo final
    console.log('\n🎉 Dados de teste criados com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('- Usuário:', TEST_EMAIL);
    console.log('- Board:', board.title);
    console.log('- Listas:', createdLists.length);
    console.log('- Cards:', totalCards);
    console.log('\n🌐 Acesse a aplicação em: http://localhost:8081');
    console.log('📧 Email:', TEST_EMAIL);
    console.log('🔑 Senha:', TEST_PASSWORD);
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar a criação de dados
createTestDataComplete();