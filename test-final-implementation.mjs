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

async function testFinalImplementation() {
  console.log('🎯 Testando implementação final...\n')
  
  const testUser = {
    email: `usuario-final-${Date.now()}@exemplo.com`,
    password: '123456',
    full_name: 'Usuário Final Teste',
    display_name: 'Final Test',
    phone: '(11) 99999-9999',
    cargo: 'Desenvolvedor',
    role: 'user'
  }
  
  console.log('📝 Dados do usuário de teste:')
  console.log(JSON.stringify(testUser, null, 2))
  console.log()
  
  try {
    // Simular a função createUserWithProfile melhorada
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
    
    // 2. Tentar fazer login imediatamente
    console.log('\n2️⃣ Tentando login imediato...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })
    
    let profileCreated = false
    let profileResult = null
    
    if (!loginError) {
      console.log('✅ Login imediato bem-sucedido!')
      
      // 3. Criar perfil enquanto logado
      console.log('\n3️⃣ Criando perfil enquanto logado...')
      const { data, error } = await supabase
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
      
      if (!error) {
        profileCreated = true
        profileResult = data
        console.log('✅ Perfil criado:', data)
      } else {
        console.error('❌ Erro ao criar perfil:', error.message)
      }
      
      // Fazer logout
      await supabase.auth.signOut()
      console.log('🚪 Logout realizado')
    } else {
      console.log('⚠️ Login imediato falhou:', loginError.message)
    }
    
    if (!profileCreated) {
      // Criar registro temporário
      profileResult = {
        id: authData.user.id,
        email: testUser.email,
        full_name: testUser.full_name,
        display_name: testUser.display_name,
        phone: testUser.phone,
        cargo: testUser.cargo,
        role: testUser.role,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      console.log('📝 Registro temporário criado para sincronização futura')
    }
    
    // 4. Verificar lista de perfis
    console.log('\n4️⃣ Verificando lista de perfis...')
    const { data: profiles, error: listError } = await supabase
      .from('profiles')
      .select('*')
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
    
    // 5. Resumo final
    console.log('\n📊 RESUMO FINAL:')
    console.log('✅ Usuário de autenticação criado')
    console.log(profileCreated ? '✅ Perfil criado no banco' : '⚠️ Perfil será sincronizado no primeiro login')
    console.log(loginError ? '⚠️ Login requer confirmação de email' : '✅ Login funcionando')
    console.log('\n💡 PRÓXIMOS PASSOS:')
    if (!profileCreated) {
      console.log('1. Confirmar email no Supabase Dashboard')
      console.log('2. Configurar políticas RLS adequadas')
      console.log('3. Ou desabilitar confirmação de email no Supabase')
    } else {
      console.log('1. Implementação funcionando corretamente!')
      console.log('2. Usuários podem ser criados e fazer login')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testFinalImplementation()