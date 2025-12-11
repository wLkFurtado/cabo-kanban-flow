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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserCreation() {
  console.log('🔍 Testando criação de usuário completo...\n')
  
  const testEmail = `teste-${Date.now()}@exemplo.com`
  const testPassword = '123456'
  const testName = 'Usuário Teste'
  
  try {
    // 1. Criar usuário de autenticação
    console.log('1️⃣ Criando usuário de autenticação...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        }
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
    
    // 2. Verificar se perfil foi criado automaticamente
    console.log('\n2️⃣ Verificando criação automática de perfil...')
    
    if (authData.user?.id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      
      if (profileError) {
        console.log('⚠️ Perfil não foi criado automaticamente:', profileError.message)
        
        // 3. Tentar criar perfil manualmente
        console.log('\n3️⃣ Tentando criar perfil manualmente...')
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: testEmail,
            full_name: testName,
            display_name: testName,
            role: 'user'
          })
          .select()
          .single()
        
        if (createError) {
          console.error('❌ Erro ao criar perfil:', createError.message)
        } else {
          console.log('✅ Perfil criado manualmente:', newProfile)
        }
      } else {
        console.log('✅ Perfil criado automaticamente:', profile)
      }
    }
    
    // 4. Testar login
    console.log('\n4️⃣ Testando login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (loginError) {
      console.log('⚠️ Login falhou:', loginError.message)
      if (loginError.message.includes('Email not confirmed')) {
        console.log('💡 Solução: Confirmar email no Supabase Dashboard ou desabilitar confirmação')
      }
    } else {
      console.log('✅ Login bem-sucedido!')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testUserCreation()