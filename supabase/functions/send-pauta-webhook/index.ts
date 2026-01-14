// Edge Function para enviar webhook quando equipe for escolhida em uma pauta
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const WEBHOOK_URL = "https://webhooks.growave.com.br/webhook/PAUTAS"

interface TeamMember {
  funcao: string
  nome: string
  telefone: string | null
}

interface WebhookPayload {
  nome_pauta: string
  data: string
  equipe: TeamMember[]
}

serve(async (req) => {
  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Receber dados da pauta
    const { pauta_id } = await req.json()

    if (!pauta_id) {
      return new Response(
        JSON.stringify({ error: 'pauta_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar dados da pauta
    const { data: pauta, error: pautaError } = await supabase
      .from('pautas_events')
      .select('id, titulo, data_inicio, filmmaker_id, fotografo_id, jornalista_id, rede_id')
      .eq('id', pauta_id)
      .single()

    if (pautaError) {
      console.error('Error fetching pauta:', pautaError)
      return new Response(
        JSON.stringify({ error: 'Pauta not found', details: pautaError }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se há pelo menos um membro da equipe selecionado
    if (!pauta.filmmaker_id && !pauta.fotografo_id && !pauta.jornalista_id && !pauta.rede_id) {
      console.log('No team members selected, skipping webhook')
      return new Response(
        JSON.stringify({ message: 'No team members selected, webhook not sent' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Coletar IDs dos membros da equipe
    const teamMemberIds = [
      { id: pauta.filmmaker_id, funcao: 'Filmmaker' },
      { id: pauta.fotografo_id, funcao: 'Fotógrafo' },
      { id: pauta.jornalista_id, funcao: 'Jornalista' },
      { id: pauta.rede_id, funcao: 'Rede' }
    ].filter(member => member.id !== null)

    // Buscar dados dos membros
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', teamMemberIds.map(m => m.id))

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return new Response(
        JSON.stringify({ error: 'Error fetching team members', details: profilesError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Montar array de equipe com nome e telefone
    const equipe: TeamMember[] = teamMemberIds.map(member => {
      const profile = profiles?.find(p => p.id === member.id)
      return {
        funcao: member.funcao,
        nome: profile?.full_name || 'Nome não disponível',
        telefone: profile?.phone || null
      }
    })

    // Montar payload do webhook
    const payload: WebhookPayload = {
      nome_pauta: pauta.titulo || 'Evento',
      data: pauta.data_inicio,
      equipe
    }

    console.log('Sending webhook with payload:', JSON.stringify(payload, null, 2))

    // Enviar webhook
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const webhookResponseText = await webhookResponse.text()

    if (!webhookResponse.ok) {
      console.error('Webhook failed:', webhookResponse.status, webhookResponseText)
      return new Response(
        JSON.stringify({ 
          error: 'Webhook request failed', 
          status: webhookResponse.status,
          response: webhookResponseText
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('Webhook sent successfully:', webhookResponseText)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook sent successfully',
        payload,
        response: webhookResponseText
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
