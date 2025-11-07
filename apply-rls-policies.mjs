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

async function applyRLSPolicies() {
  console.log('🔒 Aplicando políticas RLS...\n')
  
  const policies = [
    // Políticas para profiles
    `CREATE POLICY "Users can create their own profile" ON profiles
     FOR INSERT WITH CHECK (auth.uid() = id)`,
    
    `CREATE POLICY "Users can view all profiles" ON profiles
     FOR SELECT USING (true)`,
    
    `CREATE POLICY "Users can update their own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id)`,
    
    // Políticas para user_roles
    `CREATE POLICY "Users can create their own user_role" ON user_roles
     FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    
    `CREATE POLICY "Users can view all user_roles" ON user_roles
     FOR SELECT USING (true)`,
    
    `CREATE POLICY "Users can update their own user_role" ON user_roles
     FOR UPDATE USING (auth.uid() = user_id)`
  ]
  
  try {
    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i]
      console.log(`${i + 1}️⃣ Aplicando política ${i + 1}...`)
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: policy })
      
      if (error) {
        console.log(`⚠️ Erro na política ${i + 1}:`, error.message)
        if (error.message.includes('already exists')) {
          console.log('   (Política já existe - OK)')
        }
      } else {
        console.log(`✅ Política ${i + 1} aplicada com sucesso`)
      }
    }
    
    console.log('\n🎉 Políticas RLS configuradas!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
    console.log('\n💡 Tentativa alternativa: aplicar políticas manualmente no Supabase Dashboard')
    console.log('   SQL > Editor > Cole o conteúdo do arquivo fix-rls-for-user-creation.sql')
  }
}

applyRLSPolicies()