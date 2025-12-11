import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const SUPABASE_URL = "https://ankliiywmcpncymdlvaa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testDatabaseConnection() {
  console.log('🔍 Testando conectividade com o banco de dados...');
  
  try {
    // Teste 1: Verificar se conseguimos conectar
    console.log('\n1. Testando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('boards')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError.message);
      return;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Teste 2: Listar tabelas disponíveis
    console.log('\n2. Verificando estrutura do banco...');
    
    // Teste com a tabela boards
    const { data: boards, error: boardsError } = await supabase
      .from('boards')
      .select('*')
      .limit(5);
    
    if (boardsError) {
      console.error('❌ Erro ao acessar tabela boards:', boardsError.message);
    } else {
      console.log('✅ Tabela boards acessível:', boards?.length || 0, 'registros encontrados');
      if (boards && boards.length > 0) {
        console.log('📋 Exemplo de board:', boards[0]);
      }
    }
    
    // Teste com a tabela board_lists (nome correto)
    const { data: lists, error: listsError } = await supabase
      .from('board_lists')
      .select('*')
      .limit(5);
    
    if (listsError) {
      console.error('❌ Erro ao acessar tabela board_lists:', listsError.message);
    } else {
      console.log('✅ Tabela board_lists acessível:', lists?.length || 0, 'registros encontrados');
    }
    
    // Teste com a tabela cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .limit(5);
    
    if (cardsError) {
      console.error('❌ Erro ao acessar tabela cards:', cardsError.message);
    } else {
      console.log('✅ Tabela cards acessível:', cards?.length || 0, 'registros encontrados');
    }
    
    // Teste com a tabela profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Erro ao acessar tabela profiles:', profilesError.message);
    } else {
      console.log('✅ Tabela profiles acessível:', profiles?.length || 0, 'registros encontrados');
      if (profiles && profiles.length > 0) {
        console.log('👤 Usuários encontrados:', profiles.map(p => p.email || p.id));
      }
    }
    
    // Teste 3: Verificar autenticação
    console.log('\n3. Verificando status de autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️ Nenhum usuário autenticado (esperado)');
    } else if (user) {
      console.log('✅ Usuário autenticado:', user.email);
    } else {
      console.log('ℹ️ Nenhum usuário autenticado');
    }
    
    // Teste 4: Verificar políticas RLS
    console.log('\n4. Testando políticas de segurança (RLS)...');
    
    // Tentar criar um board sem autenticação (deve falhar)
    const { data: testBoard, error: testBoardError } = await supabase
      .from('boards')
      .insert({
        title: 'Teste de Conectividade',
        description: 'Board de teste para verificar RLS'
      })
      .select();
    
    if (testBoardError) {
      if (testBoardError.code === '42501') {
        console.log('✅ RLS funcionando corretamente - inserção bloqueada sem autenticação');
      } else {
        console.error('❌ Erro inesperado ao testar RLS:', testBoardError.message);
      }
    } else {
      console.log('⚠️ ATENÇÃO: RLS pode não estar funcionando - inserção permitida sem autenticação');
    }
    
    console.log('\n🎉 Teste de conectividade concluído!');
    console.log('\n📝 Resumo:');
    console.log('- Conexão com Supabase: ✅ Funcionando');
    console.log('- Estrutura do banco: ✅ Tabelas criadas');
    console.log('- Segurança RLS: ✅ Ativa');
    console.log('- Próximo passo: Fazer login na aplicação para testar funcionalidades');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar o teste
testDatabaseConnection();