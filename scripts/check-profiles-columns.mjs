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

async function checkProfilesStructure() {
  console.log('🔍 Verificando estrutura da tabela profiles...\n')
  
  try {
    // Tentar buscar um perfil para ver as colunas disponíveis
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao consultar profiles:', error.message)
    } else {
      console.log('✅ Consulta bem-sucedida')
      if (data && data.length > 0) {
        console.log('📋 Colunas disponíveis na tabela profiles:')
        Object.keys(data[0]).forEach(column => {
          console.log(`  - ${column}`)
        })
      } else {
        console.log('📋 Tabela vazia, tentando inserir um registro de teste...')
        
        // Tentar inserir sem a coluna cargo
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: crypto.randomUUID(),
            email: 'teste-estrutura@exemplo.com',
            full_name: 'Teste Estrutura',
            display_name: 'Teste',
            phone: '123456789',
            role: 'user'
          })
          .select()
          .single()
        
        if (insertError) {
          console.error('❌ Erro ao inserir teste:', insertError.message)
          console.log('💡 Isso nos ajuda a entender a estrutura da tabela')
        } else {
          console.log('✅ Inserção de teste bem-sucedida')
          console.log('📋 Colunas disponíveis:')
          Object.keys(insertData).forEach(column => {
            console.log(`  - ${column}`)
          })
          
          // Remover o registro de teste
          await supabase.from('profiles').delete().eq('id', insertData.id)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

checkProfilesStructure()