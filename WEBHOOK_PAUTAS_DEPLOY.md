# Deploy do Webhook de Pautas

## Arquivos Criados

### 1. Edge Function

- **Local**: `supabase/functions/send-pauta-webhook/index.ts`
- **Descrição**: Função que recebe notificação do trigger e envia webhook para Growave

### 2. Database Migration

- **Local**: `supabase/migrations/20260113210500_create_pauta_webhook_trigger.sql`
- **Descrição**: Cria trigger que detecta mudanças na equipe e invoca a Edge Function

### 3. Frontend

- **Local**: `src/components/pautas/EventModal.tsx`
- **Descrição**: Adicionado campo editável "Nome da Pauta"

## Como fazer Deploy

### Passo 1: Deploy da Edge Function

#### Opção A: Via Supabase CLI (Recomendado)

```bash
# Fazer login no Supabase
supabase login

# Fazer deploy da função
supabase functions deploy send-pauta-webhook --project-ref SEU_PROJECT_REF
```

#### Opção B: Via Dashboard do Supabase

1. Acesse https://supabase.com/dashboard
2. Vá em **Edge Functions**
3. Clique em **Create a new function**
4. Nome: `send-pauta-webhook`
5. Cole o conteúdo do arquivo `supabase/functions/send-pauta-webhook/index.ts`
6. Deploy

### Passo 2: Configurar Variáveis de Ambiente

A Edge Function já tem acesso automático às variáveis:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Não é necessário configurar nada adicional.

### Passo 3: Configurar Settings do Supabase

No banco de dados, execute:

```sql
-- Configurar URL do Supabase
ALTER DATABASE postgres SET app.settings.supabase_url TO 'https://SEU_PROJECT_ID.supabase.co';

-- Configurar chave anon do Supabase
ALTER DATABASE postgres SET app.settings.supabase_anon_key TO 'SUA_ANON_KEY';
```

**Importante**: Substitua `SEU_PROJECT_ID` e `SUA_ANON_KEY` pelos valores reais do seu projeto.

### Passo 4: Aplicar Migration

#### Via Supabase CLI:

```bash
supabase db push
```

#### Via SQL Editor no Dashboard:

1. Acesse o **SQL Editor** no dashboard do Supabase
2. Cole o conteúdo do arquivo `supabase/migrations/20260113210500_create_pauta_webhook_trigger.sql`
3. Execute

## Testando o Webhook

1. Acesse a página de **Pautas**
2. Crie uma nova pauta ou edite uma existente
3. Preencha o campo "Nome da Pauta"
4. Selecione pelo menos um membro da equipe (Filmmaker, Fotógrafo, Jornalista ou Rede)
5. Salve

**Verificação**:

- O webhook deve ser disparado automaticamente
- Verifique os logs da Edge Function no dashboard do Supabase
- Verifique se o endpoint do Growave recebeu os dados

## Formato do Payload

O webhook envia um JSON com a seguinte estrutura:

```json
{
  "nome_pauta": "Nome da Pauta",
  "data": "2026-01-13T10:00:00Z",
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
}
```

## Troubleshooting

### Edge Function não está sendo chamada

- Verifique se a migration foi aplicada corretamente
- Verifique se as configurações `app.settings.supabase_url` e `app.settings.supabase_anon_key` estão corretas
- Verifique os logs do trigger no Supabase

### Webhook não está sendo recebido no Growave

- Verifique os logs da Edge Function
- Teste o endpoint manualmente com curl ou Postman
- Verifique se o URL está correto: `https://webhooks.growave.com.br/webhook/PAUTAS`

### Membros não têm telefone

- Isso é esperado! O webhook é enviado mesmo se alguns membros não tiverem telefone cadastrado
- O campo `telefone` será `null` no JSON
