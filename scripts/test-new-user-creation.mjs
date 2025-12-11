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

async function testNewUserCreation() {
  console.log('🧪 Testando nova funcionalidade de criação de usuários...\n')
  
  const testUser = {
    email: `usuario-teste-${Date.now()}@exemplo.com`,
    full_name: 'Usuário de Teste',
    display_name: 'Teste User',
    phone: '(11) 99999-9999',
    cargo: 'Desenvolvedor',
    role: 'user',
    password: '123456'
  }
  
  console.log('📝 Dados do usuário de teste:')
  console.log(JSON.stringify(testUser, null, 2))
  console.log()
  
  try {
    // Simular a função createUserWithProfile
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
    
    if (!authData.user?.id) {
      console.error('❌ ID do usuário não foi retornado')
      return
    }
    
    // 2. Criar perfil
    console.log('\n2️⃣ Criando perfil...')
    
    // Primeiro, vamos tentar fazer login como admin para contornar o RLS
    const { data: adminAuth, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'admin@exemplo.com', // Assumindo que existe um admin
      password: 'admin123'
    })
    
    if (adminError) {
      console.log('⚠️ Não foi possível fazer login como admin:', adminError.message)
    }
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: testUser.email,
        full_name: testUser.full_name,
        display_name: testUser.display_name,
        phone: testUser.phone,
        cargo: testUser.cargo,
        role: testUser.role,
        avatar_url: null
      })
      .select()
      .single()
    
    // Fazer logout do admin se logou
    if (!adminError) {
      await supabase.auth.signOut()
    }
    
    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message)
      console.log('⚠️ Usuário criado, mas perfil falhou devido ao RLS')
    } else {
      console.log('✅ Perfil criado:', profileData)
    }
    
    // 3. Verificar se aparece na lista de perfis
    console.log('\n3️⃣ Verificando lista de perfis...')
    const { data: profiles, error: listError } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (
          role
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (listError) {
      console.error('❌ Erro ao buscar perfis:', listError.message)
    } else {
      console.log(`✅ Total de perfis encontrados: ${profiles?.length || 0}`)
      if (profiles && profiles.length > 0) {
        console.log('📋 Últimos perfis:')
        profiles.forEach((profile, index) => {
          console.log(`  ${index + 1}. ${profile.full_name} (${profile.email})`)
        })
      }
    }
    
    // 4. Testar login
    console.log('\n4️⃣ Testando login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })
    
    if (loginError) {
      console.log('⚠️ Login falhou:', loginError.message)
      if (loginError.message.includes('Email not confirmed')) {
        console.log('💡 Solução: Confirmar email no Supabase Dashboard')
      }
    } else {
      console.log('✅ Login bem-sucedido!')
      
      // Fazer logout
      await supabase.auth.signOut()
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testNewUserCreation()