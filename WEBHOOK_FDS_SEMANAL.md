# Webhook Semanal da Escala de Final de Semana

## 📋 O que faz?

Toda **quinta-feira às 17:58 (horário de Brasília)**, o sistema automaticamente:

1. Busca a **escala do próximo final de semana** (sábado e domingo seguinte)
2. Para cada membro da equipe, busca nome completo e telefone
3. Monta um payload JSON com todas as informações
4. Envia para o webhook: `https://webhooks.growave.com.br/webhook/pautas-fds`

## 🎯 Exemplo

- **Hoje**: Quinta-feira, 22 de Janeiro de 2026, 17:58h
- **Ação**: Sistema busca a escala do final de semana **25-26 de Janeiro** e envia o webhook

## 📦 Formato do Payload

O webhook envia um JSON com a seguinte estrutura:

```json
{
  "tipo": "escala_fds",
  "weekend_key": "2026-01-25",
  "data_sabado": "2026-01-25",
  "data_domingo": "2026-01-26",
  "equipe": {
    "chefe": {
      "nome": "João Silva",
      "telefone": "+55 11 99999-9999"
    },
    "rede": {
      "nome": "Maria Santos",
      "telefone": "+55 11 88888-8888"
    },
    "fotografo": {
      "nome": "Pedro Oliveira",
      "telefone": "+55 11 77777-7777"
    },
    "filmmaker": {
      "nome": "Ana Costa",
      "telefone": "+55 11 66666-6666"
    },
    "edicao": {
      "nome": "Carlos Souza",
      "telefone": "+55 11 55555-5555"
    },
    "designer": {
      "nome": "Juliana Lima",
      "telefone": "+55 11 44444-4444"
    },
    "jornalistas": [
      {
        "nome": "Roberto Alves",
        "telefone": "+55 11 33333-3333"
      },
      {
        "nome": "Fernanda Dias",
        "telefone": "+55 11 22222-2222"
      }
    ],
    "tamoios": [
      {
        "nome": "Lucas Ferreira",
        "telefone": "+55 11 11111-1111"
      }
    ]
  },
  "notes": "Observações sobre a escala"
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
2. Copie e cole o conteúdo do arquivo `supabase/migrations/20260122000000_weekly_fds_webhook.sql`
3. Execute a migration

## ✅ Como Testar

### Teste Manual Imediato

Execute no SQL Editor:

```sql
SELECT public.test_weekly_fds_webhook();
```

Isso vai:

- Buscar a escala do **próximo final de semana** (como se fosse quinta às 17:58)
- Enviar o webhook imediatamente
- Retornar um JSON confirmando o envio

### Verificar Escala que Seria Enviada

Para ver qual escala seria enviada no próximo final de semana:

```sql
-- Calcular a data do próximo sábado
WITH next_saturday AS (
  SELECT CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER) % 7) AS saturday
)
SELECT
  weekend_key,
  chefe,
  rede,
  fotografo,
  filmmaker,
  edicao,
  designer,
  jornalistas,
  tamoios,
  notes
FROM public.weekend_teams
WHERE weekend_key = (SELECT saturday::TEXT FROM next_saturday);
```

### Verificar o Job Agendado

```sql
-- Ver se o job está ativo
SELECT * FROM cron.job WHERE jobname = 'send-weekly-fds-webhook';
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
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-weekly-fds-webhook')
ORDER BY start_time DESC
LIMIT 10;
```

## 🔧 Gerenciamento do Job

### Desabilitar Temporariamente

```sql
SELECT cron.unschedule('send-weekly-fds-webhook');
```

### Reabilitar

```sql
SELECT cron.schedule(
  'send-weekly-fds-webhook',
  '58 20 * * 4',  -- 20:58 UTC de quinta = 17:58 Brasília
  'SELECT public.send_weekly_fds_webhook();'
);
```

### Alterar o Horário

Por exemplo, para enviar às **18h de quinta** ao invés de 17:58:

```sql
-- Remover job atual
SELECT cron.unschedule('send-weekly-fds-webhook');

-- Criar com novo horário (20h UTC = 17h Brasília)
SELECT cron.schedule(
  'send-weekly-fds-webhook',
  '0 20 * * 5',
  'SELECT public.send_weekly_fds_webhook();'
);
```

## ⚠️ Observações Importantes

### Horário de Verão

O Supabase usa **UTC** como fuso horário padrão. A conversão é:

- **17:58 Brasília (UTC-3)** = **20:58 UTC**

Se houver horário de verão em sua região, ajuste conforme necessário.

### Escala Não Cadastrada

- Se **não houver escala cadastrada** para o próximo final de semana, o webhook **NÃO é enviado**
- Isso economiza recursos e evita notificações vazias

### Campos Opcionais

- Campos de membros ausentes simplesmente não aparecerão no objeto `equipe`
- Arrays vazios (`jornalistas` e `tamoios`) não aparecerão no payload se não houver membros

### Logs e Debug

A função gera logs com `RAISE NOTICE`. Para vê-los:

1. No Supabase Dashboard, vá em **Database** > **Logs**
2. Ou execute o teste manual e verifique o output

## 📊 Como Funciona o Cron

### Expressão Cron: `58 20 * * 4`

- `58` = minuto 58
- `20` = hora 20 (UTC)
- `*` = todos os dias do mês
- `*` = todos os meses
- `4` = quinta-feira (0 = domingo, 1 = segunda, ..., 4 = quinta)

**Resumo**: Executa toda quinta-feira às 20:58 UTC (17:58 Brasília)

### Cálculo do Próximo Sábado

A função calcula automaticamente o próximo sábado:

- Se hoje é quinta-feira, pega o sábado de **daqui a 2 dias**
- Caso contrário, pega o **próximo sábado**

## 🐛 Troubleshooting

### Webhook não está sendo enviado

1. Verifique se o job está ativo:

```sql
SELECT * FROM cron.job WHERE jobname = 'send-weekly-fds-webhook';
```

2. Verifique os logs de execução:

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-weekly-fds-webhook')
ORDER BY start_time DESC LIMIT 5;
```

3. Teste manualmente:

```sql
SELECT public.test_weekly_fds_webhook();
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

### Escala não está sendo enviada

Verifique se a escala está cadastrada para o próximo final de semana:

```sql
SELECT * FROM weekend_teams
WHERE weekend_key >= CURRENT_DATE::TEXT
ORDER BY weekend_key;
```

## 📝 Notas Finais

- O job roda **automaticamente** toda quinta-feira às 17:58, não precisa de intervenção manual
- É possível ver o histórico completo de execuções
- A função pode ser testada a qualquer momento sem interferir no job agendado
- O payload inclui um campo `tipo: "escala_fds"` para identificar o tipo de webhook
- O webhook só é enviado se houver uma escala cadastrada para o próximo final de semana
