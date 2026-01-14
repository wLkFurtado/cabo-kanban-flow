# 🔧 Guia de Execução - Correção de Exclusão em Cascata

## 📋 Ordem de Execução

Execute os scripts nesta ordem exata:

### 1️⃣ **DIAGNÓSTICO** (Antes de qualquer alteração)

```bash
# No Supabase Dashboard > SQL Editor, execute:
scripts/diagnostic_orphaned_profiles.sql
```

**O que ele faz:**

- Lista perfis órfãos (que não existem mais no auth.users)
- Mostra perfis que têm atividades ou contatos institucionais
- Identifica registros órfãos que apontam para perfis inexistentes

---

### 2️⃣ **MIGRATION** (Corrige as foreign keys)

```bash
# Aplicar via Supabase CLI
cd /Users/wallker/Library/CloudStorage/GoogleDrive-wallkerfurtado@gmail.com/Meu\ Drive/cabo-kanban-flow
supabase db push
```

**O que faz:**

- Remove constraints antigas sem ON DELETE
- Adiciona constraints com ON DELETE SET NULL em:
  - `card_activities.user_id`
  - `institutional_contacts.created_by`

---

### 3️⃣ **LIMPEZA** (Remove dados órfãos)

```bash
# No Supabase Dashboard > SQL Editor, execute:
scripts/cleanup_orphaned_data.sql
```

**O que faz:**

- Atualiza atividades órfãs (seta user_id = NULL)
- Atualiza contatos institucionais órfãos (seta created_by = NULL)
- **EXCLUI** perfis que não existem em auth.users

⚠️ **ATENÇÃO**: Este script faz exclusões permanentes!

---

### 4️⃣ **VERIFICAÇÃO FINAL**

```bash
# Execute o diagnóstico novamente:
scripts/diagnostic_orphaned_profiles.sql
```

**Resultado esperado:**

- ✅ 0 perfis órfãos
- ✅ 0 atividades órfãs
- ✅ 0 contatos institucionais órfãos

---

## 🧪 Teste Manual

Após executar tudo:

1. Acesse a aba **Contatos** no sistema
2. Selecione um contato qualquer
3. Clique em **Excluir**
4. Confirme a exclusão
5. ✅ O contato deve sumir da lista
6. ✅ O registro deve ser excluído do banco de dados
7. ✅ As atividades relacionadas devem ter `user_id = NULL`

---

## 📊 Arquivos Criados

- ✅ `scripts/diagnostic_orphaned_profiles.sql` - Diagnóstico completo
- ✅ `supabase/migrations/20260113200000_fix_cascade_delete_profiles.sql` - Migration
- ✅ `scripts/cleanup_orphaned_data.sql` - Limpeza de dados órfãos
