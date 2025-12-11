import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Carregar variáveis de ambiente do arquivo .env
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/"/g, '');
    }
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingProfiles() {
  console.log('🔍 Verificando perfis existentes na tabela profiles...\n');

  try {
    // Buscar todos os perfis existentes
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar perfis:', error.message);
      return;
    }

    if (profiles && profiles.length > 0) {
      console.log(`✅ Encontrados ${profiles.length} perfis na tabela:`);
      console.log('\n📋 Estrutura das colunas (baseada nos dados existentes):');
      
      const firstProfile = profiles[0];
      Object.keys(firstProfile).forEach(column => {
        const value = firstProfile[column];
        const type = value === null ? 'null' : typeof value;
        console.log(`  - ${column}: ${type} (exemplo: ${value})`);
      });

      console.log('\n👥 Lista de perfis existentes:');
      profiles.forEach((profile, index) => {
        console.log(`\n${index + 1}. ${profile.full_name || 'Nome não definido'}`);
        console.log(`   Email: ${profile.email || 'N/A'}`);
        console.log(`   Cargo: ${profile.cargo || 'N/A'}`);
        console.log(`   Role: ${profile.role || 'N/A'}`);
        console.log(`   ID: ${profile.id}`);
      });

    } else {
      console.log('📋 Nenhum perfil encontrado na tabela profiles');
      console.log('⚠️  Isso pode indicar que:');
      console.log('   - A tabela está vazia');
      console.log('   - As políticas RLS estão bloqueando o acesso');
      console.log('   - Você não tem permissão para ver os dados');
    }

  } catch (error) {
    console.error('💥 Erro durante a verificação:', error.message);
  }
}

checkExistingProfiles();