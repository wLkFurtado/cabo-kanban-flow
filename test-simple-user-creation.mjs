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

async function testSimpleUserCreation() {
  console.log('🧪 Testando criação simples de usuário...\n')
  
  const testUser = {
    email: `teste-simples-${Date.now()}@exemplo.com`,
    password: '123456',
    full_name: 'Usuário Teste Simples',
    display_name: 'Teste Simples'
  }
  
  try {
    // 1. Criar apenas o usuário de autenticação
    console.log('1️⃣ Criando usuário de autenticação...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.full_name
        },
        emailRedirectTo: undefined
      }
    })
    
    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message)
      return
    }
    
    console.log('✅ Usuário criado:', {
      id: authData.user?.id,
      email: authData.user?.email,
      confirmed: authData.user?.email_confirmed_at ? 'Sim' : 'Não'
    })
    
    // 2. Fazer login imediatamente (mesmo sem confirmação)
    console.log('\n2️⃣ Tentando fazer login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })
    
    if (loginError) {
      console.log('⚠️ Login falhou:', loginError.message)
      if (loginError.message.includes('Email not confirmed')) {
        console.log('💡 Email precisa ser confirmado')
      }
    } else {
      console.log('✅ Login bem-sucedido!')
      
      // 3. Agora que estamos logados, tentar criar o perfil
      console.log('\n3️⃣ Criando perfil enquanto logado...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: testUser.email,
          full_name: testUser.full_name,
          display_name: testUser.display_name,
          role: 'user'
        })
        .select()
        .single()
      
      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError.message)
      } else {
        console.log('✅ Perfil criado:', profileData)
      }
      
      // Fazer logout
      await supabase.auth.signOut()
    }
    
    console.log('\n📊 Resumo do teste:')
    console.log('- Usuário de autenticação: ✅ Criado')
    console.log('- Login:', loginError ? '❌ Falhou' : '✅ Sucesso')
    console.log('- Perfil:', loginError ? '⏭️ Não testado' : (profileError ? '❌ Falhou' : '✅ Criado'))
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testSimpleUserCreation()