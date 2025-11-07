import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://ankliiywmcpncymdlvaa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function createDemoData() {
  console.log('🎯 Criando dados de demonstração...');
  
  try {
    // Vamos criar um usuário único para cada execução
    const timestamp = Date.now();
    const demoEmail = `demo${timestamp}@kanban.com`;
    const demoPassword = 'demo123456';
    
    console.log('\n1. Criando usuário de demonstração...');
    console.log('📧 Email:', demoEmail);
    
    // Criar usuário
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: {
        data: {
          display_name: 'Usuário Demo',
          phone: '(11) 99999-9999'
        }
      }
    });
    
    if (signUpError) {
      console.error('❌ Erro ao criar usuário:', signUpError.message);
      return;
    }
    
    console.log('✅ Usuário criado:', signUpData.user?.email);
    
    // Para demonstração, vamos simular que o email foi confirmado
    // e tentar fazer login (isso pode falhar, mas vamos tentar)
    console.log('\n2. Tentando fazer login...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword
    });
    
    if (loginError) {
      console.log('⚠️ Login falhou (esperado - email não confirmado):', loginError.message);
      console.log('\n📝 Para testar a aplicação:');
      console.log('1. Acesse: http://localhost:8081');
      console.log('2. Clique em "Registrar"');
      console.log('3. Use um email real que você possa confirmar');
      console.log('4. Ou use o email de teste: teste@kanban.com (se já confirmado)');
      console.log('\n💡 Alternativamente, vou mostrar como a estrutura do banco funciona...');
      
      // Mostrar estrutura do banco
      await showDatabaseStructure();
      return;
    }
    
    console.log('✅ Login realizado!');
    const userId = loginData.user.id;
    
    // Criar dados de teste
    await createTestDataForUser(userId, demoEmail);
    
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

async function showDatabaseStructure() {
  console.log('\n🏗️ Estrutura do banco de dados:');
  
  try {
    // Verificar tabelas existentes
    const tables = ['profiles', 'boards', 'board_lists', 'cards'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Tabela existe e acessível`);
      }
    }
    
    console.log('\n📋 Exemplo de como criar dados manualmente na aplicação:');
    console.log('1. Faça login na aplicação');
    console.log('2. Clique em "Criar Board"');
    console.log('3. Adicione listas: "A Fazer", "Em Progresso", "Concluído"');
    console.log('4. Adicione cards nas listas');
    console.log('5. Teste o drag and drop entre listas');
    
  } catch (error) {
    console.error('Erro ao verificar estrutura:', error);
  }
}

async function createTestDataForUser(userId, email) {
  console.log('\n3. Criando dados de teste...');
  
  try {
    // Criar perfil se não existir
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        display_name: 'Usuário Demo',
        phone: '(11) 99999-9999'
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message);
      return;
    }
    
    console.log('✅ Perfil criado/atualizado');
    
    // Criar board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .insert({
        title: 'Projeto Demo - Kanban',
        description: 'Board de demonstração com dados de exemplo',
        visibility: 'private',
        owner_id: userId
      })
      .select()
      .single();
    
    if (boardError) {
      console.error('❌ Erro ao criar board:', boardError.message);
      return;
    }
    
    console.log('✅ Board criado:', board.title);
    
    // Criar listas
    const lists = [
      { title: 'A Fazer', position: 1, color: '#ef4444' },
      { title: 'Em Progresso', position: 2, color: '#f59e0b' },
      { title: 'Concluído', position: 3, color: '#10b981' }
    ];
    
    const createdLists = [];
    
    for (const listData of lists) {
      const { data: list, error: listError } = await supabase
        .from('board_lists')
        .insert({
          board_id: board.id,
          ...listData
        })
        .select()
        .single();
      
      if (listError) {
        console.error('❌ Erro ao criar lista:', listError.message);
        continue;
      }
      
      createdLists.push(list);
      console.log('✅ Lista criada:', list.title);
    }
    
    // Criar alguns cards
    const cards = [
      { listIndex: 0, title: 'Tarefa 1', description: 'Primeira tarefa de exemplo', priority: 'high' },
      { listIndex: 0, title: 'Tarefa 2', description: 'Segunda tarefa de exemplo', priority: 'medium' },
      { listIndex: 1, title: 'Tarefa em progresso', description: 'Tarefa sendo executada', priority: 'high' },
      { listIndex: 2, title: 'Tarefa concluída', description: 'Tarefa finalizada', priority: 'low', completed: true }
    ];
    
    for (let i = 0; i < cards.length; i++) {
      const cardData = cards[i];
      const list = createdLists[cardData.listIndex];
      
      if (!list) continue;
      
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
        console.error('❌ Erro ao criar card:', cardError.message);
        continue;
      }
      
      console.log('✅ Card criado:', card.title);
    }
    
    console.log('\n🎉 Dados de demonstração criados com sucesso!');
    console.log('📧 Email:', email);
    console.log('🔑 Senha:', 'demo123456');
    console.log('🌐 Acesse: http://localhost:8081');
    
  } catch (error) {
    console.error('Erro ao criar dados:', error);
  }
}

// Executar
createDemoData();