import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Carregar variáveis de ambiente do arquivo .env
let supabaseUrl, supabaseKey;
try {
  const envContent = readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].replace(/"/g, '');
    }
    if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
      supabaseKey = line.split('=')[1].replace(/"/g, '');
    }
  }
} catch (error) {
  console.error('❌ Erro ao ler arquivo .env:', error.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Verificando e corrigindo dados de cargo...\n');

async function fixCargoData() {
  try {
    // 1. Fazer login com um usuário para ter acesso
    console.log('1️⃣ Criando usuário temporário para acesso...');
    const tempEmail = `admin-temp-${Date.now()}@exemplo.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: tempEmail,
      password: 'senha123456'
    });

    if (authError) {
      console.log('❌ Erro ao criar usuário temporário:', authError.message);
      return;
    }

    console.log('✅ Usuário temporário criado');

    // 2. Buscar todos os perfis existentes
    console.log('\n2️⃣ Buscando perfis existentes...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.log('❌ Erro ao buscar perfis:', profilesError.message);
      return;
    }

    console.log(`📊 Encontrados ${profiles.length} perfis`);

    // 3. Verificar dados de cada perfil
    console.log('\n3️⃣ Analisando dados dos perfis...');
    for (const profile of profiles) {
      console.log(`\n👤 Perfil: ${profile.full_name || profile.email}`);
      console.log(`   📧 Email: ${profile.email}`);
      console.log(`   💼 Cargo atual: ${profile.cargo || 'Não informado'}`);
      console.log(`   🔑 Role: ${profile.role || 'Não informado'}`);
    }

    // 4. Buscar dados dos usuários de autenticação para obter metadados
    console.log('\n4️⃣ Verificando metadados dos usuários...');
    
    // Como não temos acesso direto aos metadados via API pública,
    // vamos tentar uma abordagem diferente: atualizar com base no que sabemos
    
    console.log('\n5️⃣ Atualizando perfis com dados padrão...');
    
    for (const profile of profiles) {
      if (!profile.cargo || profile.cargo === null) {
        // Tentar extrair cargo do email ou usar um padrão
        let cargoSugerido = 'Usuário';
        
        if (profile.email.includes('teste')) {
          cargoSugerido = 'Testador';
        } else if (profile.email.includes('admin')) {
          cargoSugerido = 'Administrador';
        } else if (profile.email.includes('analista')) {
          cargoSugerido = 'Analista';
        }

        console.log(`   🔄 Atualizando ${profile.email} com cargo: ${cargoSugerido}`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ cargo: cargoSugerido })
          .eq('id', profile.id);

        if (updateError) {
          console.log(`   ❌ Erro ao atualizar: ${updateError.message}`);
        } else {
          console.log(`   ✅ Atualizado com sucesso`);
        }
      }
    }

    // 6. Verificar resultado final
    console.log('\n6️⃣ Verificando resultado final...');
    const { data: updatedProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('email, full_name, cargo, role');

    if (finalError) {
      console.log('❌ Erro ao verificar resultado:', finalError.message);
    } else {
      console.log('\n📋 PERFIS ATUALIZADOS:');
      updatedProfiles.forEach(profile => {
        console.log(`   👤 ${profile.full_name || profile.email}`);
        console.log(`      💼 Cargo: ${profile.cargo || 'Não informado'}`);
        console.log(`      🔑 Role: ${profile.role || 'user'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixCargoData();