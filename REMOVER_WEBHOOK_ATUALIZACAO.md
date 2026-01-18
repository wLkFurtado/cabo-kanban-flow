# Aplicar Remoção do Webhook de Atualização

## Problema

O webhook está sendo disparado toda vez que as pautas são atualizadas. Isso acontece porque existe um trigger `on_pauta_team_change` que escuta mudanças na tabela `pautas_events`.

## Solução

Remover o trigger para que o webhook seja enviado apenas no horário agendado (18h diariamente).

## Como Aplicar

### Opção 1: Via Supabase SQL Editor (Recomendado)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/ankliiywmcpncymdlvaa/sql/new)
2. Copie e execute o seguinte SQL:

```sql
-- REMOVER O TRIGGER
DROP TRIGGER IF EXISTS on_pauta_team_change ON public.pautas_events;

-- REMOVER AS FUNÇÕES RELACIONADAS
DROP FUNCTION IF EXISTS public.send_pauta_webhook_direct();
DROP FUNCTION IF EXISTS public.trigger_pauta_webhook();
```

3. Clique em "Run" para executar

### Opção 2: Via CLI (se o link funcionar)

```bash
cd "/Users/wallker/Library/CloudStorage/GoogleDrive-wallkerfurtado@gmail.com/Meu Drive/cabo-kanban-flow"
npx supabase db push
```

## Verificar

Após executar, você pode verificar se o trigger foi removido executando:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_pauta_team_change';
```

Deve retornar nenhum resultado.

## Comportamento Após a Mudança

✅ **Webhook será enviado:**

- Todos os dias às 18h (hora de Brasília)
- Com resumo de todas as pautas do dia seguinte

❌ **Webhook NÃO será mais enviado:**

- Ao atualizar uma pauta
- Ao inserir nova pauta
- Ao modificar membros da equipe
- Ao atualizar a página

## Migration Criada

📄 [`20260115103700_remove_pauta_update_webhook.sql`](file:///Users/wallker/Library/CloudStorage/GoogleDrive-wallkerfurtado@gmail.com/Meu%20Drive/cabo-kanban-flow/supabase/migrations/20260115103700_remove_pauta_update_webhook.sql)
