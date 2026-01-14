# 🚀 APLICAR MIGRATION - Escala FDS

## 📍 Acesse o Supabase Dashboard

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Navegue até: **SQL Editor** (ícone de código na barra lateral)

---

## 🔄 EXECUTAR MIGRATION

### Copie e Cole no SQL Editor:

Abra o arquivo:

```
supabase/migrations/20260114000000_create_weekend_teams.sql
```

Copie TODO o conteúdo e cole no SQL Editor, depois clique em **RUN**.

### ✅ Sucesso esperado:

- `CREATE TABLE weekend_teams...`
- `ALTER TABLE weekend_teams ENABLE ROW LEVEL SECURITY`
- `CREATE POLICY` (4 policies)
- `CREATE INDEX`
- `CREATE FUNCTION`
- `CREATE TRIGGER`

Todas as queries devem executar sem erros.

---

## 🧪 TESTAR A FUNCIONALIDADE

### 1. Teste Desktop

1. Acesse `/escala-fds` no navegador
2. Selecione um fim de semana (ex: 18-19/01)
3. Preencha alguns campos (Chefe, Jornalistas, etc.)
4. Aguarde o salvamento automático
5. Verifique no Supabase Dashboard → Table Editor → `weekend_teams`

### 2. Teste Mobile

1. Abra o mesmo usuário em outro dispositivo/navegador
2. Acesse `/escala-fds`
3. Selecione o mesmo fim de semana
4. **ESPERADO**: Ver os dados preenchidos no desktop! ✅

### 3. Teste Sincronização em Tempo Real

1. Abra em duas abas diferentes
2. Modif ique dados em uma aba
3. **ESPERADO**: Ver atualização automática na outra aba ✅

---

## 📝 Observações

- Os dados antigos do localStorage **não serão migrados automaticamente**
- Esses dados estão salvos apenas localmente no navegador
- Após a migration, o sistema usará apenas o Supabase
- Será necessário re-preencher escalas antigas, se necessário

---

## ⚠️ Permissões

- **Visualização**: Todos os usuários autenticados
- **Edição**: Apenas administradores e usuários com escopo `escala_fds_admin`

---

## 🔧 Após Aplicar a Migration

Para remover os warnings de TypeScript:

```bash
npx supabase gen types typescript --project-id [SEU_PROJECT_ID] > src/integrations/supabase/types.ts
```

Isso regenerará os tipos com a nova tabela `weekend_teams`.
