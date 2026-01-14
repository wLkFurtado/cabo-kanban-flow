# 🚀 INSTRUÇÕES RÁPIDAS - Executar no Supabase Dashboard

Como o Supabase CLI não está instalado, execute os scripts diretamente no **Supabase Dashboard**.

## 📍 Acesse o Supabase Dashboard

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Navegue até: **SQL Editor** (ícone de código na barra lateral)

---

## 🔄 PASSO A PASSO

### PASSO 1: Diagnóstico Inicial

**Copie e cole no SQL Editor:**

```sql
-- Abra o arquivo: scripts/diagnostic_orphaned_profiles.sql
-- Copie TODO o conteúdo e cole no SQL Editor
-- Clique em RUN
```

📊 **O que observar:**

- Quantos perfis órfãos existem?
- Quantas atividades órfãs?
- Quantos contatos institucionais órfãos?

**Anote os resultados!**

---

### PASSO 2: Aplicar Migration (CORREÇÃO)

**Copie e cole no SQL Editor:**

```sql
-- Abra o arquivo: supabase/migrations/20260113200000_fix_cascade_delete_profiles.sql
-- Copie TODO o conteúdo e cole no SQL Editor
-- Clique em RUN
```

✅ **Sucesso esperado:**

- BEGIN
- ALTER TABLE... (várias vezes)
- COMMIT
- Tabela com as constraints atualizadas

---

### PASSO 3: Limpeza de Dados Órfãos

**Copie e cole no SQL Editor:**

```sql
-- Abra o arquivo: scripts/cleanup_orphaned_data.sql
-- Copie TODO o conteúdo e cole no SQL Editor
-- Clique em RUN
```

⚠️ **ATENÇÃO:** Este passo **EXCLUI DADOS PERMANENTEMENTE**!

✅ **Sucesso esperado:**

- BEGIN
- UPDATE... (atividades e contatos)
- DELETE... (perfis órfãos)
- COMMIT
- Verificações retornam 0

---

### PASSO 4: Verificação Final

**Execute o diagnóstico novamente:**

```sql
-- Copie e cole novamente: scripts/diagnostic_orphaned_profiles.sql
-- Clique em RUN
```

✅ **Resultado esperado:** TODOS os contadores devem ser **0**

---

## 📝 Localização dos Arquivos

Todos os scripts estão em:

```
/Users/wallker/Library/CloudStorage/GoogleDrive-wallkerfurtado@gmail.com/Meu Drive/cabo-kanban-flow/
```

- `scripts/diagnostic_orphaned_profiles.sql` - Diagnóstico
- `supabase/migrations/20260113200000_fix_cascade_delete_profiles.sql` - Correção
- `scripts/cleanup_orphaned_data.sql` - Limpeza

---

## 🧪 Teste Final

Depois de tudo:

1. Vá para a aba **Contatos** no sistema
2. Delete um contato
3. ✅ Deve sumir da lista
4. ✅ Deve ser excluído do banco
5. ✅ Sem erros no console

---

## ❓ Em caso de dúvida

- Cada script tem comentários explicativos
- Execute um passo de cada vez
- **SEMPRE** rode o diagnóstico ANTES e DEPOIS
- Se algo der errado, entre em contato antes de prosseguir
