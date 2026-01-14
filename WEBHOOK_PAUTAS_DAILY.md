# Webhook Diário de Pautas

## 📋 O que faz?

Todos os dias **às 18h (horário de Brasília)**, o sistema automaticamente:

1. Busca **todas as pautas** programadas para o **dia seguinte**
2. Monta um payload JSON com todas as informações
3. Envia para o webhook: `https://webhooks.growave.com.br/webhook/PAUTAS`

## 🎯 Exemplo

- **Hoje**: 14 de Janeiro de 2026, 18:00h
- **Ação**: Sistema busca todas as pautas do dia **15 de Janeiro** e envia o webhook

## 📦 Formato do Payload

O webhook envia um JSON com a seguinte estrutura:

```json
{
  "tipo": "resumo_diario",
  "data_pautas": "2026-01-15",
  "total": 3,
  "pautas": [
    {
      "id": "uuid-da-pauta-1",
      "nome_pauta": "Cobertura Event X",
      "data": "2026-01-15T10:00:00Z",
      "equipe": [
        {
          "funcao": "Filmmaker",
          "nome": "João Silva",
          "telefone": "+55 11 98765-4321"
        },
        {
          "funcao": "Fotógrafo",
          "nome": "Maria Santos",
          "telefone": "+55 11 91234-5678"
        }
      ]
    },
    {
      "id": "uuid-da-pauta-2",
      "nome_pauta": "Reunião Cliente Y",
      "data": "2026-01-15T14:00:00Z",
      "equipe": [
        {
          "funcao": "Jornalista",
          "nome": "Pedro Oliveira",
          "telefone": "+55 11 99999-8888"
        }
      ]
    },
    {
      "id": "uuid-da-pauta-3",
      "nome_pauta": "Gravação Produto Z",
      "data": "2026-01-15T16:30:00Z",
      "equipe": [
        {
          "funcao": "Filmmaker",
          "nome": "Ana Costa",
          "telefone": "+55 11 97777-6666"
        },
        {
          "funcao": "Rede",
          "nome": "Carlos Souza",
          "telefone": "+55 11 96666-5555"
        }
      ]
    }
  ]
}
```

## 🚀 Como fazer Deploy

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# Aplicar a migration
supabase db push
```

### Opção 2: Via Dashboard do Supabase

1. Acesse o **SQL Editor** no dashboard
2. Copie e cole o conteúdo do arquivo `supabase/migrations/20260114180000_daily_pautas_webhook.sql`
3. Execute a migration

## ✅ Como Testar

### Teste Manual Imediato

Execute no SQL Editor:

```sql
SELECT public.test_daily_pautas_webhook();
```

Isso vai:

- Buscar as pautas do **dia seguinte** (como se fosse 18h de hoje)
- Enviar o webhook imediatamente
- Retornar um JSON confirmando o envio

### Verificar Pautas que Seriam Enviadas

Para ver quais pautas seriam enviadas amanhã:

```sql
SELECT
  id,
  titulo,
  data_inicio,
  filmmaker_id,
  fotografo_id,
  jornalista_id,
  rede_id
FROM public.pautas_events
WHERE data_inicio >= (CURRENT_DATE + INTERVAL '1 day') AT TIME ZONE 'America/Sao_Paulo'
  AND data_inicio < (CURRENT_DATE + INTERVAL '2 days') AT TIME ZONE 'America/Sao_Paulo'
ORDER BY data_inicio;
```

### Verificar o Job Agendado

```sql
-- Ver se o job está ativo
SELECT * FROM cron.job WHERE jobname = 'send-daily-pautas-webhook';
```

### Ver Histórico de Execuções

```sql
SELECT
  jobid,
  runid,
  status,
  start_time,
  end_time,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-daily-pautas-webhook')
ORDER BY start_time DESC
LIMIT 10;
```

## 🔧 Gerenciamento do Job

### Desabilitar Temporariamente

```sql
SELECT cron.unschedule('send-daily-pautas-webhook');
```

### Reabilitar

```sql
SELECT cron.schedule(
  'send-daily-pautas-webhook',
  '0 21 * * *',  -- 21h UTC = 18h Brasília
  'SELECT public.send_daily_pautas_webhook();'
);
```

### Alterar o Horário

Por exemplo, para enviar às **17h** ao invés de 18h:

```sql
-- Remover job atual
SELECT cron.unschedule('send-daily-pautas-webhook');

-- Criar com novo horário (20h UTC = 17h Brasília)
SELECT cron.schedule(
  'send-daily-pautas-webhook',
  '0 20 * * *',
  'SELECT public.send_daily_pautas_webhook();'
);
```

## ⚠️ Observações Importantes

### Horário de Verão

O Supabase usa **UTC** como fuso horário padrão. A conversão é:

- **18h Brasília (UTC-3)** = **21h UTC**

Se houver horário de verão em sua região, ajuste conforme necessário.

### Pautas Sem Equipe

- O webhook é enviado **mesmo que algumas pautas não tenham equipe completa**
- Campos de membros ausentes simplesmente não aparecerão no array `equipe`

### Nenhuma Pauta para Amanhã

- Se **não houver pautas** para o dia seguinte, o webhook **NÃO é enviado**
- Isso economiza recursos e evita notificações vazias

### Logs e Debug

A função gera logs com `RAISE NOTICE`. Para vê-los:

1. No Supabase Dashboard, vá em **Database** > **Logs**
2. Ou execute o teste manual e verifique o output

## 📊 Diferença entre Webhooks

### Webhook Existente (por atualização)

- **Quando**: Toda vez que uma pauta é **criada** ou **editada**
- **O que envia**: Dados de **UMA pauta específica**
- **Gatilho**: Trigger `on_pauta_team_change`

### Webhook Novo (resumo diário)

- **Quando**: Todos os dias **às 18h**
- **O que envia**: **TODAS as pautas** do dia seguinte
- **Gatilho**: Cron job `send-daily-pautas-webhook`

**Ambos continuam funcionando independentemente!** 🎉

## 🐛 Troubleshooting

### Webhook não está sendo enviado

1. Verifique se o job está ativo:

```sql
SELECT * FROM cron.job WHERE jobname = 'send-daily-pautas-webhook';
```

2. Verifique os logs de execução:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-daily-pautas-webhook')
ORDER BY start_time DESC LIMIT 5;
```

3. Teste manualmente:

```sql
SELECT public.test_daily_pautas_webhook();
```

### Extensão pg_cron não encontrada

Se você estiver usando Supabase, o `pg_cron` já está disponível por padrão. Mas se houver erro:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Extensão HTTP não encontrada

```sql
CREATE EXTENSION IF NOT EXISTS http;
```

## 📝 Notas Finais

- O job roda **automaticamente** todos os dias, não precisa de intervenção manual
- É possível ver o histórico completo de execuções
- A função pode ser testada a qualquer momento sem interferir no job agendado
- O payload inclui um campo `tipo: "resumo_diario"` para diferenciar dos webhooks individuais
