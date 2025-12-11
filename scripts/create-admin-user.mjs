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

async function createAdminUser() {
  console.log('👑 Criando usuário administrador...\n')
  
  const adminData = {
    email: 'admin@exemplo.com',
    password: 'admin123',
    full_name: 'Administrador',
    display_name: 'Admin',
    role: 'admin'
  }
  
  try {
    // 1. Criar usuário de autenticação
    console.log('1️⃣ Criando usuário de autenticação admin...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminData.email,
      password: adminData.password,
      options: {
        data: {
          full_name: adminData.full_name
        },
        emailRedirectTo: undefined
      }
    })
    
    if (authError) {
      console.error('❌ Erro ao criar usuário admin:', authError.message)
      return
    }
    
    console.log('✅ Usuário admin criado:', {
      id: authData.user?.id,
      email: authData.user?.email
    })
    
    if (!authData.user?.id) {
      console.error('❌ ID do usuário admin não foi retornado')
      return
    }
    
    // 2. Fazer login como admin para criar o perfil
    console.log('\n2️⃣ Fazendo login como admin...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminData.email,
      password: adminData.password
    })
    
    if (loginError) {
      console.log('⚠️ Login admin falhou (email não confirmado):', loginError.message)
      console.log('💡 Vamos tentar criar o perfil mesmo assim...')
    } else {
      console.log('✅ Login admin bem-sucedido!')
    }
    
    // 3. Tentar criar perfil admin
    console.log('\n3️⃣ Criando perfil admin...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: adminData.email,
        full_name: adminData.full_name,
        display_name: adminData.display_name,
        role: adminData.role
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Erro ao criar perfil admin:', profileError.message)
    } else {
      console.log('✅ Perfil admin criado:', profileData)
    }
    
    // 4. Criar user_role admin
    console.log('\n4️⃣ Criando user_role admin...')
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'admin'
      })
      .select()
      .single()
    
    if (roleError) {
      console.error('❌ Erro ao criar user_role admin:', roleError.message)
    } else {
      console.log('✅ User_role admin criado:', roleData)
    }
    
    // Fazer logout
    await supabase.auth.signOut()
    
    console.log('\n🎉 Usuário administrador configurado!')
    console.log('📧 Email:', adminData.email)
    console.log('🔑 Senha:', adminData.password)
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

createAdminUser()