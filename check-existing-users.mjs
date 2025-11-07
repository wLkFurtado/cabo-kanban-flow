import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Ler variáveis do arquivo .env
const envContent = readFileSync('.env', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/"/g, '')
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExistingUsers() {
  console.log('👥 Verificando usuários existentes...\n')
  
  try {
    // Tentar buscar perfis existentes (sem autenticação)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10)
    
    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError.message)
    } else {
      console.log(`✅ Encontrados ${profiles?.length || 0} perfis`)
      if (profiles && profiles.length > 0) {
        console.log('📋 Perfis existentes:')
        profiles.forEach((profile, index) => {
          console.log(`  ${index + 1}. ${profile.full_name || 'Sem nome'} (${profile.email || 'Sem email'}) - Role: ${profile.role || 'Sem role'}`)
        })
      }
    }
    
    // Tentar buscar user_roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(10)
    
    if (rolesError) {
      console.error('❌ Erro ao buscar user_roles:', rolesError.message)
    } else {
      console.log(`\n✅ Encontrados ${userRoles?.length || 0} user_roles`)
      if (userRoles && userRoles.length > 0) {
        console.log('📋 User roles existentes:')
        userRoles.forEach((role, index) => {
          console.log(`  ${index + 1}. User ID: ${role.user_id} - Role: ${role.role}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

checkExistingUsers()