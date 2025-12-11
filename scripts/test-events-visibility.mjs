import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ankliiywmcpncymdlvaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFua2xpaXl3bWNwbmN5bWRsdmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzM3MTksImV4cCI6MjA2MzQ0OTcxOX0.qnn4dyNlg7Cpf9is8OlFjxwksg1PqCTm6TR4H1Ze6Bo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const USER_A = { email: 'joao@exemplo.com', password: '123456' };
const USER_B = { email: 'maria@exemplo.com', password: '123456' };

async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login failed for ${email}: ${error.message}`);
  return data.user;
}

async function logout() {
  await supabase.auth.signOut();
}

async function createEventAs(user, title) {
  const start = new Date();
  const end = new Date(Date.now() + 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('events')
    .insert([
      {
        title,
        description: 'Evento de teste de visibilidade',
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        all_day: false,
        location: 'Teste',
        created_by: user.id,
      },
    ])
    .select('id, title, created_by')
    .single();

  if (error) throw new Error(`Failed to create event: ${error.message}`);
  return data;
}

async function listEventsVisibleTo(userLabel) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true });
  if (error) throw new Error(`Failed to list events for ${userLabel}: ${error.message}`);
  return data || [];
}

async function main() {
  console.log('🔐 Logando como Usuário A (João)...');
  const userA = await login(USER_A);
  console.log('✅ João logado:', userA.id);

  console.log('📝 Criando evento na Agenda como João...');
  const created = await createEventAs(userA, `Teste Visibilidade ${new Date().toISOString()}`);
  console.log('✅ Evento criado:', created);

  console.log('📋 Listando eventos visíveis para João...');
  const eventsForA = await listEventsVisibleTo('João');
  const foundInA = eventsForA.some((e) => e.id === created.id);
  console.log(`👀 João vê o evento criado? ${foundInA ? 'Sim' : 'Não'}`);

  console.log('🔓 Saindo João...');
  await logout();

  console.log('🔐 Logando como Usuário B (Maria)...');
  const userB = await login(USER_B);
  console.log('✅ Maria logada:', userB.id);

  console.log('📋 Listando eventos visíveis para Maria...');
  const eventsForB = await listEventsVisibleTo('Maria');
  const foundInB = eventsForB.some((e) => e.id === created.id);
  console.log(`👀 Maria vê o evento criado por João? ${foundInB ? 'Sim' : 'Não'}`);

  console.log('🔓 Saindo Maria...');
  await logout();

  console.log('\n📊 Resultado final:');
  console.log('- Evento ID:', created.id);
  console.log('- Visível para João:', foundInA);
  console.log('- Visível para Maria:', foundInB);

  if (!foundInB) {
    console.log('\n⚠️ Maria não vê o evento. Possíveis causas:');
    console.log('- Políticas RLS de SELECT em public.events não aplicadas corretamente.');
    console.log("- O app está filtrando os eventos por usuário em algum ponto (ver Agenda.tsx).\n");
  } else {
    console.log('\n✅ Visibilidade ampla funcionando para usuários autenticados.');
  }
}

main().catch((err) => {
  console.error('❌ Erro no teste de visibilidade:', err);
});